<script setup>
import { ref, computed, watchEffect, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import bg from '@/assets/logo-mobile.png'
import logo from '@/assets/logo-64.png'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const year = new Date().getFullYear()
const orgName = import.meta.env.VITE_ORG_NAME ?? 'École de Musique de Marpent'
const brand = computed(() => `${orgName}`)

// Couleur fixe de l’app bar
const APPBAR_BLUE = '#1E88E5'

// Init auth
userStore.initialize()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.user?.role === 'admin')
const roleLabel = computed(() => isLoggedIn.value ? (isAdmin.value ? 'Administrateur' : 'Professeur') : '')

// Titre dynamique
const pageTitle = computed(() =>
  route.meta?.title ??
  (isLoggedIn.value ? (isAdmin.value ? 'Tableau de bord' : 'Mes classes') : 'Identification')
)

// Initiales utilisateur (fallback sûr)
const userInitials = computed(() => {
  const u = userStore.user ?? {}
  const f = (u.firstname ?? u.username ?? '?').toString().charAt(0)
  const l = (u.lastname ?? '').toString().charAt(0)
  return (f + l).toUpperCase()
})

// Fond visible sur certaines sections
const showBg = computed(() => {
  const p = route.path.toLowerCase()
  if (p.startsWith('/login')) return false
  return p.startsWith('/admin') || p.startsWith('/classes') || p.startsWith('/dashboard')
})

// Home selon l’état
const homeRoute = computed(() => {
  if (!isLoggedIn.value) return '/login'
  return isAdmin.value ? '/admin' : '/classes'
})

const doRealLogout = () => {
  userStore.logout()
  router.replace('/login')
}

// ---- Confirmation de déconnexion ----
const confirmLogoutDialog = ref(false)
const confirming = ref(false)
function askLogout() {
  confirmLogoutDialog.value = true
}
async function confirmLogout() {
  try {
    confirming.value = true
    await Promise.resolve()
    doRealLogout()
  } finally {
    confirming.value = false
    confirmLogoutDialog.value = false
  }
}
function cancelLogout() {
  confirmLogoutDialog.value = false
}

function go(path) {
  if (!path) return
  router.push(path).catch(() => {})
}

// ---- Compteur de classes (badge) ----
const classCount = ref(null)
const authHeaders = () => {
  const token = userStore.token
  return token ? { Authorization: `Bearer ${token}` } : {}
}
async function fetchCounts() {
  classCount.value = null
  try {
    if (isAdmin.value) {
      const { data } = await axios.get(`${API}/api/admin/stats`, { headers: authHeaders() })
      classCount.value = Number(data?.classes ?? 0)
    } else if (isLoggedIn.value) {
      const { data: classes } = await axios.get(`${API}/api/classes`, { headers: authHeaders() })
      classCount.value = Array.isArray(classes) ? classes.length : 0
    }
  } catch (e) {
    console.error('fetchCounts', e)
  }
}
onMounted(fetchCounts)
watch(() => userStore.user?.role, fetchCounts)

// Auth header par défaut
watchEffect(() => {
  axios.defaults.headers.common['Authorization'] = userStore.token
    ? `Bearer ${userStore.token}`
    : ''
})

// --------- Bottom navigation logic ---------
const bottomSheet = ref(false) // “Plus” (liens légaux)
const openSheet = () => (bottomSheet.value = true)
const closeSheet = () => (bottomSheet.value = false)

// Pour aria-current éventuel
const currentPath = computed(() => route.name ?? route.path)
</script>

<template>
  <v-app class="d-flex flex-column min-h-screen">
    <!-- TOP BAR -->
    <v-app-bar
      app
      flat
      color="transparent"
      class="appbar bg-transparent"
      density="comfortable"
      :style="{ '--appbar-base': APPBAR_BLUE }"
    >
      <v-container class="appbar__container px-3">
        <!-- Logo cliquable vers “home” selon l’état -->
        <v-btn variant="text" class="mr-1 px-0 min-w-0" :ripple="false" @click="go(homeRoute)">
          <v-avatar size="28" variant="tonal">
            <v-img :src="logo" alt="Logo" cover />
          </v-avatar>
        </v-btn>

        <!-- Titre cliquable aussi (même destination) -->
        <div class="appbar__titles cursor-pointer" @click="go(homeRoute)">
          <div class="brand"><span class="brand__org">{{ orgName }}</span></div>
          <div class="subtitle text-caption">{{ pageTitle }}</div>
        </div>

        <div class="flex-grow-1" />

        <!-- À droite : username + rôle (plus de bouton power ici) -->
        <div v-if="isLoggedIn" class="d-flex align-center ga-2 userpill">
          <div class="text-right mr-1 truncate">
            <div class="text-caption font-weight-600 username" :title="userStore.user?.username">
              {{ userStore.user?.username }}
            </div>
            <div class="text-caption text-medium-emphasis role">{{ roleLabel }}</div>
          </div>
          <v-avatar size="28" color="primary">
            <span class="avatar__monogram">{{ userInitials }}</span>
          </v-avatar>
        </div>
      </v-container>
    </v-app-bar>

    <!-- CONTENU -->
    <v-main class="app-main flex-grow-1 with-bottomnav">
      <v-img v-if="showBg" :src="bg" class="app-bg" cover />
      <router-view />
    </v-main>

    <!-- FOOTER GLOBAL (détaché du “Plus”) -->
    <v-footer elevation="0" class="footer" role="contentinfo">
      <v-container class="footer__container px-4 py-3">
        <v-row class="align-center" no-gutters>
          <v-col cols="12" md="6" class="copyright">
            <div class="text-caption">© {{ year }} {{ brand }} — Tous droits réservés.</div>
            <div class="text-caption meta">Application interne de pointage (non commerciale).</div>
          </v-col>
          <v-col cols="12" md="6">
            <nav class="links" aria-label="Liens de bas de page">
              <v-btn variant="text" size="small" prepend-icon="mdi-scale-balance" :to="'/mentions-legales'" class="link">
                Mentions légales
              </v-btn>
              <v-btn variant="text" size="small" prepend-icon="mdi-shield-lock" :to="'/privacy'" class="link">
                Confidentialité
              </v-btn>
              <v-btn variant="text" size="small" prepend-icon="mdi-cookie" :to="'/cookies'" class="link">
                Cookies
              </v-btn>
            </nav>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>

    <!-- ====== BARRE DE NAVIGATION BASSE ====== -->
    <v-bottom-navigation app :height="64" class="bottomnav" active>
      <!-- DÉCONNECTÉ -->
      <template v-if="!isLoggedIn">
        <v-btn :to="homeRoute" :aria-current="currentPath === 'login' ? 'page' : undefined">
          <v-icon>mdi-home</v-icon>
          <span>Accueil</span>
        </v-btn>
        <v-btn @click="openSheet">
          <v-icon>mdi-dots-horizontal</v-icon>
          <span>Plus</span>
        </v-btn>
      </template>

      <!-- PROF CONNECTÉ -->
      <template v-else-if="isLoggedIn && !isAdmin">
        <v-badge :content="classCount ?? '—'" color="primary" floating location="top end"    offset-x="45"
    offset-y="30">
          <v-btn :to="'/classes'" :aria-current="route.path === '/classes' ? 'page' : undefined">
            <v-icon>mdi-account-music</v-icon>
            <span>Mes classes</span>
          </v-btn>
        </v-badge>
        <v-btn @click="askLogout">
          <v-icon>mdi-logout</v-icon>
          <span>Se déconnecter</span>
        </v-btn>
      </template>

      <!-- ADMIN CONNECTÉ (admin pur) -->
      <template v-else>
        <v-btn :to="{ name: 'AdminAttendanceRates' }" :aria-current="route.name === 'AdminAttendanceRates' ? 'page' : undefined">
          <v-icon>mdi-chart-bar</v-icon>
          <span>Taux</span>
        </v-btn>
        <v-btn :to="'/admin'" :aria-current="route.path === '/admin' ? 'page' : undefined">
          <v-icon>mdi-shield-account</v-icon>
          <span>Admin</span>
        </v-btn>
        <v-btn @click="askLogout">
          <v-icon>mdi-logout</v-icon>
          <span>Se déconnecter</span>
        </v-btn>
      </template>
    </v-bottom-navigation>

    <!-- ====== PANNEAU “PLUS” (LÉGAL UNIQUEMENT) ====== -->
    <v-bottom-sheet v-model="bottomSheet" inset>
      <v-card class="rounded-t-2xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="text-subtitle-1">Informations</div>
          <v-btn icon variant="text" @click="closeSheet"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-divider />
        <v-list nav>
          <v-list-item :to="'/mentions-legales'" prepend-icon="mdi-scale-balance" @click="closeSheet">
            <v-list-item-title>Mentions légales</v-list-item-title>
          </v-list-item>
          <v-list-item :to="'/privacy'" prepend-icon="mdi-shield-lock" @click="closeSheet">
            <v-list-item-title>Confidentialité</v-list-item-title>
          </v-list-item>
          <v-list-item :to="'/cookies'" prepend-icon="mdi-cookie" @click="closeSheet">
            <v-list-item-title>Cookies</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-bottom-sheet>

    <!-- ====== DIALOGUE CONFIRMATION DÉCONNEXION ====== -->
    <v-dialog v-model="confirmLogoutDialog" max-width="420" :persistent="confirming">
      <v-card class="rounded-xl">
        <v-card-title class="text-h6">Se déconnecter ?</v-card-title>
        <v-card-text class="text-body-2">
          Vous allez être déconnecté de l’application. Confirmez-vous cette action ?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" :disabled="confirming" @click="cancelLogout">Annuler</v-btn>
          <v-btn color="primary" :loading="confirming" @click="confirmLogout">
            Se déconnecter
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<style>
/* Polices modernes : Inter (UI) + Poppins (titres) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap');

:root{
  --font-ui: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-title: 'Poppins', var(--font-ui);
  --bottomnav-h: 64px; /* hauteur de la barre basse */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html, body, #app { font-family: var(--font-ui); }
</style>

<style scoped>
/* -------- Top bar -------- */
.appbar {
  --appbar-base: #1E88E5;
  color: #fff;
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  box-shadow: 0 6px 18px rgba(0,0,0,.12);
  backdrop-filter: blur(6px);
}
.appbar,
:deep(.appbar .v-toolbar),
:deep(.appbar .v-toolbar__content) {
  background-color: var(--appbar-base) !important;
  background-image: linear-gradient(
    135deg,
    color-mix(in oklab, var(--appbar-base) 88%, black) 0%,
    var(--appbar-base) 100%
  ) !important;
}
.appbar__container { max-width: 1100px; margin-inline: auto; display: flex; align-items: center; }
.appbar__titles { min-width: 0; display: flex; flex-direction: column; line-height: 1.1; }
.brand { font-family: var(--font-title); font-weight: 700; letter-spacing: .25px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.brand__org { display: none; opacity: .9; }
.subtitle { font-family: var(--font-ui); font-weight: 600; letter-spacing: .15px; color: rgba(255,255,255,.98); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.avatar__monogram { font-weight: 700; font-size: .9rem; color: white; }
.userpill .username { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ≥ md */
@media (min-width: 960px) { .brand__org { display: inline; } .brand { font-size: 1.05rem; } }
/* Ultra compact */
@media (max-width: 360px) { .subtitle { display: none; } }

/* -------- Layout & fond -------- */
.app-main { position: relative; min-height: 100svh; isolation: isolate; }
.app-bg { position: fixed; inset: 0; z-index: 0; opacity: 0.1; object-position: center 40%; pointer-events: none; }
.app-main :deep(> *:not(.app-bg)) { position: relative; z-index: 1; }
@media (max-width: 600px) { .app-bg { opacity: 0.12; object-position: center 30%; } }
@media (min-width: 1280px) { .app-bg { object-position: center 45%; } }

/* -------- Footer transparent -------- */
.footer { position: relative; background: transparent !important; backdrop-filter: none; border-top: none; color: #111; font-size: 0.9rem; }
.footer__container { max-width: 1100px; margin-inline: auto; }
.copyright { text-align: center; color: #111; }
.meta { opacity: .65; margin-top: .25rem; color: #111; }
.links { display: flex; flex-wrap: wrap; gap: 4px 8px; justify-content: center; }
.link { text-transform: none; letter-spacing: .2px; padding-inline: 8px; min-width: 0; }
:deep(.footer .v-btn), :deep(.footer .v-btn .v-icon), :deep(.footer .v-icon) { color: #111 !important; }
@media (min-width: 960px) { .copyright { text-align: left; } .links { justify-content: flex-end; } }
@media (max-width: 380px) { .meta { display: none; } .footer { font-size: 0.85rem; } }

/* ➜ Réserver la place pour la bottom-nav côté CONTENU */
.with-bottomnav {
  padding-bottom: calc(var(--bottomnav-h) + env(safe-area-inset-bottom));
}
/* ➜ Réserver la place pour la bottom-nav côté FOOTER (évite le chevauchement) */
@media (max-width: 960px){
  .footer{
    padding-bottom: calc(var(--bottomnav-h) + 8px + env(safe-area-inset-bottom));
  }
}

/* -------- Bottom navigation -------- */
.bottomnav {
  background: rgba(255,255,255,0.92) !important;
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0,0,0,.06);
  z-index: 10;
  /* Assure un centrage stable quel que soit le nombre d’items */
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  padding-bottom: env(safe-area-inset-bottom);
}
/* Tous les boutons partagent l’espace équitablement, centrés, sans bavure */
.bottomnav :deep(.v-btn){
  flex: 1 1 0;
  min-width: 0;
  margin:auto;
  text-transform: none;
}
/* Icône au-dessus, label en dessous (lire/cliquer confort) */
.bottomnav :deep(.v-btn .v-btn__content){
  flex-direction: column;
  gap: 4px;
}
</style>
