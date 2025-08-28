<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const headers = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// KPIs
const kpis = ref([
  { label: 'Utilisateurs', value: 0, icon: 'mdi-account-group', color: 'primary' },
  { label: 'Élèves', value: 0, icon: 'mdi-account-school', color: 'teal' },
  { label: 'Classes', value: 0, icon: 'mdi-google-classroom', color: 'indigo' },
  { label: 'Cours', value: 0, icon: 'mdi-calendar-multiple', color: 'orange' },
])

// Data
const classes = ref([])
const profs = ref([])
const attendance = ref([])

// Snackbar
const snackbar = ref({ show: false, text: '', color: 'success' })

// Form dialog
const dialog = ref({ open: false, mode: 'create', id: null })
const formRef = ref(null)
const form = ref({ name: '', description: '', owner_id: null })

const confirm = ref({ open: false, item: null })

// Actions
async function loadKPIs() {
  const { data } = await axios.get(`${API}/api/admin/stats`, { headers: headers() })
  kpis.value[0].value = Number(data.users || 0)
  kpis.value[1].value = Number(data.students || 0)
  kpis.value[2].value = Number(data.classes || 0)
  kpis.value[3].value = Number(data.sessions || 0)
}
async function loadProfs() {
  const { data } = await axios.get(`${API}/api/admin/profs`, { headers: headers() })
  profs.value = Array.isArray(data) ? data : []
}
async function loadClasses() {
  const { data } = await axios.get(`${API}/api/admin/classes`, { headers: headers() })
  classes.value = Array.isArray(data) ? data : []
}
async function loadAttendance() {
  const { data } = await axios.get(`${API}/api/admin/attendance-rate`, { headers: headers() })
  attendance.value = Array.isArray(data) ? data : []
}

onMounted(async () => {
  try {
    await Promise.all([loadKPIs(), loadProfs(), loadClasses(), loadAttendance()])
  } catch (e) {
    console.error('Admin init', e)
    snackbar.value = { show: true, text: 'Erreur de chargement', color: 'error' }
  }
})
</script>

<template>
  <v-container class="py-6">
    <v-card class="rounded-xl elevation-2">
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-subtitle-1">Taux de présence par classe</span>
        <v-btn size="small" prepend-icon="mdi-refresh" variant="text" @click="loadAttendance">
          Rafraîchir
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-list>
          <v-list-item v-for="row in attendance" :key="row.id" class="rounded-lg mb-1">
            <v-list-item-title>{{ row.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-medium-emphasis">
              {{ row.presents }}/{{ row.marked }} présents
            </v-list-item-subtitle>
            <template #append>
              <v-chip
                :color="row.rate >= 90 ? 'green' : row.rate >= 75 ? 'orange' : 'red'"
                variant="tonal"
              >
                {{ row.rate }}%
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-container>
</template>
