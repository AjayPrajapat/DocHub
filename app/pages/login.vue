<template>
  <div class="mx-auto max-w-md rounded-lg bg-white p-8 shadow">
    <h1 class="text-2xl font-semibold text-slate-800">Sign in</h1>
    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <div>
        <label class="block text-sm font-medium text-slate-700">Email</label>
        <input v-model="form.email" type="email" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700">Password</label>
        <input v-model="form.password" type="password" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <button type="submit" class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white" :disabled="pending">
        {{ pending ? 'Signing in…' : 'Sign in' }}
      </button>
      <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
const { login } = useAuth()
const router = useRouter()
const form = reactive({ email: '', password: '' })
const pending = ref(false)
const errorMessage = ref('')

const onSubmit = async () => {
  pending.value = true
  errorMessage.value = ''
  try {
    await login(form)
    router.push('/dashboard')
  } catch (error: unknown) {
    errorMessage.value = (error as Error).message || 'Login failed'
  } finally {
    pending.value = false
  }
}
</script>
