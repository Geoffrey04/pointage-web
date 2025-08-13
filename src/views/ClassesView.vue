<template>
  <v-container>
    <h2>Classe : {{ classe.nom || 'Classe inconnue' }}</h2>

    <v-list>
      <v-list-item v-for="student in students" :key="student.id">
        {{ student.prenom }} {{ student.nom }}
      </v-list-item>

      <v-list-item v-if="students.length === 0"> Aucun élève dans cette classe. </v-list-item>
    </v-list>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const classeId = route.params.id
const classe = ref({})
const students = ref([])

onMounted(async () => {
  if (!userStore.token) {
    console.error('Token JWT manquant, veuillez vous connecter.')
    router.push('/login')
    return
  }

  if (!classeId) {
    console.warn('Aucun ID de classe fourni dans l’URL')
    return
  }

  try {
    // Récupérer les infos de la classe
    const classeRes = await axios.get(`http://localhost:3000/classes/${classeId}`, {
      headers: { Authorization: `Bearer ${userStore.token}` },
    })
    classe.value = classeRes.data

    // Récupérer les élèves de la classe
    const studentsRes = await axios.get(`http://localhost:3000/classes/${classeId}/students`, {
      headers: { Authorization: `Bearer ${userStore.token}` },
    })
    students.value = studentsRes.data
  } catch (error) {
    if (error.response) {
      if (error.response.status === 403) {
        console.error('Accès refusé à cette classe.')
      } else if (error.response.status === 404) {
        console.error('Classe ou élèves non trouvés.')
      } else {
        console.error('Erreur récupération élèves :', error.response.data)
      }
    } else {
      console.error('Erreur récupération élèves :', error.message)
    }
  }
})
</script>
