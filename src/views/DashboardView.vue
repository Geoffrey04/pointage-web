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

    <!-- Barre de contrôle du jour de cours (modern + responsive) -->
    <v-sheet class="control-bar rounded-xl px-3 py-2 mb-4">
      <div class="control-row">
        <!-- Zone jours -->
        <div class="control-days">
          <v-icon size="20" class="mr-1">mdi-calendar-week</v-icon>
          <!-- Libellé compact en mobile -->
          <div class="label d-none d-sm-inline text-medium-emphasis">Jour de cours</div>
          <div class="label d-sm-none text-medium-emphasis">Jour</div>

          <!-- Slide group = scroll horizontal + flèches -->
          <v-slide-group v-model="classWeekday" class="days-scroll" mandatory show-arrows="hover">
            <v-slide-group-item
              v-for="d in weekdayChips"
              :key="d.value"
              :value="d.value"
              v-slot="{ isSelected, toggle }"
            >
              <v-chip
                :color="isSelected ? 'primary' : undefined"
                variant="tonal"
                class="mx-1 my-1"
                @click="toggle"
              >
                {{ smAndDown ? d.short : d.title }}
              </v-chip>
            </v-slide-group-item>
          </v-slide-group>
        </div>

        <!-- Actions -->
        <div class="control-actions">
          <v-btn
            color="primary"
            :loading="savingWeekday"
            :disabled="!classWeekday"
            @click="saveWeekday"
            prepend-icon="mdi-content-save"
            class="save-btn"
          >
            Enregistrer
          </v-btn>

          <v-chip
            v-if="lastSavedAt"
            size="small"
            variant="tonal"
            color="success"
            prepend-icon="mdi-check"
            class="ml-2 d-none d-sm-inline"
          >
            Sauvegardé
          </v-chip>
        </div>
      </div>
    </v-sheet>

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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import AttendanceMatrix from '@/components/AttendanceMatrix.vue'
import AddStudentForm from '@/components/AddStudentForm.vue'
import StudentList from '@/components/StudentList.vue'
import { useDisplay } from 'vuetify'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const route = useRoute()
const { smAndDown } = useDisplay()
const authHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ID de la classe depuis l’URL
const currentClassId = computed(() => Number(route.params.id))

// Sélecteur du jour de cours
const classWeekday = ref(null) // 1..7 (lun..dim)
const savingWeekday = ref(false)

// état “dernier enregistrement”
const lastSavedAt = ref(null)

// items pour les chips (1..7)
const weekdayChips = [
  { title: 'Lundi', short: 'Lun', value: 1 },
  { title: 'Mardi', short: 'Mar', value: 2 },
  { title: 'Mercredi', short: 'Mer', value: 3 },
  { title: 'Jeudi', short: 'Jeu', value: 4 },
  { title: 'Vendredi', short: 'Ven', value: 5 },
  { title: 'Samedi', short: 'Sam', value: 6 },
  { title: 'Dimanche', short: 'Dim', value: 7 },
]

// reset du badge “Sauvegardé” quand on change de sélection
watch(classWeekday, () => {
  lastSavedAt.value = null
})

// Snackbar
const snackbar = ref({ show: false, text: '', color: 'success' })

// dialogs
const dialogAddStudent = ref(false)
const dialogStudentList = ref(false)

// Ref vers la matrice pour déclencher reload()
const attendanceRef = ref(null)
function refreshMatrix() {
  attendanceRef.value?.reload?.()
}

// Charger le weekday actuel de la classe
async function fetchClassWeekday() {
  try {
    const { data } = await axios.get(`${API}/api/classes`, { headers: authHeaders() })
    const cls = (Array.isArray(data) ? data : []).find((c) => Number(c.id) === currentClassId.value)
    classWeekday.value = cls ? Number(cls.weekday ?? 0) || null : null
  } catch (e) {
    console.error('fetchClassWeekday', e)
    classWeekday.value = null
  }
}

// Sauvegarde + régénération des sessions + refresh tableau + badge
async function saveWeekday() {
  try {
    savingWeekday.value = true
    const startYear = 2025 // ⬅️ force la génération 2025–2026
    await axios.patch(
      `${API}/api/classes/${currentClassId.value}/weekday`,
      { weekday: classWeekday.value, startYear }, // ⬅️ ici
      { headers: authHeaders() },
    )
    refreshMatrix()
    lastSavedAt.value = Date.now()
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
  dialogAddStudent.value = false
}

onMounted(fetchClassWeekday)
</script>

<style scoped>
.control-bar {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: var(--v-shadow-2);
}

/* scroll horizontal propre en mobile */
.chip-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 2px;
}
.chip-scroll::-webkit-scrollbar {
  height: 6px;
}
.chip-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 999px;
}

.control-bar {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.25);
  box-shadow: var(--v-shadow-2);
}

.control-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.control-days {
  display: flex;
  align-items: center;
  min-width: 0; /* permet le scroll du groupe */
}

.label {
  margin-right: 8px;
  white-space: nowrap;
}

.days-scroll {
  flex: 1 1 auto;
  min-width: 0;
}
.days-scroll :deep(.v-slide-group__content) {
  padding: 0 2px;
}

/* Actions : bouton plein largeur en mobile */
.control-actions {
  display: flex;
  align-items: center;
}
.save-btn {
  min-width: 160px;
}

@media (max-width: 600px) {
  .control-row {
    grid-template-columns: 1fr; /* empile jours + bouton */
  }
  .control-actions {
    width: 100%;
  }
  .save-btn {
    width: 100%;
  }
}
</style>
