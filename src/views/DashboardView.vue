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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

const classes = ref([])
const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
  if (!userStore.user) {
    router.push('/login') // sécurité si pas connecté
    return
  }
  try {
    const res = await axios.get('http://localhost:3000/classes', {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })
    classes.value = res.data
  } catch (err) {
    console.error('Erreur récupération classes :', err)
  }
})

const goToClasse = (id) => {
  router.push(`/classes/${id}`)
}
</script>
