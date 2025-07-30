<template>
  <v-container>
    <h2>Mes Classes</h2>
    <v-row>
      <v-col cols="12" sm="6" md="4" v-for="classe in classes" :key="classe.id">
        <v-card @click="goToClasse(classe.id)" class="hoverable" color="blue-lighten-5">
          <v-card-title>{{ classe.nom }}</v-card-title>
          <v-card-subtitle>{{ classe.description }}</v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const classes = ref([])

onMounted(() => {
  // Exemple statique, à remplacer plus tard par un appel API
  if (userStore.user?.username === 'prof1') {
    classes.value = [
      { id: 'class-flu', nom: 'Flûtes', description: 'Mercredi' },
      { id: 'class-ini', nom: 'Initiaux', description: 'Samedi' },
    ]
  }
})

const goToClasse = (id) => {
  router.push(`/classes/${id}`)
}
</script>
