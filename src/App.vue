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
const appName = import.meta.env.VITE_APP_NAME ?? 'EMM Pointage - GABJEA'
const orgName = import.meta.env.VITE_ORG_NAME ?? 'École de Musique de Marpent'
const brand = computed(() => `${appName} • ${orgName}`)

userStore.initialize()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.user?.role === 'admin')
const roleLabel = computed(() =>
  isLoggedIn.value ? (isAdmin.value ? 'Administrateur' : 'Professeur') : '',
)

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
    <!-- Barre supérieure -->
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>École de Musique </v-toolbar-title>
      <v-spacer />
      <div v-if="isLoggedIn" class="d-flex align-center">
        <!-- Icône utilisateur (à la place du nom) -->
        <v-btn icon><v-icon>mdi-account-circle</v-icon></v-btn>
        <v-btn icon @click="logout"><v-icon>mdi-logout</v-icon></v-btn>
      </div>
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

        <!-- PROF : Mes classes (plus de “Mes élèves”) -->
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
    <!-- Footer -->
     <!-- Footer -->
<v-footer app elevation="1" class="footer" role="contentinfo">
  <v-container class="footer__container px-4 py-3 mx-auto">
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

<style scoped>
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
@media (max-width: 600px) {
  .app-bg {
    opacity: 0.12;
    object-position: center 30%;
  }
}
@media (min-width: 1280px) {
  .app-bg {
    object-position: center 45%;
  }
}
.footer {
  backdrop-filter: blur(6px);
  background-color: rgb(from var(--v-theme-surface) r g b / 0.85);
  border-top: 1px solid rgba(0,0,0,.06);
  font-size: 0.9rem;
}

/* Contenu "cadré" avec largeur max et centré */
.footer__container {
  max-width: 1100px;   /* ajuste à 960 / 1280 si tu préfères */
}

/* Texte centré sur mobile, aligné à gauche en desktop */
.copyright {
  text-align: center;
}
.meta {
  opacity: .65;
  margin-top: .25rem;
}

/* Liens compacts, centrés sur mobile, à droite en desktop */
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

/* Breakpoint md (Vuetify ~960px) */
@media (min-width: 960px) {
  .copyright { text-align: left; }
  .links { justify-content: flex-end; }
}

/* Ultra-compact sur très petits écrans */
@media (max-width: 380px) {
  .meta { display: none; }  /* enlève la ligne secondaire pour gagner en hauteur */
  .footer { font-size: 0.85rem; }
}
</style>
