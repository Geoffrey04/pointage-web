<template>
  <v-container>
    <!-- Boutons d'accès aux pop-ups -->
    <v-row class="mb-4" justify="center" align="center">
      <v-btn color="primary" class="ma-2" @click="dialogAddStudent = true">
        Ajouter un élève
      </v-btn>

      <v-btn color="info" class="ma-2" @click="dialogStudentList = true"> Liste des élèves </v-btn>

      <v-btn color="secondary" class="ma-2" prepend-icon="mdi-tune" @click="openClassParams">
        Paramètres de classe
      </v-btn>
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

    <!-- Dialog Paramètres de la classe -->
    <v-dialog v-model="dialogClassParams" max-width="560">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center ga-2">
          <v-icon>mdi-tune</v-icon>
          Paramètres de la classe
          <v-spacer />
          <v-chip
            v-if="lastSavedAt"
            size="small"
            variant="tonal"
            color="success"
            prepend-icon="mdi-check"
          >
            Sauvegardé
          </v-chip>
        </v-card-title>

        <v-card-text>
          <div class="text-body-2 text-medium-emphasis mb-2">Jour de cours (par défaut)</div>

          <!-- Desktop / tablette : chips complets -->
          <v-chip-group v-model="classWeekday" class="d-none d-sm-flex flex-wrap" mandatory>
            <v-chip
              v-for="d in weekdayChips"
              :key="d.value"
              :value="d.value"
              filter
              variant="tonal"
              class="my-1 mr-1"
            >
              {{ d.title }}
            </v-chip>
          </v-chip-group>

          <!-- Mobile : chips courts, scroll horizontal -->
          <div class="d-flex d-sm-none chip-scroll mt-1">
            <v-chip-group v-model="classWeekday" mandatory>
              <v-chip
                v-for="d in weekdayChips"
                :key="d.value"
                :value="d.value"
                filter
                variant="tonal"
                class="mr-2"
              >
                {{ d.short }}
              </v-chip>
            </v-chip-group>
          </div>

          <v-alert type="info" variant="tonal" class="mt-4">
            Ce jour sera utilisé par défaut pour la génération des séances. Les élèves peuvent avoir
            un jour spécifique (optionnel) dans leur fiche.
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogClassParams = false">Annuler</v-btn>
          <v-btn
            color="primary"
            :loading="savingWeekday"
            :disabled="!classWeekday"
            @click="saveWeekday"
            prepend-icon="mdi-content-save"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { api } from '@/stores/user'
import AttendanceMatrix from '@/components/AttendanceMatrix.vue'
import AddStudentForm from '@/components/AddStudentForm.vue'
import StudentList from '@/components/StudentList.vue'

const route = useRoute()

const currentClassId = computed(() => Number(route.params.id))

// ─── Paramètres de classe ────────────────────────────────────
const dialogClassParams = ref(false)
const savingWeekday = ref(false)
const lastSavedAt = ref(null)
const classWeekday = ref(null) // 1..7 (lun..dim) ou null

const weekdayChips = [
  { title: 'Lundi', short: 'Lun', value: 1 },
  { title: 'Mardi', short: 'Mar', value: 2 },
  { title: 'Mercredi', short: 'Mer', value: 3 },
  { title: 'Jeudi', short: 'Jeu', value: 4 },
  { title: 'Vendredi', short: 'Ven', value: 5 },
  { title: 'Samedi', short: 'Sam', value: 6 },
  { title: 'Dimanche', short: 'Dim', value: 7 },
]

// Réinitialise le badge “Sauvegardé” dès qu'on change la sélection
watch(classWeekday, () => {
  lastSavedAt.value = null
})

const snackbar = ref({ show: false, text: '', color: 'success' })
const dialogAddStudent = ref(false)
const dialogStudentList = ref(false)

const attendanceRef = ref(null)
function refreshMatrix() {
  attendanceRef.value?.reload?.()
}

async function fetchClassWeekday() {
  try {
    const { data } = await api.get(`/api/classes/${currentClassId.value}`)
    classWeekday.value = Number(data?.weekday ?? 0) || null
  } catch (e) {
    console.error('fetchClassWeekday :', e)
    classWeekday.value = null
  }
}

async function openClassParams() {
  await fetchClassWeekday()
  lastSavedAt.value = null
  dialogClassParams.value = true
}

async function saveWeekday() {
  try {
    savingWeekday.value = true
    await api.patch(`/api/classes/${currentClassId.value}/weekday`, {
      weekday: classWeekday.value,
    })
    lastSavedAt.value = Date.now()
    snackbar.value = { show: true, text: 'Jour de classe mis à jour', color: 'success' }
    dialogClassParams.value = false
    refreshMatrix()
  } catch (e) {
    console.error('saveWeekday :', e)
    snackbar.value = { show: true, text: 'Erreur de mise à jour', color: 'error' }
  } finally {
    savingWeekday.value = false
  }
}

function onStudentAdded() {
  refreshMatrix()
  dialogAddStudent.value = false
}

// Recharge le jour si la classe change (navigation entre classes)
watch(currentClassId, fetchClassWeekday)

onMounted(fetchClassWeekday)
</script>

<style scoped>
.chip-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}
.chip-scroll::-webkit-scrollbar {
  height: 6px;
}
.chip-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 999px;
}
</style>
