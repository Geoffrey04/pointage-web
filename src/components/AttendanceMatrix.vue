<template>
  <v-card class="rounded-xl elevation-2">
    <v-card-title class="text-h6 d-flex justify-space-between align-center">
      <span>Présences</span>
      <div class="text-caption text-medium-emphasis">
        {{ students.length }} élèves • {{ sessions.length }} cours
      </div>
    </v-card-title>
    <v-divider />

    <v-card-text>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

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

      <!-- ====== MOBILE : Cartes par élève ====== -->
      <div v-if="smAndDown" class="d-flex flex-column ga-3">
        <v-skeleton-loader v-if="loading" type="card@3" />

        <v-card v-else v-for="st in students" :key="st.id" class="rounded-xl border-thin">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="font-weight-medium">{{ st.lastname }} {{ st.firstname }}</div>
              <v-btn size="x-small" icon variant="text" @click="openStudentInfo(st)">
                <v-icon>mdi-information-outline</v-icon>
              </v-btn>
            </div>

            <!-- Ruban horizontal de dates -->
            <div class="dates-ribbon">
              <div v-for="s in sessions" :key="s.id" class="date-cell">
                <div class="date-label text-caption text-medium-emphasis">
                  {{ formatDate(s.date) }}
                </div>

                <!-- État choisi -->
                <template v-if="getStatus(st.id, s.id)">
                  <v-btn
                    class="icon-btn"
                    :class="statusClass(getStatus(st.id, s.id))"
                    variant="text"
                    @click="toggleEdit(st.id, s.id)"
                    :title="labelOf(getStatus(st.id, s.id)) + ' — appuyer pour changer'"
                  >
                    <v-icon :icon="iconOf(getStatus(st.id, s.id))" />
                  </v-btn>
                  <v-btn
                    size="x-small"
                    variant="text"
                    class="mt-1"
                    @click="resetCell(st.id, s.id)"
                    title="Changer"
                    >↺</v-btn
                  >
                </template>

                <!-- Choix -->
                <template v-else>
                  <div class="status-inline">
                    <v-btn
                      class="icon-btn status-present"
                      variant="text"
                      @click="onSetStatus(st.id, s.id, 'present')"
                      title="Présent"
                      aria-label="Présent"
                    >
                      <v-icon>mdi-check</v-icon>
                    </v-btn>
                    <v-btn
                      class="icon-btn status-late"
                      variant="text"
                      @click="onSetStatus(st.id, s.id, 'late')"
                      title="En retard"
                      aria-label="En retard"
                    >
                      <v-icon>mdi-clock-time-four-outline</v-icon>
                    </v-btn>
                    <v-btn
                      class="icon-btn status-absent"
                      variant="text"
                      @click="onSetStatus(st.id, s.id, 'absent')"
                      title="Absent"
                      aria-label="Absent"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </template>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- ====== DESKTOP : Table ====== -->
      <div v-else class="table-scroll">
        <v-table fixed-header density="comfortable" class="attendance-table">
          <thead>
            <tr>
              <th class="sticky-left name-col z-20 bg-surface top-sticky">Élève</th>
              <th v-for="s in sessions" :key="s.id" class="text-center date-col top-sticky">
                {{ formatDate(s.date) }}
              </th>
            </tr>
          </thead>

          <tbody v-if="!loading">
            <tr v-for="st in students" :key="st.id" class="row-strip">
              <td class="sticky-left name-col bg-surface z-10">
                <div class="d-flex align-center justify-space-between">
                  <div class="font-medium truncate">{{ st.lastname }} {{ st.firstname }}</div>
                  <v-btn size="x-small" icon variant="text" @click="openStudentInfo(st)">
                    <v-icon>mdi-information-outline</v-icon>
                  </v-btn>
                </div>
              </td>

              <td v-for="s in sessions" :key="s.id + '-' + st.id" class="text-center cell">
                <template v-if="getStatus(st.id, s.id)">
                  <v-btn
                    class="icon-btn"
                    :class="statusClass(getStatus(st.id, s.id))"
                    variant="text"
                    @click="toggleEdit(st.id, s.id)"
                    :title="labelOf(getStatus(st.id, s.id)) + ' — cliquer pour changer'"
                  >
                    <v-icon :icon="iconOf(getStatus(st.id, s.id))" />
                  </v-btn>
                  <v-btn
                    size="x-small"
                    variant="text"
                    class="mt-1"
                    @click="resetCell(st.id, s.id)"
                    title="Changer"
                    >↺</v-btn
                  >
                </template>

                <template v-else>
                  <div class="status-inline">
                    <v-btn
                      class="icon-btn status-present"
                      variant="text"
                      @click="onSetStatus(st.id, s.id, 'present')"
                      title="Présent"
                    >
                      <v-icon>mdi-check</v-icon>
                    </v-btn>
                    <v-btn
                      class="icon-btn status-late"
                      variant="text"
                      @click="onSetStatus(st.id, s.id, 'late')"
                      title="En retard"
                    >
                      <v-icon>mdi-clock-time-four-outline</v-icon>
                    </v-btn>
                    <v-btn
                      class="icon-btn status-absent"
                      variant="text"
                      @click="onSetStatus(st.id, s.id, 'absent')"
                      title="Absent"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </template>
              </td>
            </tr>

            <tr v-if="students.length === 0">
              <td :colspan="1 + sessions.length">
                <v-alert type="info" variant="tonal">Aucun élève.</v-alert>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td :colspan="1 + sessions.length"><v-skeleton-loader type="table-row" /></td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card-text>
  </v-card>

  <!-- Popup infos élève -->
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

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="1600">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import axios from 'axios'

const { smAndDown } = useDisplay()

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

// Dialog infos élève
const studentDialog = ref(false)
const selectedStudent = ref(null)
function openStudentInfo(st) {
  selectedStudent.value = st
  studentDialog.value = true
}

// Utils
function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const formatDate = (d) => {
  if (!d) return '—'
  const parts = String(d).split('-')
  if (parts.length !== 3) return d
  const [y, m, dd] = parts
  return `${dd}-${m}-${y}`
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

function toggleEdit(studentId, sessionId) {
  resetCell(studentId, sessionId)
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
function statusClass(status) {
  return status === 'present'
    ? 'status-present'
    : status === 'late'
      ? 'status-late'
      : status === 'absent'
        ? 'status-absent'
        : ''
}

// Charger élèves + sessions + présences
async function fetchAll() {
  loading.value = true
  error.value = null
  try {
    const auth = authHeaders()

    // 1) élèves
    const stRes = await axios.get(`${API}/api/students/${props.classId}`, { headers: auth })
    students.value = Array.isArray(stRes.data) ? stRes.data : []

    // 2) sessions (dates)
    const sesRes = await axios.get(`${API}/sessions/${props.classId}`, { headers: auth })
    sessions.value = (Array.isArray(sesRes.data) ? sesRes.data : []).filter(
      (s) => s && typeof s.id === 'number' && s.date,
    )

    // 3) présences existantes
    const attRes = await axios.get(`${API}/attendance/${props.classId}`, { headers: auth })

    // reset propre
    for (const k in attendanceMap) delete attendanceMap[k]

    for (const row of attRes.data || []) {
      ensureKey(row.student_id, row.session_id)
      attendanceMap[row.student_id][row.session_id] =
        row.status === 'excused' ? 'absent' : row.status
    }

    // pré-hydrate cellules nulles
    for (const st of students.value) {
      for (const s of sessions.value) ensureKey(st.id, s.id)
    }
  } catch (e) {
    console.error('fetchAll error', e)
    error.value = 'Impossible de charger élèves/sessions.'
  } finally {
    loading.value = false
  }
}

// API publique pour le parent
function reload() {
  fetchAll()
}
defineExpose({ reload })

async function onSetStatus(studentId, sessionId, status) {
  try {
    ensureKey(studentId, sessionId)
    attendanceMap[studentId][sessionId] = status // MAJ optimiste
    await axios.post(
      `${API}/attendance`,
      {
        student_id: studentId,
        session_id: sessionId,
        status,
      },
      { headers: authHeaders() },
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
/* ===== Desktop table fixes ===== */
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.attendance-table {
  table-layout: fixed;
}
.attendance-table th,
.attendance-table td {
  white-space: nowrap;
}
.top-sticky {
  position: sticky;
  top: 0;
  z-index: 15;
  background: var(--v-theme-surface);
}
.sticky-left {
  position: sticky;
  left: 0;
  background: var(--v-theme-surface);
}
.name-col {
  min-width: 180px;
  max-width: 240px;
  z-index: 12;
}
.date-col {
  min-width: 90px;
}
@media (max-width: 960px) {
  .name-col {
    min-width: 160px;
    max-width: 200px;
  }
  .date-col {
    min-width: 80px;
  }
}
.row-strip:nth-child(odd) > td:not(.sticky-left) {
  background: rgba(0, 0, 0, 0.02);
}
.cell {
  vertical-align: middle;
}

/* ===== Mobile cards ===== */
.dates-ribbon {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(96px, 1fr);
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x proximity;
  padding-bottom: 2px;
}
.date-cell {
  scroll-snap-align: start;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 8px 6px;
  text-align: center;
  background: var(--v-theme-surface);
}
.date-label {
  margin-bottom: 6px;
}

/* --- Boutons compacts “soft” --- */
.status-inline {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 9999px;
  padding: 0;
  transform: translateZ(0);
}
.icon-btn .v-icon {
  font-size: 18px;
  line-height: 36px;
}

/* fonds doux + couleurs d’icône */
.status-present {
  background: rgba(76, 175, 80, 0.12);
}
.status-present .v-icon {
  color: #2e7d32;
}

.status-late {
  background: rgba(255, 152, 0, 0.14);
}
.status-late .v-icon {
  color: #ef6c00;
}

.status-absent {
  background: rgba(244, 67, 54, 0.14);
}
.status-absent .v-icon {
  color: #c62828;
}

/* Ajuste un peu les cartes date pour laisser respirer la ligne d’icônes */
@media (max-width: 600px) {
  .icon-btn {
    width: 34px;
    height: 34px;
    min-width: 34px;
  }
}
</style>
