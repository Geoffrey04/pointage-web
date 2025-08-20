<template>
  <v-container>
    <v-card class="pa-4">
      <v-card-title>Dates de cours</v-card-title>
      <v-divider class="mb-4" />

      <!-- Choix année et jour habituel -->
      <v-row class="mb-4" dense>
        <v-col cols="12" sm="6">
          <v-select v-model="selectedYear" :items="availableYears" label="Année scolaire" />
        </v-col>

        <v-col cols="12" sm="6">
          <v-select
            v-model="selectedWeekday"
            :items="weekdays"
            item-title="label"
            item-value="value"
            label="Jour habituel de cours"
          />
        </v-col>

        <v-col cols="12" class="d-flex justify-end">
          <v-btn color="primary" @click="generateRecurringDates">Générer les dates hebdo</v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

const selectedYear = ref(new Date().getFullYear())
const selectedWeekday = ref(null)
const emit = defineEmits(['dates-selected'])

const weekdays = [
  { label: 'Dimanche', value: 0 },
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 },
]

const availableYears = [2024, 2025, 2026]

// Jours fériés français (fixes)
function isHoliday(date) {
  const mmdd = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')}`
  const fixed = ['01-01', '05-01', '05-08', '07-14', '08-15', '11-01', '11-11', '12-25']
  return fixed.includes(mmdd)
}

// Génère les dates récurrentes et les émet vers le parent
function generateRecurringDates() {
  if (!selectedYear.value || selectedWeekday.value === null) return

  const start = new Date(`${selectedYear.value}-09-01`)
  const end = new Date(`${selectedYear.value + 1}-06-30`)
  const current = new Date(start)
  const dates = []

  while (current <= end) {
    if (current.getDay() === selectedWeekday.value && !isHoliday(current)) {
      dates.push(current.toISOString().split('T')[0])
    }
    current.setDate(current.getDate() + 1)
  }

  // Émission des dates vers le parent
  emit('dates-selected', dates)
}
</script>
