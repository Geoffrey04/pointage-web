<template>
  <v-container>
    <v-card>
      <v-card-title>Tableau de présence</v-card-title>
      <v-divider />

      <!-- Scroll horizontal -->
      <div class="table-scroll-wrapper">
        <v-simple-table>
          <thead>
            <tr>
              <th>Élève</th>
              <th v-for="date in paginatedDates" :key="date" class="text-center">
                {{ formatDate(date) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.id">
              <td>{{ student.prenom }} {{ student.nom }}</td>
              <td v-for="date in paginatedDates" :key="date" class="text-center">
                <v-radio-group
                  :model-value="getAttendance(student.id, date)"
                  @update:modelValue="(val) => setAttendance(student.id, date, val)"
                  row
                  dense
                >
                  <v-radio label="Présent" value="present" />
                  <v-radio label="Retard" value="retard" />
                  <v-radio label="Absent" value="absent" />
                </v-radio-group>
              </td>
            </tr>
          </tbody>
        </v-simple-table>
      </div>

      <!-- Pagination dates uniquement -->
      <v-card-actions class="justify-center">
        <v-pagination v-model="currentDatePage" :length="datePageCount" total-visible="5" />
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStudentsStore } from '@/stores/Students'
import { useAttendanceStore } from '@/stores/Attendance'

const studentsStore = useStudentsStore()
const attendanceStore = useAttendanceStore()

const students = computed(() => studentsStore.students)
const sortedDates = computed(() => [...attendanceStore.dates].sort())

function getAttendance(studentId, date) {
  return attendanceStore.attendance[studentId]?.[date] || null
}

function setAttendance(studentId, date, status) {
  attendanceStore.setAttendance(studentId, date, status)
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}-${m}-${y}`
}

// --- Pagination des dates uniquement ---
const currentDatePage = ref(1)
const datesPerPage = 5

const datePageCount = computed(() => Math.ceil(sortedDates.value.length / datesPerPage))

const paginatedDates = computed(() => {
  const start = (currentDatePage.value - 1) * datesPerPage
  return sortedDates.value.slice(start, start + datesPerPage)
})
</script>

<style scoped>
.table-scroll-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
}
</style>
