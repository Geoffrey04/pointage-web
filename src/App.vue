<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import axios from 'axios'

const drawer = ref(false)
const userStore = useUserStore()
const router = useRouter()

// Initialisation du store pour récupérer token et user depuis localStorage
userStore.initialize()

const logout = () => {
  userStore.logout()
  router.push('/login')
}

// Menu dynamique selon user connecté, avec protections sur user null
const menuItems = computed(() => {
  const items = [{ title: 'Accueil', route: '/', icon: 'mdi-home' }]

  if (userStore.isLoggedIn && userStore.user?.role === 'prof') {
    items.push({ title: 'Mes Classes', route: '/classes', icon: 'mdi-account-music' })
  }

  if (userStore.isLoggedIn && userStore.user?.role === 'admin') {
    items.push({ title: 'Admin', route: '/admin', icon: 'mdi-shield-account' })
  }

  return items
})

// Optionnel : on peut aussi réagir au changement du token/user pour forcer mise à jour
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
        <!-- Affiche le nom de l'utilisateur ou "Invité" si user null -->
        <span>{{ userStore.user?.username || 'Invité' }}</span>

        <v-btn icon @click="logout">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </div>
    </v-app-bar>

    <!-- Menu latéral -->
    <v-navigation-drawer app v-model="drawer" temporary :width="300">
      <v-list nav dense>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :to="item.route"
          router
          @click="drawer = false"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Contenu principal -->
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
