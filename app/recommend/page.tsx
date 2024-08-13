'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import Camera from '@/components/Camera'
import {
  AddInputForm,
  InputForm,
  SelectForm,
  ToggleForm,
} from '@/components/InputForm'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { TrashIcon } from '@radix-ui/react-icons'

const formSchema = z.object({
  carbornNetural: z.boolean(), // boolean 타입
  ingredients: z
    .array(z.string())
    .min(1, { message: '최소한 하나의 재료를 추가해야 합니다.' }), // string 배열, 최소 길이 1
  recipeLevel: z.enum(['easy', 'Intermediate', 'Advanced'], {
    message: '레시피 난이도를 선택해야 합니다.',
  }), // 'easy', 'Intermediate', 'Advanced' 중 하나
  cookingTime: z
    .string()
    .regex(/^\d+$/, '시간은 숫자로 입력해야 합니다.') // 숫자 형식의 문자열
    .refine((val) => parseInt(val) > 0, {
      message: '조리 시간은 0분보다 커야합니다.',
    }), // 1보다 큰 정수여야 함
  serve: z
    .string()
    .regex(/^\d+$/, '인원 수는 숫자로 입력해야 합니다.') // 숫자 형식의 문자열
    .refine((val) => parseInt(val) > 0, {
      message: '인원 수는 0명보다 커야합니다.',
    }), // 1보다 큰 정수여야 함
})

export default function Recommend() {
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carbornNetural: false,
      ingredient: '',
      ingredients: [],
      recipeLevel: 'Intermediate',
      cookingTime: '',
      serve: '',
    },
  })

  const removeIngredient = (ingredientToRemove: string) => {
    const existingIngredients = form.getValues('ingredients') || []
    const updatedIngredients = existingIngredients.filter(
      (ingredient) => ingredient !== ingredientToRemove,
    )

    form.setValue('ingredients', updatedIngredients)
  }

  const onSubmit = () => {
    const formData = form.getValues()
    console.log('Form Data:', formData)
    toast({
      title: '레시피를 생성하고 있습니다.',
    })
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col justify-between h-[calc(100vh-200px)]"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div>
            <h5 className="text-md font-semibold">레시피 생성하기</h5>
            <p className="text-gray-400">
              선택된 식재료를 통해 레시피를 생성합니다.
            </p>
          </div>
          <h5 className="text-md font-semibold">탄소 레시피 설정</h5>
          <ToggleForm
            form={form}
            name="carbornNetural"
            label="탄소 중립 레시피"
            description="탄소중립 레시피란 음식을 조리하거나 소비할 때 발생하는 탄소 발자국을 최소화하여 환경에 미치는 영향을 줄이는 레시피를 의미합니다"
          />

          <h5 className="text-md font-semibold">식재료 설정</h5>
          <AddInputForm form={form} name="ingredient" label="식재료 추가" />
          <div className="flex flex-col gap-4">
            <Label>선택된 식재료</Label>
            {form.watch('ingredients').map((ingredient) => (
              <div className="flex justify-between">
                <p>{ingredient}</p>
                <TrashIcon
                  className="hover:cursor-pointer"
                  onClick={() => removeIngredient(ingredient)}
                  width={24}
                  height={24}
                />
              </div>
            ))}
            {form.watch('ingredients').length == 0 ? (
              <p
                className={cn(
                  form.getFieldState('ingredients').error
                    ? 'text-red-500'
                    : 'text-gray-400',
                )}
              >
                선택된 식재료가 없습니다.
              </p>
            ) : null}
          </div>

          <h5 className="text-md font-semibold">세부 레시피 설정</h5>
          <SelectForm
            form={form}
            name="recipeLevel"
            label="레시피 난이도"
            options={[
              { value: 'Easy', label: '쉬움' },
              { value: 'Intermediate', label: '보통' },
              { value: 'Advanced', label: '어려움' },
            ]}
          />
          <InputForm
            form={form}
            name="cookingTime"
            label="조리시간(분)"
            type="number"
          />
          <InputForm
            form={form}
            name="serve"
            label="식시량(인원수)"
            type="number"
          />
        </div>

        <div className="flex gap-4">
          <Camera initOpen={true} />
          <Button className="w-full" type="submit">
            레시피 생성하기
          </Button>
        </div>
      </form>
    </Form>
  )
}
