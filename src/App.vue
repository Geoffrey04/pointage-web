<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <v-toolbar-title>École de Musique</v-toolbar-title>
      <v-spacer />
      <template v-if="userStore.isLoggedIn">
        <span class="mr-2 text-subtitle2 text-white">
          Connecté : {{ userStore.user.username }}
        </span>

        <v-btn @click="logout" icon>
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </template>
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

<script setup>
import { ref } from 'vue'

const drawer = ref(false)

const menuItems = [
  { title: 'Accueil', route: '/', icon: 'mdi-home' },
  { title: 'Connexion', route: '/login', icon: 'mdi-login' },
  { title: 'Dashboard Prof', route: '/dashboard', icon: 'mdi-account-music' },
  { title: 'Admin', route: '/admin', icon: 'mdi-shield-account' },
]

import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const logout = () => {
  userStore.logout()
  router.push('/login')
}
</script>
