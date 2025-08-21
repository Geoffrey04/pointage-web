<template>
  <v-card class="rounded-xl elevation-2">
    <v-card-title class="text-h6 d-flex justify-space-between align-center">
      <span>Présences</span>
      <div class="text-caption text-medium-emphasis">
        {{ totalStudents }} élèves • {{ sessions.length }} cours
      </div>
    </v-card-title>
    <v-divider />

    <v-card-text>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>

      <!-- Légende -->
      <div class="mb-3 d-flex align-center flex-wrap gap-4 text-body-2">
        <div class="d-flex align-center ga-1">
          <v-icon color="green">mdi-check-circle</v-icon> Présent
        </div>
        <div class="d-flex align-center ga-1">
          <v-icon color="orange">mdi-clock-time-four-outline</v-icon> En retard
        </div>
        <div class="d-flex align-center ga-1">
          <v-icon color="red">mdi-close-circle</v-icon> Absent
        </div>
      </div>

      <div class="table-scroll">
        <v-table fixed-header density="comfortable" class="attendance-table">
          <thead>
            <tr>
              <th class="sticky-left name-col z-20 bg-surface font-medium top-sticky">Élève</th>
              <th v-for="s in sessions" :key="s.id" class="text-center date-col top-sticky">
                {{ formatDate(s.date) }}
              </th>
            </tr>
          </thead>

          <tbody v-if="!loading">
            <tr v-for="st in pagedStudents" :key="st.id" class="row-strip">
              <!-- Colonne Élève -->
              <td class="sticky-left name-col bg-surface z-10">
                <div class="d-flex align-center justify-space-between">
                  <div class="font-medium truncate">{{ st.lastname }} {{ st.firstname }}</div>
                  <v-btn
                    size="x-small"
                    icon
                    variant="text"
                    @click="openStudentInfo(st)"
                    :aria-label="`Infos ${st.lastname} ${st.firstname}`"
                  >
                    <v-icon>mdi-information-outline</v-icon>
                  </v-btn>
                </div>
              </td>

              <!-- Cellules (élève × session) -->
              <td v-for="s in sessions" :key="s.id + '-' + st.id" class="text-center cell">
                <!-- État choisi : une seule icône -->
                <template v-if="getStatus(st.id, s.id)">
                  <v-btn
                    size="small"
                    icon
                    :color="colorOf(getStatus(st.id, s.id))"
                    variant="flat"
                    class="chosen-btn"
                    @click="toggleEdit(st.id, s.id)"
                    :title="labelOf(getStatus(st.id, s.id)) + ' — appuyer pour changer'"
                  >
                    <v-icon :icon="iconOf(getStatus(st.id, s.id))" />
                  </v-btn>
                </template>

                <!-- Pas encore choisi OU mode édition : 3 icônes -->
                <template v-else>
                  <div class="d-flex justify-center ga-1">
                    <v-btn
                      size="small"
                      icon
                      color="green"
                      variant="tonal"
                      @click="onSetStatus(st.id, s.id, 'present')"
                      title="Présent"
                    >
                      <v-icon>mdi-check-circle</v-icon>
                    </v-btn>
                    <v-btn
                      size="small"
                      icon
                      color="orange"
                      variant="tonal"
                      @click="onSetStatus(st.id, s.id, 'late')"
                      title="En retard"
                    >
                      <v-icon>mdi-clock-time-four-outline</v-icon>
                    </v-btn>
                    <v-btn
                      size="small"
                      icon
                      color="red"
                      variant="tonal"
                      @click="onSetStatus(st.id, s.id, 'absent')"
                      title="Absent"
                    >
                      <v-icon>mdi-close-circle</v-icon>
                    </v-btn>
                  </div>
                </template>

                <!-- Bouton “↺ changer” (mobile friendly) : apparaît quand une valeur est choisie -->
                <v-btn
                  v-if="getStatus(st.id, s.id)"
                  size="x-small"
                  variant="text"
                  class="mt-1"
                  @click="resetCell(st.id, s.id)"
                  title="Changer le statut"
                >
                  ↺
                </v-btn>
              </td>
            </tr>

            <tr v-if="pagedStudents.length === 0">
              <td :colspan="1 + sessions.length">
                <v-alert type="info" variant="tonal">Aucun élève dans cette page.</v-alert>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td :colspan="1 + sessions.length">
                <v-skeleton-loader type="table-row" />
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <!-- Pagination -->
      <div class="d-flex justify-end mt-3">
        <v-pagination v-model="page" :length="pages" total-visible="5" density="comfortable" />
      </div>
    </v-card-text>
  </v-card>

  <!-- Popup infos élève (sans ID) -->
  <v-dialog v-model="studentDialog" max-width="420">
    <v-card>
      <v-card-title class="text-h6">Infos élève</v-card-title>
      <v-card-text v-if="selectedStudent">
        <div class="mb-2"><strong>Nom :</strong> {{ selectedStudent.lastname }}</div>
        <div class="mb-2"><strong>Prénom :</strong> {{ selectedStudent.firstname }}</div>
        <div class="mb-2"><strong>Téléphone :</strong> {{ selectedStudent.phone || '—' }}</div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="studentDialog = false">Fermer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="1800">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  classId: { type: [Number, String], required: true },
})

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const students = ref([])
const sessions = ref([]) // [{id,date}]
const attendanceMap = reactive({}) // { [studentId]: { [sessionId]: 'present'|'late'|'absent' | null } }

const loading = ref(true)
const error = ref(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

// Pagination
const rowsPerPage = ref(10)
const page = ref(1)
const totalStudents = computed(() => students.value.length)
const pages = computed(() => Math.max(1, Math.ceil(totalStudents.value / rowsPerPage.value)))
const pagedStudents = computed(() => {
  const start = (page.value - 1) * rowsPerPage.value
  return students.value.slice(start, start + rowsPerPage.value)
})

// Popup infos élève
const studentDialog = ref(false)
const selectedStudent = ref(null)
function openStudentInfo(st) {
  selectedStudent.value = st
  studentDialog.value = true
}

const formatDate = (d) => {
  // d attendu: 'YYYY-MM-DD'
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return y && m && dd ? `${dd}-${m}-${y}` : '—'
}

function ensureKey(studentId, sessionId) {
  if (!attendanceMap[studentId]) attendanceMap[studentId] = {}
  if (!(sessionId in attendanceMap[studentId])) attendanceMap[studentId][sessionId] = null
}

function getStatus(studentId, sessionId) {
  ensureKey(studentId, sessionId)
  return attendanceMap[studentId][sessionId]
}

function resetCell(studentId, sessionId) {
  ensureKey(studentId, sessionId)
  attendanceMap[studentId][sessionId] = null
}

function colorOf(status) {
  return status === 'present'
    ? 'green'
    : status === 'late'
      ? 'orange'
      : status === 'absent'
        ? 'red'
        : undefined
}

function iconOf(status) {
  return status === 'present'
    ? 'mdi-check-circle'
    : status === 'late'
      ? 'mdi-clock-time-four-outline'
      : status === 'absent'
        ? 'mdi-close-circle'
        : 'mdi-help-circle-outline'
}

function labelOf(status) {
  return status === 'present'
    ? 'Présent'
    : status === 'late'
      ? 'En retard'
      : status === 'absent'
        ? 'Absent'
        : ''
}

async function fetchAll() {
  loading.value = true
  error.value = null
  try {
    // élèves
    const studentsRes = await axios.get(`${API}/api/students/${props.classId}`)
    students.value = Array.isArray(studentsRes.data) ? studentsRes.data : []

    // sessions (avec id + date strict)
    const sessionsRes = await axios.get(`${API}/sessions/${props.classId}`)
    sessions.value = (Array.isArray(sessionsRes.data) ? sessionsRes.data : []).filter(
      (s) => s && typeof s.id === 'number' && s.date,
    )

    // attendance existante (optionnelle)
    try {
      const token = localStorage.getItem('token')
      const attRes = await axios.get(`${API}/attendance/${props.classId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      for (const row of attRes.data || []) {
        const status = row.status === 'excused' ? 'absent' : row.status
        ensureKey(row.student_id, row.session_id)
        attendanceMap[row.student_id][row.session_id] = status
      }
    } catch (e) {
      if (e?.response?.status !== 404) {
        console.warn('Préchargement attendance ignoré :', e?.message || e)
      }
    }

    // s’assurer que toutes les clés existent
    for (const st of students.value) {
      for (const s of sessions.value) {
        ensureKey(st.id, s.id)
      }
    }

    // sécurité: si page > pages (après chargement), reviens à la dernière
    if (page.value > pages.value) page.value = pages.value
  } catch (e) {
    console.error(e)
    error.value = 'Impossible de charger élèves/sessions.'
  } finally {
    loading.value = false
  }
}

async function onSetStatus(studentId, sessionId, status) {
  try {
    ensureKey(studentId, sessionId)
    attendanceMap[studentId][sessionId] = status // MAJ optimiste

    const token = localStorage.getItem('token')
    await axios.post(
      `${API}/attendance`,
      {
        student_id: studentId,
        session_id: sessionId,
        status, // 'present' | 'late' | 'absent'
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    )

    snackbar.value = { show: true, text: '✅ Enregistré', color: 'success' }
  } catch (e) {
    console.error('Erreur sauvegarde présence :', e)
    snackbar.value = { show: true, text: '❌ Erreur enregistrement', color: 'error' }
  }
}

onMounted(fetchAll)
watch(() => props.classId, fetchAll)
</script>

<style scoped>
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Sticky header + sticky première colonne */
.top-sticky {
  position: sticky;
  top: 0;
  z-index: 15;
  background: var(--v-theme-surface);
}
.sticky-left {
  position: sticky;
  left: 0;
}

/* Colonne nom : largeur fixe, pour éviter qu'elle “glisse” sur le scroll horizontal */
.name-col {
  min-width: 180px;
  max-width: 240px;
}
.date-col {
  min-width: 96px;
}

/* Mobile affinage */
@media (max-width: 600px) {
  .name-col {
    min-width: 160px;
    max-width: 200px;
  }
  .date-col {
    min-width: 80px;
  }
  .attendance-table :is(th, td) {
    padding: 6px 8px;
  }
}

/* Zebra rows light */
.row-strip:nth-child(odd) > td:not(.sticky-left) {
  background: rgba(0, 0, 0, 0.02);
}

/* Cellules */
.cell {
  vertical-align: middle;
}
.chosen-btn {
  transform: translateZ(0);
} /* évite scintillement sur iOS */
</style>
