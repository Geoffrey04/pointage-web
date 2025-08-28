<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import axios from 'axios'

const drawer = ref(false)
const userStore = useUserStore()
const router = useRouter()

userStore.initialize()

const isAuthed = computed(() => userStore.isLoggedIn)

const logout = () => {
  userStore.logout()
  router.replace('/login') // replace pour éviter back sur une page privée
}

function go(path) {
  drawer.value = false
  if (!path) return
  router.push(path).catch(() => {}) // évite l'erreur NavigationDuplicated
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
        <!-- Affiche le nom de l'utilisateur ou "Invité" si user null -->
        <span>{{ userStore.user?.username || 'Invité' }}</span>

        <v-btn icon @click="logout">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </div>
    </v-app-bar>

    <!-- Menu latéral -->
    <v-navigation-drawer app v-model="drawer" temporary :width="300">
      <v-list nav density="comfortable">
        <v-list-item v-for="item in menuItems" :key="item.title" @click="go(item.route)">
          <template #prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-navigation-drawer v-model="drawer" app>
      <!-- autres liens -->

      <v-divider class="my-2" />

      <v-list-subheader v-if="isAdmin">Admin</v-list-subheader>
      <v-list-item
        v-if="isAdmin"
        :to="{ name: 'admin-attendance-rates' }"
        prepend-icon="mdi-chart-bar"
        title="Taux de présence par classe"
      />
      <v-list-item
        v-if="isAdmin"
        :to="{ name: 'admin-attendance-rates' }"
        prepend-icon="mdi-chart-bar"
        title="Taux de présence par classe"
      />
    </v-navigation-drawer>

    <!-- Contenu principal -->
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
