<script setup>
import { ref } from 'vue'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { Button, InputText, Password, Message, FloatLabel } from 'primevue'
import { Form } from '@primevue/forms'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
const toast = useToast()

const authStore = useAuthStore()
const router = useRouter()

const initialValues = ref({
  username: '',
  password: '',
})

const resolver = zodResolver(
  z.object({
    username: z
      .string()
      .min(5, { message: 'Введите имя пользователя (минимум 5 символов)' })
      .max(30, { message: 'Максимум 30 символов' }),
    password: z
      .string()
      .min(6, { message: 'Минимум 6 символов' })
      .max(16, { message: 'Максимум 16 символов' })
      .refine((value) => /[a-zа-я]/.test(value), {
        message: 'Необходима минимум 1 строчная буква',
      })
      .refine((value) => /[A-ZА-Я]/.test(value), {
        message: 'Необходима минимум 1 заглавная буква',
      })
      .refine((value) => /[0-9]/.test(value), {
        message: 'Необходима минимум 1 цифра',
      }),
  }),
)

const isLoading = ref(false)
const error = ref(null)

const onFormSubmit = async (e) => {
  // e.originalEvent: Represents the native form submit event.
  // e.valid: A boolean that indicates whether the form is valid or not.
  // e.states: Contains the current state of each form field, including validity status.
  // e.errors: An object that holds any validation errors for the invalid fields in the form.
  // e.values: An object containing the current values of all form fields.
  // e.reset: A function that resets the form to its initial state.

  if (e.valid) {
    console.log(initialValues.value)
    try {
      isLoading.value = true
      error.value = null
      await authStore.register(initialValues.value)
      toast.add({
        severity: 'success',
        summary: 'Вход осуществлён',
        detail: 'Приветствуем, ' + initialValues.value.username + '!',
        life: 3000,
      })
      setTimeout(function () {
        router.push('/')
      }, 3005)
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка входа',
        detail: 'Пользователь с таким именем уже существует',
        life: 3000,
      })
      error.value = authStore.error || 'Registration failed'
    } finally {
      isLoading.value = false
    }
  }
}
</script>
<template>
  <div
    class="flex flex-col bg-[url('../assets/patternCode.jpg')] bg-[length:65%_auto] lg:bg-[length:25%_auto] bg-repeat w-full min-h-lvh h-full dark:bg-[url('../assets/patternBlack.jpg')]"
  >
    <div class="flex-1 w-full bg-gray-500/20 dark:bg-black/85">
      <Toast class="pt-10" />
      <div
        class="w-full max-w-150 mx-auto min-h-min bg-white/85 backdrop-blur-sm rounded-lg mb-10 mt-30 shadow-xl dark:bg-surface-900/75"
      >
        <div class="">
          <h1 class="font-medium text-2xl text-gray-500 text-center pt-4">Регистрация</h1>
          <p class="font-medium text-sm text-gray-500 text-center pt-2">
            Создайте аккаунт, чтобы не потерять свой список дел:
          </p>
          <Form
            v-slot="$form"
            :initialValues
            :resolver
            @submit="onFormSubmit"
            class="flex flex-col gap-4 w-full mx-auto max-w-148 p-4"
          >
            <div class="flex flex-col gap-1">
              <FloatLabel variant="in" class="">
                <InputText name="username" type="text" fluid v-model="initialValues.username" />
                <label for="username">Имя пользователя</label>
              </FloatLabel>
              <Message
                v-if="$form.username?.invalid"
                severity="error"
                size="small"
                variant="simple"
                >{{ $form.username.error.message }}</Message
              >
            </div>
            <div class="flex flex-col gap-1">
              <FloatLabel variant="in" class="">
                <Password
                  name="password"
                  :feedback="false"
                  toggleMask
                  fluid
                  v-model="initialValues.password"
                />
                <label for="password">Пароль</label>
              </FloatLabel>
              <Message
                v-if="$form.password?.invalid"
                severity="error"
                size="small"
                variant="simple"
              >
                <ul class="my-0 flex flex-col gap-1">
                  <li v-for="(error, index) of $form.password.errors" :key="index">
                    {{ error.message }}
                  </li>
                </ul>
              </Message>
            </div>
            <Button type="submit" label="Готово" />
          </Form>
          <div class="flex flex-wrap justify-center pb-3">
            <p class="font-medium text-md text-gray-500 p-4">Уже есть аккаунт?</p>
            <RouterLink to="/login" class="pt-2">
              <Button label="Войдите здесь!" severity="secondary" icon="pi pi-sign-in" />
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
