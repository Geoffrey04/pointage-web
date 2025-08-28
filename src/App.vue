<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import bg from '@/assets/logo-mobile.png' // ou '@/assets/logo-master.png' si tu préfères

const drawer = ref(false)
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

userStore.initialize()

//const isAuthed = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.user?.role === 'admin')

// Afficher le fond sur ces sections uniquement
const showBg = computed(() => {
  const p = route.path.toLowerCase()
  if (p.startsWith('/login')) return false
  return p.startsWith('/admin') || p.startsWith('/classes') || p.startsWith('/dashboard')
})

const logout = () => {
  userStore.logout()
  router.replace('/login') // évite back sur page privée
}

function go(path) {
  drawer.value = false
  if (!path) return
  router.push(path).catch(() => {}) // ignore NavigationDuplicated
}

// Menu dynamique
const menuItems = computed(() => {
  const homeRoute = userStore.isLoggedIn
    ? userStore.user?.role === 'admin'
      ? '/admin'
      : '/classes'
    : '/login'

  const items = [{ title: 'Accueil', route: homeRoute, icon: 'mdi-home' }]

  if (userStore.isLoggedIn && userStore.user?.role === 'prof') {
    items.push({ title: 'Mes Classes', route: '/classes', icon: 'mdi-account-music' })
  }
  if (userStore.isLoggedIn && userStore.user?.role === 'admin') {
    items.push({ title: 'Admin', route: '/admin', icon: 'mdi-shield-account' })
  }
  return items
})

watchEffect(() => {
  axios.defaults.headers.common['Authorization'] = userStore.token
    ? `Bearer ${userStore.token}`
    : ''
})
</script>

<template>
  <v-app>
    <!-- Barre supérieure -->
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>École de Musique</v-toolbar-title>
      <v-spacer />
      <div v-if="userStore.isLoggedIn" class="d-flex align-center">
        <span class="mr-2">{{ userStore.user?.username || 'Invité' }}</span>
        <v-btn icon @click="logout"><v-icon>mdi-logout</v-icon></v-btn>
      </div>
    </v-app-bar>

    <!-- Menu latéral (unique) -->
    <v-navigation-drawer app v-model="drawer" temporary :width="300">
      <v-list nav density="comfortable">
        <v-list-item v-for="item in menuItems" :key="item.title" @click="go(item.route)">
          <template #prepend
            ><v-icon>{{ item.icon }}</v-icon></template
          >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2" />
        <v-list-subheader v-if="isAdmin">Admin</v-list-subheader>
        <v-list-item
          v-if="isAdmin"
          :to="{ name: 'admin-attendance-rates' }"
          prepend-icon="mdi-chart-bar"
          title="Taux de présence par classe"
          @click="drawer = false"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- Contenu principal + fond global -->
    <v-main class="app-main">
      <v-img v-if="showBg" :src="bg" class="app-bg" cover />
      <router-view />
    </v-main>
  </v-app>
</template>

<style scoped>
.app-main {
  position: relative;
  min-height: 100svh; /* mieux que 100vh sur mobile */
  isolation: isolate; /* garantit le z-index du fond */
}

/* Image de fond en filigrane */
.app-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.1; /* intensité du watermark */
  object-position: center 40%;
  pointer-events: none; /* clics passent à travers */
}

/* Ajustements responsive */
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
</style>
