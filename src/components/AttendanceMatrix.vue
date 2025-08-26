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
      <!-- Erreur globale -->
      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

      <!-- Légende -->
      <div class="mb-3 d-flex align-center flex-wrap gap-4 text-body-2">
        <div class="d-flex align-center ga-1">
          <v-icon color="green">mdi-check-circle</v-icon> Présent
        </div>
        <div class="d-flex align-center ga-1">
          <v-icon color="blue">mdi-file-check-outline</v-icon> Excusé(e)
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
                  <!-- Si excusé et commentaire, icône note avec tooltip -->
                  <v-tooltip
                    v-if="getStatus(st.id, s.id) === 'excused' && getComment(st.id, s.id)"
                    :text="getComment(st.id, s.id)"
                  >
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        size="x-small"
                        icon
                        variant="text"
                        class="mr-1"
                        title="Commentaire"
                      >
                        <v-icon>mdi-note-text-outline</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>

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
                      class="icon-btn status-excused"
                      variant="text"
                      @click="openExcuseDialog(st.id, s.id)"
                      title="Excusé(e)"
                      aria-label="Excusé(e)"
                    >
                      <v-icon>mdi-file-check-outline</v-icon>
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

              <td v-for="s in sessions" :key="`${s.id}-${st.id}`" class="text-center cell">
                <!-- État choisi -->
                <template v-if="getStatus(st.id, s.id)">
                  <v-tooltip
                    v-if="getStatus(st.id, s.id) === 'excused' && getComment(st.id, s.id)"
                    :text="getComment(st.id, s.id)"
                  >
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        size="x-small"
                        icon
                        variant="text"
                        class="mr-1"
                        title="Commentaire"
                      >
                        <v-icon>mdi-note-text-outline</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>

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

                <!-- Choix -->
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
                      class="icon-btn status-excused"
                      variant="text"
                      @click="openExcuseDialog(st.id, s.id)"
                      title="Excusé(e)"
                    >
                      <v-icon>mdi-file-check-outline</v-icon>
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

  <!-- Dialog commentaire Excusé(e) -->
  <v-dialog v-model="excuseDialog.show" max-width="520">
    <v-card>
      <v-card-title class="text-h6">Motif d'absence (excusé·e)</v-card-title>
      <v-card-text>
        <v-textarea
          v-model="excuseDialog.text"
          label="Commentaire / Justificatif"
          auto-grow
          rows="3"
          counter="300"
          :rules="[(v) => !!(v && v.trim()) || 'Commentaire requis']"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="closeExcuseDialog">Annuler</v-btn>
        <v-btn color="primary" @click="confirmExcuse">Enregistrer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Snackbar -->
  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="1600">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import axios from 'axios'

type Student = { id: number; firstname: string; lastname: string; phone?: string | null }
type Session = { id: number; date: string } // yyyy-mm-dd
type AttendanceRow = {
  student_id: number
  session_id: number
  status: 'present' | 'absent' | 'excused'
  comment?: string | null
}

const props = defineProps<{
  classId: number | string
}>()

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const { smAndDown } = useDisplay()

/* ─────────────── State ─────────────── */
const students = ref<Student[]>([])
const sessions = ref<Session[]>([])
/** Map: studentId -> sessionId -> {status, comment} */
const attendanceMap = reactive<
  Record<
    number,
    Record<number, { status: 'present' | 'absent' | 'excused' | null; comment: string | null }>
  >
>({})

const loading = ref(true)
const error = ref<string | null>(null)
const snackbar = ref<{ show: boolean; text: string; color: string }>({
  show: false,
  text: '',
  color: 'success',
})

/* Dialog infos élève */
const studentDialog = ref(false)
const selectedStudent = ref<Student | null>(null)
function openStudentInfo(st: Student) {
  selectedStudent.value = st
  studentDialog.value = true
}

/* Dialog Excusé(e) (commentaire obligatoire) */
const excuseDialog = ref<{
  show: boolean
  studentId: number | null
  sessionId: number | null
  text: string
}>({ show: false, studentId: null, sessionId: null, text: '' })
function openExcuseDialog(studentId: number, sessionId: number) {
  ensureKey(studentId, sessionId)
  excuseDialog.value = {
    show: true,
    studentId,
    sessionId,
    text: attendanceMap[studentId][sessionId].comment ?? '',
  }
}
function closeExcuseDialog() {
  excuseDialog.value = { show: false, studentId: null, sessionId: null, text: '' }
}
async function confirmExcuse() {
  const text = excuseDialog.value.text?.trim()
  if (!text) return
  const stId = excuseDialog.value.studentId!
  const seId = excuseDialog.value.sessionId!
  await onSetStatus(stId, seId, 'excused', text)
  closeExcuseDialog()
}

/* ─────────────── Utils ─────────────── */
function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function formatDate(d?: string) {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return `${dd}-${m}-${y}`
}

function ensureKey(studentId: number, sessionId: number) {
  if (!attendanceMap[studentId]) attendanceMap[studentId] = {}
  if (!attendanceMap[studentId][sessionId]) {
    attendanceMap[studentId][sessionId] = { status: null, comment: null }
  }
}
function getStatus(studentId: number, sessionId: number) {
  ensureKey(studentId, sessionId)
  return attendanceMap[studentId][sessionId].status
}
function getComment(studentId: number, sessionId: number) {
  ensureKey(studentId, sessionId)
  return attendanceMap[studentId][sessionId].comment
}
function resetCell(studentId: number, sessionId: number) {
  ensureKey(studentId, sessionId)
  attendanceMap[studentId][sessionId] = { status: null, comment: null }
}
function toggleEdit(studentId: number, sessionId: number) {
  resetCell(studentId, sessionId)
}

function iconOf(status: 'present' | 'absent' | 'excused' | null) {
  return status === 'present'
    ? 'mdi-check-circle'
    : status === 'excused'
      ? 'mdi-file-check-outline'
      : status === 'absent'
        ? 'mdi-close-circle'
        : 'mdi-help-circle-outline'
}
function labelOf(status: 'present' | 'absent' | 'excused' | null) {
  return status === 'present'
    ? 'Présent'
    : status === 'excused'
      ? 'Excusé(e)'
      : status === 'absent'
        ? 'Absent'
        : ''
}
function statusClass(status: 'present' | 'absent' | 'excused' | null) {
  return status === 'present'
    ? 'status-present'
    : status === 'excused'
      ? 'status-excused'
      : status === 'absent'
        ? 'status-absent'
        : ''
}

/* ─────────────── Fetch ─────────────── */
async function fetchAll() {
  loading.value = true
  error.value = null
  try {
    const auth = authHeaders()
    const classIdNum = Number(props.classId)

    // 1) élèves
    const stRes = await axios.get<Student[]>(`${API}/api/students/${classIdNum}`, { headers: auth })
    students.value = Array.isArray(stRes.data) ? stRes.data : []

    // 2) sessions
    const seRes = await axios.get<{ id: number; date: string }[]>(`${API}/sessions/${classIdNum}`, {
      headers: auth,
    })
    sessions.value = (Array.isArray(seRes.data) ? seRes.data : []).filter(
      (s) => s && typeof s.id === 'number' && s.date,
    )

    // 3) présences
    const atRes = await axios.get<AttendanceRow[]>(`${API}/attendance/${classIdNum}`, {
      headers: auth,
    })

    // reset map
    for (const sid in attendanceMap) delete attendanceMap[+sid]

    // hydrate
    for (const row of atRes.data || []) {
      ensureKey(row.student_id, row.session_id)
      attendanceMap[row.student_id][row.session_id] = {
        status: row.status, // 'present' | 'absent' | 'excused'
        comment: row.comment ?? null,
      }
    }

    // pre-create empty cells
    for (const st of students.value) {
      for (const s of sessions.value) ensureKey(st.id, s.id)
    }
  } catch (e) {
    console.error('[AttendanceMatrix] fetchAll error', e)
    error.value = 'Impossible de charger élèves / sessions.'
  } finally {
    loading.value = false
  }
}

/* ─────────────── Save ─────────────── */
async function onSetStatus(
  studentId: number,
  sessionId: number,
  status: 'present' | 'absent' | 'excused',
  comment: string | null = null,
) {
  try {
    ensureKey(studentId, sessionId)
    if (status === 'excused' && (!comment || !comment.trim())) {
      // si appelé à la main sans commentaire → ouvre le dialog
      return openExcuseDialog(studentId, sessionId)
    }

    // MAJ optimiste
    attendanceMap[studentId][sessionId] = {
      status,
      comment: status === 'excused' ? (comment?.trim() ?? '') : null,
    }

    await axios.post(
      `${API}/attendance`,
      {
        student_id: studentId,
        session_id: sessionId,
        status,
        comment: status === 'excused' ? (comment?.trim() ?? '') : null,
      },
      { headers: authHeaders() },
    )

    snackbar.value = { show: true, text: '✅ Enregistré', color: 'success' }
  } catch (e) {
    console.error('Erreur sauvegarde présence :', e)
    snackbar.value = { show: true, text: '❌ Erreur enregistrement', color: 'error' }
  }
}

/* ───────── expose API au parent ───────── */
function reload() {
  return fetchAll()
}
defineExpose({ reload })

/* ───────── lifecycle ───────── */
onMounted(fetchAll)
watch(() => props.classId, fetchAll)
</script>

<style scoped>
.table-wrapper {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid rgb(var(--v-theme-surface-variant));
  background: rgb(var(--v-theme-surface));
}
.attendance-table thead th.sticky-th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: rgb(var(--v-theme-surface));
}
.sticky-col {
  position: sticky;
  left: 0;
  z-index: 3;
  background: rgb(var(--v-theme-surface));
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.06);
}
.left-col {
  min-width: 220px;
}
.cell-status {
  min-width: 160px;
  text-align: center;
}
.status-select {
  width: 140px;
}
.card-session {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
