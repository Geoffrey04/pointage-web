<script setup>
import { ref, computed, watchEffect, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import bg from '@/assets/logo-mobile.png'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const drawer = ref(false)
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const year = new Date().getFullYear()
const orgName = import.meta.env.VITE_ORG_NAME ?? 'École de Musique de Marpent'
const brand = computed(() => `${orgName}`)

// Couleur fixe de l’app bar
const APPBAR_BLUE = '#1E88E5'

userStore.initialize()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.user?.role === 'admin')
const roleLabel = computed(() =>
  isLoggedIn.value ? (isAdmin.value ? 'Administrateur' : 'Professeur') : '',
)

// Sous-titre / titre de page dynamique
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

// Afficher le fond sur ces sections uniquement
const showBg = computed(() => {
  const p = route.path.toLowerCase()
  if (p.startsWith('/login')) return false
  return p.startsWith('/admin') || p.startsWith('/classes') || p.startsWith('/dashboard')
})

const logout = () => {
  userStore.logout()
  router.replace('/login')
}

function go(path) {
  drawer.value = false
  if (!path) return
  router.push(path).catch(() => {})
}

// ---- Compteur de classes ----
const classCount = ref(null)

const authHeaders = () => {
  const token = userStore.token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchCounts() {
  classCount.value = null
  try {
    if (isAdmin.value) {
      // Admin : compteur global des classes
      const { data } = await axios.get(`${API}/api/admin/stats`, { headers: authHeaders() })
      classCount.value = Number(data?.classes ?? 0)
    } else if (isLoggedIn.value) {
      // Prof : nombre de classes accessibles
      const { data: classes } = await axios.get(`${API}/api/classes`, { headers: authHeaders() })
      classCount.value = Array.isArray(classes) ? classes.length : 0
    }
  } catch (e) {
    console.error('fetchCounts', e)
  }
}

// Auth header par défaut
watchEffect(() => {
  axios.defaults.headers.common['Authorization'] = userStore.token
    ? `Bearer ${userStore.token}`
    : ''
})

// Charger les compteurs au login / changement de rôle
onMounted(fetchCounts)
watch(() => userStore.user?.role, fetchCounts)
</script>

<template>
  <v-app>
    <!-- Barre supérieure (bleu fixe) -->
    <v-app-bar
      app
      flat
      color="transparent"
      class="appbar bg-transparent"
      density="comfortable"
      :style="{ '--appbar-base': APPBAR_BLUE }"
    >
      <v-container class="appbar__container px-3">
        <v-btn icon aria-label="Ouvrir le menu" class="mr-1" @click="drawer = !drawer">
          <v-icon>mdi-menu</v-icon>
        </v-btn>

        <!-- Logo / monogramme -->
        <v-avatar size="28" class="mr-2" variant="tonal">
          <v-img src="src/assets/logo-64.png" alt="Logo" />
        </v-avatar>

        <!-- Titre + sous-titre -->
        <div class="appbar__titles">
          <div class="brand">
            <span class="brand__org">{{ orgName }}</span>
          </div>
          <div class="subtitle text-caption">{{ pageTitle }}</div>
        </div>

        <div class="flex-grow-1" />

        <!-- Déconnexion + avatar -->
        <v-tooltip v-if="isLoggedIn" text="Se déconnecter" location="bottom">
          <template #activator="{ props }">
            <v-btn icon v-bind="props" @click="logout" aria-label="Se déconnecter">
              <v-icon>mdi-power</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-avatar v-if="isLoggedIn" size="28" class="ml-1" color="primary">
          <span>{{ userInitials }}</span>
        </v-avatar>
      </v-container>
    </v-app-bar>

    <!-- Menu latéral -->
    <v-navigation-drawer app v-model="drawer" temporary :width="300">
      <v-list nav density="comfortable">
        <!-- En-tête utilisateur dans le drawer (seulement si connecté) -->
        <v-list-item v-if="isLoggedIn" :title="userStore.user?.username" :subtitle="roleLabel">
          <template #prepend>
            <v-avatar size="36" color="primary" class="text-white">
              <v-icon>mdi-account-circle</v-icon>
            </v-avatar>
          </template>
        </v-list-item>

        <v-divider class="my-2" />

        <!-- PROF : Mes classes -->
        <template v-if="isLoggedIn && !isAdmin">
          <v-list-item @click="go('/classes')" prepend-icon="mdi-account-music">
            <v-list-item-title>Mes classes</v-list-item-title>
            <template #append>
              <v-chip size="small" variant="tonal">{{ classCount ?? '—' }}</v-chip>
            </template>
          </v-list-item>
        </template>

        <!-- ADMIN : Admin + Taux de présence -->
        <template v-else-if="isLoggedIn && isAdmin">
          <v-list-item @click="go('/admin')" prepend-icon="mdi-shield-account">
            <v-list-item-title>Admin</v-list-item-title>
            <template #append>
              <v-chip size="small" variant="tonal">{{ classCount ?? '—' }}</v-chip>
            </template>
          </v-list-item>

          <v-list-item
            :to="{ name: 'admin-attendance-rates' }"
            prepend-icon="mdi-chart-bar"
            title="Taux de présence"
            @click="drawer = false"
          />
        </template>
      </v-list>
    </v-navigation-drawer>

    <!-- Contenu principal + fond global -->
    <v-main class="app-main">
      <v-img v-if="showBg" :src="bg" class="app-bg" cover />
      <router-view />
    </v-main>

    <!-- Footer (transparent, texte noir) -->
    <v-footer app elevation="0" class="footer" role="contentinfo">
      <v-container class="footer__container px-4 py-3">
        <v-row class="align-center" no-gutters>
          <v-col cols="12" md="6" class="copyright">
            <div class="text-caption">
              © {{ year }} {{ brand }} — Tous droits réservés.
            </div>
            <div class="text-caption meta">
              Application interne de pointage (non commerciale).
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <nav class="links" aria-label="Liens de bas de page">
              <v-btn
                variant="text"
                size="small"
                prepend-icon="mdi-scale-balance"
                :to="'/legal'"
                class="link"
              >
                Mentions légales
              </v-btn>
              <v-btn
                variant="text"
                size="small"
                prepend-icon="mdi-shield-lock"
                :to="'/privacy'"
                class="link"
              >
                Confidentialité
              </v-btn>
              <v-btn
                variant="text"
                size="small"
                prepend-icon="mdi-cookie"
                :to="'/cookies'"
                class="link"
              >
                Cookies
              </v-btn>
              <v-btn
                variant="text"
                size="small"
                prepend-icon="mdi-email"
                :to="'/contact'"
                class="link"
              >
                Contact
              </v-btn>
            </nav>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template>

<style>
/* Polices modernes : Inter (UI) + Poppins (titres) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap');

/* Variables + lissage */
:root{
  --font-ui: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-title: 'Poppins', var(--font-ui);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Option : appliquer Inter partout par défaut */
html, body, #app { font-family: var(--font-ui); }
</style>


<style scoped>
/* -------- Top bar (bleu fixe #1E88E5) -------- */
.appbar {
  --appbar-base: #1E88E5;
  color: #fff;
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  box-shadow: 0 6px 18px rgba(0,0,0,.12);
  backdrop-filter: blur(6px);
}

/* On force le fond aussi à l'intérieur de la toolbar Vuetify */
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

.appbar__container {
  max-width: 1100px;
  margin-inline: auto;
  display: flex;
  align-items: center;
}
.appbar__titles {
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.brand {
  font-family: var(--font-title);   /* <- Poppins */
  font-weight: 700;
  letter-spacing: .25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.brand__org { display: none; opacity: .9; }
.brand__dot { display: none; margin: 0 .35rem; opacity: .7; }
.subtitle {
  font-family: var(--font-ui);      /* <- Inter */
  font-weight: 600;
  letter-spacing: .15px;
  color: rgba(255,255,255,.98);     /* lisible sur le bleu */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.avatar__monogram {
  font-weight: 700;
  font-size: .9rem;
  color: white;
}

/* ≥ md */
@media (min-width: 960px) {
  .brand__org, .brand__dot { display: inline; }
  .brand { font-size: 1.05rem; }
}

/* Ultra compact */
@media (max-width: 360px) { .subtitle { display: none; } }

/* -------- Layout & fond -------- */
.app-main {
  position: relative;
  min-height: 100svh;
  isolation: isolate;
}
.app-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.1;
  object-position: center 40%;
  pointer-events: none;
}
@media (max-width: 600px) { .app-bg { opacity: 0.12; object-position: center 30%; } }
@media (min-width: 1280px) { .app-bg { object-position: center 45%; } }

/* -------- Footer transparent + texte noir -------- */
.footer {
  background: transparent !important;
  backdrop-filter: none;
  border-top: none;
  color: #111; /* texte noir */
  font-size: 0.9rem;
}
.footer__container {
  max-width: 1100px;
  margin-inline: auto;
}
.copyright { text-align: center; color: #111; }
.meta { opacity: .65; margin-top: .25rem; color: #111; }

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  justify-content: center;
}
.link {
  text-transform: none;
  letter-spacing: .2px;
  padding-inline: 8px;
  min-width: 0;
}

/* Force la couleur noire sur les boutons + icônes du footer */
:deep(.footer .v-btn),
:deep(.footer .v-btn .v-icon),
:deep(.footer .v-icon) {
  color: #111 !important;
}

@media (min-width: 960px) {
  .copyright { text-align: left; }
  .links { justify-content: flex-end; }
}
@media (max-width: 380px) {
  .meta { display: none; }
  .footer { font-size: 0.85rem; }
}
</style>
