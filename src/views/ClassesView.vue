<template>
  <v-container>
    <h2>Mes Classes</h2>

    <!-- Erreur de chargement : distincte de l'état vide -->
    <v-alert v-if="error" type="error" variant="tonal" class="mt-2">
      {{ error }}
    </v-alert>

    <!-- Chargement -->
    <v-row v-else-if="loading">
      <v-col cols="12" sm="6" md="4" v-for="i in 3" :key="i">
        <v-skeleton-loader type="card" class="rounded-lg" />
      </v-col>
    </v-row>

    <!-- État vide -->
    <v-alert v-else-if="classes.length === 0" type="info" variant="tonal" class="mt-2">
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
import { useRouter } from 'vue-router'
import { api } from '@/stores/user'

const classes = ref([])
const loading = ref(true)
const error = ref(null)
const router = useRouter()

onMounted(async () => {
  try {
    const res = await api.get('/my-classes')
    classes.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('Erreur récupération classes :', err)
    error.value = err?.response?.data?.message || 'Impossible de charger vos classes.'
  } finally {
    loading.value = false
  }
})

const goToDashboard = (id) => {
  router.push({ name: 'DashboardView', params: { id: String(id) } })
}
</script>
