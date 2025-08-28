<template>
  <v-container>
    <h2>Mes Classes</h2>

    <!-- État vide -->
    <v-alert v-if="!classes || classes.length === 0" type="info" variant="tonal" class="mt-2">
      Aucune classe disponible.
    </v-alert>

    <!-- Liste des classes -->
    <v-row v-else>
      <v-col cols="12" sm="6" md="4" v-for="classe in classes" :key="classe.id">
        <v-card @click="goToDashboard(classe.id)" class="hoverable cursor-pointer" color="#C41E3A">
          <v-card-title class="font-weight-medium text-center ma-0 pa-1">
            {{ classe.name }}
          </v-card-title>
          <v-card-subtitle class="text-center ma-0 pa-1">
            {{ classe.description || 'Aucune description' }}
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import axios from 'axios'

const classes = ref([])
const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
  try {
    const res = await axios.get('http://localhost:3000/my-classes', {
      headers: { Authorization: `Bearer ${userStore.token}` },
    })
    classes.value = res.data
  } catch (err) {
    console.error('Erreur récupération classes :', err)
  }
})

const goToDashboard = (id) => {
  router.push(`/dashboard/${id}`)
}
</script>
