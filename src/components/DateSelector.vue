<template>
  <v-container>
    <v-card class="pa-4 rounded-xl elevation-4">
      <v-card-title class="text-h6 text-md-h5 font-weight-bold text-primary">
        📅 Planification des cours
      </v-card-title>
      <v-divider class="mb-4" />

      <!-- Étape 1 : choix année + jour -->
      <v-row dense class="mb-4">
        <v-col cols="12" sm="6">
          <v-select
            v-model="selectedYear"
            :items="availableYears"
            label="Année scolaire"
            variant="outlined"
            density="comfortable"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <v-select
            v-model="selectedWeekday"
            :items="weekdays"
            item-title="label"
            item-value="value"
            label="Jour habituel de cours"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
      </v-row>

      <v-row justify="end" class="mb-4">
        <v-btn
          color="primary"
          prepend-icon="mdi-calendar-plus"
          class="rounded-pill px-6"
          @click="generateRecurringDates"
        >
          Générer automatiquement
        </v-btn>
      </v-row>

      <!-- Étape 2 : ajout manuel -->
      <v-card class="pa-3 rounded-lg elevation-1 mb-4">
        <v-card-subtitle class="text-subtitle-2 font-weight-medium mb-2">
          ➕ Ajouter une date manuellement
        </v-card-subtitle>

        <v-row dense>
          <v-col cols="12" sm="8">
            <v-menu
              v-model="menu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              max-width="290px"
              min-width="290px"
            >
              <template #activator="{ props }">
                <v-text-field
                  v-model="manualDate"
                  label="Sélectionnez une date"
                  prepend-icon="mdi-calendar"
                  readonly
                  v-bind="props"
                />
              </template>
              <v-date-picker v-model="manualDate" />
            </v-menu>
          </v-col>

          <v-col cols="12" sm="4" class="d-flex align-center">
            <v-btn
              color="secondary"
              prepend-icon="mdi-plus"
              class="rounded-pill"
              block
              @click="addManualDate"
            >
              Ajouter
            </v-btn>
          </v-col>
        </v-row>
      </v-card>

      <!-- Résumé -->
      <v-card class="pa-3 rounded-lg elevation-1">
        <v-card-subtitle class="text-subtitle-2 font-weight-medium mb-2">
          ✅ Dates sélectionnées ({{ highlightedDates.length }})
        </v-card-subtitle>
        <v-chip-group column>
          <v-chip
            v-for="date in highlightedDates"
            :key="date"
            color="primary"
            variant="tonal"
            class="ma-1"
            closable
            @click:close="removeDate(date)"
          >
            {{ formatDate(date) }}
          </v-chip>
        </v-chip-group>
      </v-card>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

// Récupérer l'ID de la classe depuis l'URL
const route = useRoute()
const classId = parseInt(route.params.classId)

// Variables
const selectedYear = ref(null)
const selectedWeekday = ref(null)
const highlightedDates = ref([])
const manualDate = ref(null)
const menu = ref(false)

// Snackbar
const snackbar = ref({ show: false, text: '', color: 'success' })

// Jours dispo
const weekdays = [
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 },
  { label: 'Dimanche', value: 0 },
]

// 🔹 Envoi en BDD
const saveDatesToDB = async () => {
  try {
    if (highlightedDates.value.length === 0) return

    // Conversion en format yyyy-mm-dd
    const formattedDates = highlightedDates.value.map(
      (d) => new Date(d).toISOString().split('T')[0],
    )

    const payload = {
      class_id: classId,
      dates: formattedDates,
    }

    console.log('📤 Payload envoyé :', payload)

    await axios.post('http://localhost:3000/sessions', payload)

    snackbar.value = { show: true, text: '✅ Dates enregistrées', color: 'success' }
  } catch (err) {
    console.error('❌ Erreur enregistrement sessions :', err)
    snackbar.value = { show: true, text: '❌ Erreur enregistrement', color: 'error' }
  }
}

// 🔹 Génération dates récurrentes
const generateRecurringDates = () => {
  if (!selectedYear.value || selectedWeekday.value === null) return

  const [startYear] = selectedYear.value.split('-').map(Number)
  const start = new Date(startYear, 8, 1) // Septembre
  const end = new Date(startYear + 1, 6, 30) // Juin suivant

  const dates = []
  const current = new Date(start)

  while (current <= end) {
    if (current.getDay() === selectedWeekday.value) {
      dates.push(new Date(current).toISOString().split('T')[0])
    }
    current.setDate(current.getDate() + 1)
  }

  highlightedDates.value = dates
  saveDatesToDB()
}

// 🔹 Ajouter manuellement
const addManualDate = () => {
  if (manualDate.value) {
    const formatted = new Date(manualDate.value).toISOString().split('T')[0]
    if (!highlightedDates.value.includes(formatted)) {
      highlightedDates.value.push(formatted)
      saveDatesToDB()
    }
    manualDate.value = null
    menu.value = false
  }
}

// 🔹 Supprimer une date
const removeDate = (date) => {
  highlightedDates.value = highlightedDates.value.filter((d) => d !== date)
  saveDatesToDB()
}

// 🔹 Format affichage dd-mm-yyyy
const formatDate = (date) => {
  const [y, m, d] = date.split('-')
  return `${d}-${m}-${y}`
}
</script>

<style scoped>
.v-card {
  background: linear-gradient(135deg, #f9fafb, #ffffff);
}

.v-btn {
  text-transform: none;
  font-weight: 600;
}

.v-chip {
  font-size: 0.8rem;
}
</style>
