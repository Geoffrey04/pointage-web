<template>
  <v-card class="rounded-xl elevation-2">
    <v-card-title class="text-h6">Tableau de présence</v-card-title>
    <v-divider />

    <v-card-text>
      <!-- Chargement -->
      <v-skeleton-loader v-if="loading" type="table" class="my-2" />

      <!-- Erreur -->
      <v-alert v-else-if="error" type="error" variant="tonal" class="my-2">
        {{ error }}
      </v-alert>

      <!-- Tableau -->
      <v-data-table
        v-else
        :headers="headers"
        :items="students"
        :items-per-page="10"
        density="comfortable"
        class="rounded-lg"
      >
        <template #item.fullname="{ item }"> {{ item.lastname }} {{ item.firstname }} </template>

        <template #item.phone="{ item }">
          <code>{{ item.phone || '—' }}</code>
        </template>

        <!-- Placeholder actions présence (à brancher plus tard) -->
        <template #item.actions="{ item }">
          <v-btn size="small" variant="tonal" @click="markPresent(item)">Marquer présent</v-btn>
        </template>

        <template #no-data>
          <v-alert type="info" variant="tonal" class="my-2">
            Aucun élève dans cette classe.
          </v-alert>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  classId: {
    type: [Number, String],
    required: true,
  },
})

const API = import.meta.env.VITE_API_URL ?? 'https://emm-pointage.fr/'

const headers = [
  { title: 'Élève', key: 'fullname', sortable: true },
  { title: 'Téléphone', key: 'phone', sortable: false, align: 'start' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]

const students = ref([])
const loading = ref(true)
const error = ref(null)

async function fetchStudents() {
  if (!props.classId) return
  loading.value = true
  error.value = null
  try {
    const { data } = await axios.get(`${API}/api/students/${props.classId}`)
    // Attendu: [{ id, firstname, lastname, phone, class_id }, ...]
    students.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Erreur chargement élèves :', e)
    error.value = 'Impossible de charger les élèves.'
    students.value = []
  } finally {
    loading.value = false
  }
}

// dummy action pour plus tard
function markPresent(student) {
  // Ici tu brancheras /attendance avec session_id + student_id + status
  console.log('Présent ->', student.id, student.lastname, student.firstname)
}

onMounted(fetchStudents)
watch(() => props.classId, fetchStudents)
</script>
