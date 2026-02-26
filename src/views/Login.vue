<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')

const submit = async () => {
  await auth.login(email.value, password.value)
  router.push('/')
}
</script>

<template>
  <div>
    <h1>Login</h1>
    <input v-model="email" type="email" placeholder="email" />
    <input v-model="password" type="password" placeholder="password" />
    <button @click="submit">Login</button>
  </div>
</template>