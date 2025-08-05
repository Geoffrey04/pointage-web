<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const drawer = ref(false)
const userStore = useUserStore()
const router = useRouter()

const logout = () => {
  userStore.logout()
  router.push('/login')
}

// Menu dynamique selon user connecté
const menuItems = computed(() => {
  const items = [{ title: 'Accueil', route: '/', icon: 'mdi-home' }]

  if (userStore.isLoggedIn && userStore.user.role === 'prof') {
    items.push({ title: 'Mes Classes', route: '/dashboard', icon: 'mdi-account-music' })
  }

  if (userStore.isLoggedIn && userStore.user.role === 'admin') {
    items.push({ title: 'Admin', route: '/admin', icon: 'mdi-shield-account' })
  }

  return items
})
</script>

<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>École de Musique</v-toolbar-title>
      <v-spacer />

      <div v-if="userStore.isLoggedIn" class="d-flex align-center">
        <span class="mr-4 subtitle-2">Connecté : {{ userStore.user.username }}</span>
        <v-btn icon @click="logout">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </div>
    </v-app-bar>

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

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
