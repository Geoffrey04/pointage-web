<!-- LoginView.vue -->
<template>
  <v-main class="login-page">
    <!-- FOND (mobile / petites tailles) -->
    <v-img :src="logo" class="login-bg" cover :eager="true" />

    <!-- CONTENU -->
    <v-container class="fill-height d-flex align-center justify-center">
      <v-row align="center" justify="center" class="fill-height">
        <v-col cols="12" sm="8" md="4" lg="3">
          <v-card class="pa-6 text-center login-card rounded-xl elevation-5">
            <v-form ref="formRef" @submit.prevent="handleLogin">
              <v-text-field
                v-model="username"
                label="Nom d’utilisateur"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                color="white"
                :rules="[rules.required]"
                class="mb-4"
                hide-details="auto"
                autocomplete="username"
              />
              <v-text-field
                v-model="password"
                :type="showPwd ? 'text' : 'password'"
                label="Mot de passe"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPwd = !showPwd"
                variant="outlined"
                color="white"
                :rules="[rules.required]"
                class="mb-6"
                hide-details="auto"
                autocomplete="current-password"
              />
              <v-btn type="submit" color="white" :loading="loading" block class="font-weight-bold">
                Connexion
              </v-btn>
            </v-form>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <v-snackbar v-model="snack.show" :color="snack.color" timeout="2500">
      {{ snack.text }}
    </v-snackbar>
  </v-main>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import logo from '@/assets/logo-master.png'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const username = ref('')
const password = ref('')
const showPwd = ref(false)
const loading = ref(false)

// ✅ reactive au lieu de ref({...})
const snack = reactive({ show: false, text: '', color: 'error' })

const rules = { required: (v) => !!v || 'Champ requis' }

async function handleLogin() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    const res = await userStore.login({
      username: username.value.trim(),
      password: password.value,
    })

    // ✅ Si ton store ne throw pas en cas d'erreur, on force une erreur
    if (res === false || res?.error) throw new Error(res?.error || 'BAD_CREDENTIALS')

    const isAdmin = userStore.user?.role === 'admin'
    router.push(isAdmin ? '/admin' : '/classes')
  } catch (e) {
    console.error('Erreur login:', e)
    // ✅ on met à jour les champs sans réassigner l'objet
    snack.text = 'Identifiants invalides'
    snack.color = 'error'
    snack.show = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* CONTENEUR PAGE */
.login-page {
  position: relative;
  min-height: 100svh; /* mieux que 100vh sur mobile */
  overflow: hidden;
  isolation: isolate; /* fixe certains empilements z-index */
  background: #fff;
}

/* IMAGE DE FOND via v-img (mobile) */
.login-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.14; /* + visible sur écrans lumineux */
  object-position: center 40%;
  pointer-events: none;
}

/* CARTE */
.login-card {
  position: relative;
  z-index: 1;
  background-color: #1e88e5;
  color: white;
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}

/* Champs Vuetify lisibles sur fond bleu */
.login-card :deep(.v-field--variant-outlined .v-field__outline__start),
.login-card :deep(.v-field--variant-outlined .v-field__outline__end),
.login-card :deep(.v-field--variant-outlined .v-field__outline__notch) {
  border-color: rgba(255, 255, 255, 0.5);
}
.login-card :deep(.v-label),
.login-card :deep(.v-input__details),
.login-card :deep(.v-field__input),
.login-card :deep(.v-icon) {
  color: #fff !important;
  opacity: 0.95;
}

.login-card :deep(.v-btn.v-btn--disabled) {
  opacity: 0.6;
}

/* ======= RESPONSIVE ======= */

/* Mobile */
@media (max-width: 959.98px) {
  .login-card {
    margin: 16px;
  }
  .login-bg {
    opacity: 1;
    object-position: center 60%;
    max-block-size: 55%;
    margin-top: 30%;
  }
}

/* Desktop ≥ 960px : on passe en background CSS, on masque v-img */
@media (min-width: 960px) {
  .login-bg {
    display: none;
  } /* on évite double rendu */
  .login-page {
    /* BG CSS fiable en desktop */
    background-image: url('@/assets/logo-master.png'); /* même image */
    background-repeat: no-repeat;
    background-size: min(72vw, 820px); /* effet "filigrane" comme avant */
    background-position: center 45%;
    background-color: #fff;
  }
}
</style>
