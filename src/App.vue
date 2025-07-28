<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <v-toolbar-title>École de Musique</v-toolbar-title>
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
</script>
