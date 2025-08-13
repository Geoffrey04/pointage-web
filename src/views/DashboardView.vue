<template>
  <v-container>
    <h2>Classe : {{ classe.nom || 'Classe inconnue' }}</h2>

    <v-row>
      <v-col cols="12" md="6">
        <AddStudent :classeId="classeId" @studentAdded="fetchStudents" />
      </v-col>

      <v-col cols="12" md="6">
        <DateSelector :classeId="classeId" @dateChanged="fetchAttendance" />
      </v-col>
    </v-row>

    <StudentList :students="students" :classeId="classeId" v-if="students.length > 0" />

    <div v-else class="text-center my-4">Aucun élève dans cette classe.</div>

    <PresenceTable
      v-if="students.length > 0"
      :students="students"
      :classeId="classeId"
      :selectedDate="selectedDate"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

import AddStudent from '@/components/AddStudentForm.vue'
import DateSelector from '@/components/DateSelector.vue'
import StudentList from '@/components/StudentList.vue'

const route = useRoute()
const classeId = route.params.id
const classe = ref({})
const students = ref([])
const selectedDate = ref(null)
const userStore = useUserStore()

// Récupérer la classe
const fetchClasse = async () => {
  try {
    const res = await axios.get(`http://localhost:3000/classes/${classeId}`, {
      headers: { Authorization: `Bearer ${userStore.token}` },
    })
    classe.value = res.data
  } catch (err) {
    console.error('Erreur récupération classe :', err)
  }
}

// Récupérer les élèves
const fetchStudents = async () => {
  try {
    const res = await axios.get(`http://localhost:3000/classes/${classeId}/students`, {
      headers: { Authorization: `Bearer ${userStore.token}` },
    })
    students.value = res.data
  } catch (err) {
    console.error('Erreur récupération élèves :', err)
    students.value = []
  }
}

// Récupérer les présences pour la date sélectionnée
const fetchAttendance = (date) => {
  selectedDate.value = date
  // PresenceTable se mettra à jour automatiquement grâce au prop :selectedDate
}

onMounted(async () => {
  if (!userStore.token) return
  await fetchClasse()
  await fetchStudents()
})
</script>
