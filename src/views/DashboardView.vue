<template>
  <v-container>
    <!-- Boutons d'accès aux pop-ups -->
    <v-row class="mb-4" justify="center" align="center">
      <v-btn color="primary" class="ma-2" @click="dialogAddStudent = true">
        Ajouter un élève
      </v-btn>

      <v-btn color="info" class="ma-2" @click="dialogStudentList = true"> Liste des élèves </v-btn>
    </v-row>

    <!-- Pop-up Ajouter un élève -->
    <v-dialog v-model="dialogAddStudent" max-width="520px">
      <v-card>
        <v-card-title>Ajouter un élève</v-card-title>
        <v-card-text>
          <AddStudentForm @student-added="onStudentAdded" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogAddStudent = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Pop-up Liste des élèves -->
    <v-dialog
      v-model="dialogStudentList"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <v-card>
        <v-toolbar dark color="primary">
          <v-toolbar-title>Liste des élèves</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="dialogStudentList = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text>
          <StudentList />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Sélecteur du jour de cours (classe) -->
    <div class="d-flex align-center mb-3 ga-2">
      <v-select
        v-model="classWeekday"
        :items="[
          { title: 'Lundi', value: 1 },
          { title: 'Mardi', value: 2 },
          { title: 'Mercredi', value: 3 },
          { title: 'Jeudi', value: 4 },
          { title: 'Vendredi', value: 5 },
          { title: 'Samedi', value: 6 },
          { title: 'Dimanche', value: 7 },
        ]"
        label="Jour de cours de la classe"
        density="comfortable"
        variant="outlined"
        style="max-width: 260px"
      />
      <v-btn
        color="primary"
        class="ml-2"
        @click="saveWeekday"
        :disabled="!classWeekday"
        :loading="savingWeekday"
      >
        Enregistrer
      </v-btn>
    </div>

    <!-- Tableau de présence -->
    <v-card class="rounded-xl elevation-2">
      <v-container>
        <h2 class="text-h6 mb-2">Tableau de présence</h2>
        <AttendanceMatrix ref="attendanceRef" :class-id="currentClassId" />
      </v-container>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="2000"
      location="bottom end"
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Fermer</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import AttendanceMatrix from '@/components/AttendanceMatrix.vue'
import AddStudentForm from '@/components/AddStudentForm.vue'
import StudentList from '@/components/StudentList.vue'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const route = useRoute()
const authHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// dialogs
const dialogAddStudent = ref(false)
const dialogStudentList = ref(false)

// ID de la classe depuis l’URL
const currentClassId = computed(() => Number(route.params.id))

// Sélecteur du jour de cours
const classWeekday = ref(null) // 1..7 (lun..dim)
const savingWeekday = ref(false)

// Snackbar
const snackbar = ref({ show: false, text: '', color: 'success' })

// Ref vers la matrice pour déclencher reload()
const attendanceRef = ref(null)
function refreshMatrix() {
  attendanceRef.value?.reload?.()
}

// Charger le weekday actuel de la classe
async function fetchClassWeekday() {
  try {
    // On lit toute la liste puis on filtre la classe courante
    const { data } = await axios.get(`${API}/api/classes`, { headers: authHeaders() })
    const cls = (Array.isArray(data) ? data : []).find((c) => Number(c.id) === currentClassId.value)
    classWeekday.value = cls ? Number(cls.weekday ?? 0) || null : null
  } catch (e) {
    console.error('fetchClassWeekday', e)
    classWeekday.value = null
  }
}

// Sauvegarde + régénération des sessions + refresh tableau
async function saveWeekday() {
  try {
    savingWeekday.value = true
    await axios.patch(
      `${API}/api/classes/${currentClassId.value}/weekday`,
      { weekday: classWeekday.value },
      { headers: authHeaders() },
    )
    refreshMatrix()
    snackbar.value = { show: true, text: 'Jour de classe mis à jour', color: 'success' }
  } catch (e) {
    console.error('saveWeekday', e)
    snackbar.value = { show: true, text: 'Erreur de mise à jour', color: 'error' }
  } finally {
    savingWeekday.value = false
  }
}

// évènement du formulaire d’ajout
function onStudentAdded() {
  refreshMatrix()
  // tu peux aussi rouvrir/fermer des dialogs ici si besoin
}

onMounted(fetchClassWeekday)
</script>
