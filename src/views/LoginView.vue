<template>
  <v-container
    fluid
    class="login-page d-flex align-center justify-center"
    :style="{ '--bg-logo': `url(${logo})` }"
  >
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

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="2500">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import logo from '@/assets/logo-master.png' // si tu veux revenir au SVG, remplace par .svg

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const username = ref('')
const password = ref('')
const showPwd = ref(false)
const loading = ref(false)

const snack = ref({ show: false, text: '', color: 'error' })

const rules = {
  required: (v) => !!v || 'Champ requis',
}

async function handleLogin() {
  // Validation explicite (évite le “rien ne se passe” si le v-form ne renvoie pas un booléen)
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    await userStore.login({ username: username.value.trim(), password: password.value })
    // redirection “post-login” : si tu veux aller direct aux classes, change ici
    //  router.push('/classes')
    const isAdmin = userStore.user?.role === 'admin'
    router.push(isAdmin ? '/admin' : '/classes')
  } catch (e) {
    console.error('Erreur login:', e)
    snack.value = { show: true, text: 'Identifiants invalides', color: 'error' }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Page + filigrane (via variable CSS depuis le template) ── */
.login-page {
  position: relative;
  min-height: 100vh;
  background: #fff;
  overflow: hidden;
}
.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--bg-logo);
  background-repeat: no-repeat;
  background-position: center;
  background-size: min(72vw, 820px);
  opacity: 0.08; /* intensité du filigrane */
  pointer-events: none;
}
.login-page::after {
  /* léger voile pour adoucir le fond sans toucher la carte */
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(transparent 60%, rgba(0, 0, 0, 0.03));
  pointer-events: none;
}

/* ── Carte bleue du formulaire ── */
.login-card {
  background-color: #1e88e5; /* adapte à ta charte */
  color: white;
  border-radius: 18px;
}

/* Lisibilité des champs Vuetify sur fond bleu */
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

/* Bouton disabled/chargement */
.login-card :deep(.v-btn.v-btn--disabled) {
  opacity: 0.6;
}

/* Responsive : logo de fond plus petit sur mobile */
@media (max-width: 600px) {
  .login-page::before {
    background-size: 90vw;
    opacity: 0.1;
  }
}
</style>
