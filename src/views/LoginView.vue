<template>
  <v-container class="mt-10" max-width="400px">
    <v-card>
      <v-card-title>Connexion</v-card-title>
      <v-card-text>
        <v-text-field v-model="username" label="Nom d'utilisateur" />
        <v-text-field v-model="password" label="Mot de passe" type="password" />
      </v-card-text>
      <v-card-actions>
        <v-btn @click="handleLogin" color="primary">Se connecter</v-btn>
      </v-card-actions>
    </v-card>
    <p v-if="error" class="text-red">{{ error }}</p>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const username = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const userStore = useUserStore()

async function handleLogin() {
  error.value = null
  const success = await userStore.login(username.value, password.value)
  if (success) {
    if (userStore.user.role === 'prof') {
      // Redirection vers la liste des classes du prof
      router.push('/classes/${userStore.user.id}')
    } else if (userStore.user.role === 'admin') {
      router.push('/admin')
    }
  } else {
    error.value = 'Identifiants incorrects'
  }
}
</script>
