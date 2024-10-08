import { prisma } from '@/prisma/prisma'
import { parseRecipeString } from '@/utils/recipe'
import { NextResponse } from 'next/server'

function filterVeganIngredients(ingredients: string[]): string[] {
  const vegan_mask: string[] = [
    '소고기',
    '돼지고기',
    '닭고기',
    '양고기',
    '오리고기',
    '거위고기',
    '사슴고기',
    '칠면조고기',
    '말고기',
    '토끼고기',
    '염소고기',
    '캥거루고기',
    '참치',
    '연어',
    '고등어',
    '청어',
    '명태',
    '대구',
    '새우',
    '랍스터',
    '게',
    '조개',
    '굴',
    '전복',
    '바지락',
    '오징어',
    '문어',
    '가리비',
    '성게',
    '해삼',
    '상어지느러미',
    '어란',
    '캐비어',
    '알류',
    '달걀',
    '우유',
    '치즈',
    '요거트',
    '버터',
    '생크림',
    '연유',
    '아이스크림',
    '크림치즈',
    '사워크림',
    '마요네즈',
    '꿀',
    '젤라틴',
    '카라멜색소',
    '코치닐',
    '이즈잉글라스',
    '젓갈',
    '액젓',
    '어묵',
    '명란젓',
    '밴댕이젓',
    '새우젓',
    '된장',
    '간장',
    '참기름',
    '고추기름',
    '굴소스',
    '오일류',
    '멸치',
    '한치',
    '꼴뚜기',
    '곱창',
    '소시지',
    '베이컨',
    '햄',
    '살라미',
    '페퍼로니',
    '파르마산 치즈',
    '리코타 치즈',
    '모짜렐라 치즈',
    '고르곤졸라 치즈',
    '까망베르 치즈',
    '브리 치즈',
    '프로볼로네 치즈',
    '에멘탈 치즈',
    '하바티 치즈',
    '체다 치즈',
    '페타 치즈',
    '로마노 치즈',
    '파머산 치즈',
    '슈라우트',
    '곤약젤리',
    '칵테일 소시지',
    '비엔나 소시지',
    '육포',
    '참기름',
    '들기름',
    '유자차',
    '조미료',
    '치킨스톡',
    '소고기스톡',
    '돼지기름',
    '라드',
    '마가린',
    '포도씨유',
  ]

  return ingredients.filter((ingredient) => !vegan_mask.includes(ingredient))
}

const apiKey = process.env.NEXT_PUBLIC_OPENAI_KEY
export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    // const ingredients = ['달걀']
    let ingredients = requestData.ingredients
    const isVegan = requestData.isVegan
    if (!apiKey) {
      console.error('API Key is missing')
      return NextResponse.json({ error: 'API Key is missing' }, { status: 500 })
    }

    if (isVegan) {
      ingredients = filterVeganIngredients(ingredients)
    }
    let ingredient = ''
    for (let i = 0; i < ingredients.length; i++) {
      ingredient += `"${ingredients[i]}", `
    }
    ingredient = ingredient.slice(0, -2)
    ingredient = `[${ingredient}]`

    const recipes: any[] = await prisma.$queryRaw`
  SELECT 
    recipe_id, 
    recipe_name, 
    view_count, 
    scrap_count, 
    ingredients, 
    servings, 
    difficulty, 
    cooking_time, 
    steps, 
    (
      0.4 * ((view_count - 12) / (15192 - 12)) +   
      0.3 * ((scrap_count - 116) / (462 - 116)) +  
      0.2 * ((5 - difficulty) / 4) +  
      0.1 * ((120 - cooking_time) / (120 - 5))  
    ) AS priority_score 
  FROM 
    recipes 
  WHERE 
    ingredients->'재료' @> ${ingredient}::jsonb 
  ORDER BY 
    priority_score DESC 
  LIMIT 5;
`

    if (recipes === null || recipes === undefined || recipes.length === 0) {
      return NextResponse.json(
        { message: 'No recipe found', data: recipes },
        { status: 200 },
      )
    }
    const id_match = {}
    for (let i = 0; i < recipes.length; i++) {
      const steps: any[] = recipes[i].steps
      for (let j = 0; j < steps.length; j++) {
        const key = `${recipes[i]['recipe_id']}-${j}`
        // @ts-ignore
        id_match[key] = steps[j]['image']
        steps[j]['image'] = key
      }
    }
    const prompt_data = JSON.stringify(recipes, null)
    let prompt = `
      다음은 ${'달걀'}을 이용해 만들 수 있는 요리 레시피 ${recipes.length}개이다.\n\n${prompt_data}\n
      참고:\n- view_count: 조회수(12 ~ 15192, mean: 6291)\n- scrap_count: 스크랩 횟수(116 ~ 462, mean: 145)\n- difficulty: 난이도(category: 1 ~ 5, 값이 클수록 어렵다)\n- cooking_time: 요리시간(분: 5 ~ 120, mean: 43), ${isVegan ? '사용자는 비건임으로 비건 음식을 추천해야 한다.' : ''}\n
      위 레시피를 기반으로 ${'달걀'}을 이용해 만들 수 있는 가장 적절한 레시피를 다음 규칙을 지켜 작성하여라.\n1. 어느 한 레시피만을 사용하지 말아라. 2개 이상의 레시피를 사용하여라.\n2. 작성된 레시피에서 사용된 재료들은 모두 ingredients에 명시하여라.\n3. "반드시" 아래와 같이 각 내용을 줄내림으로 구분하는 형식으로 작성하여라.\n
      recipe_name: 간장계란밥\ningredient: 밥, 계란, 간장, 김치, 미역, 참기름\nserving: 2\ndifficulty: 2\ncooking_time: 30\nsteps: [\nstep: 1 || subtitle: 계란 풀기 || image: 623561-1 || description: 밥을 넣고 계란을 풀어주세요.\n]\n`

    const apiUrl =
      'https://k-html-team07.openai.azure.com/openai/deployments/Team07/chat/completions?api-version=2024-02-15-preview'

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              '너는 한식, 일식, 중식, 양식에서 최고의 평가를 받은 전문 셰프이다.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })
    const data = await response.json()
    const json_str = data['choices'][0]['message']['content']
    const json = parseRecipeString(json_str)

    return NextResponse.json(
      {
        message: 'Ingredient added to user successfully',
        data: json,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error adding ingredient:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
