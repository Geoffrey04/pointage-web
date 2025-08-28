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
      <div class="legend mb-3 d-flex align-center flex-wrap gap-6 text-body-2">
        <div class="legend-item">
          <v-btn
            size="small"
            variant="flat"
            color="green"
            class="legend-chip"
            prepend-icon="mdi-check-circle"
          >
            Présent
          </v-btn>
        </div>
        <div class="legend-item">
          <v-btn
            size="small"
            variant="flat"
            color="orange"
            class="legend-chip"
            prepend-icon="mdi-file-check-outline"
          >
            Excusé(e)
          </v-btn>
        </div>
        <div class="legend-item">
          <v-btn
            size="small"
            variant="flat"
            color="red"
            class="legend-chip"
            prepend-icon="mdi-close-circle"
          >
            Absent
          </v-btn>
        </div>
      </div>

      <!-- ====== MOBILE : Carrousel par élève ====== -->
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

            <!-- Carrousel des dates (1 date visible à la fois) -->
            <v-slide-group class="mx-n2" center-active show-arrows>
              <v-slide-group-item v-for="s in sessions" :key="s.id">
                <v-card
                  class="ma-2 px-4 py-3 d-flex flex-column align-center justify-center date-slide"
                  width="220"
                >
                  <div class="text-caption text-medium-emphasis mb-2">
                    {{ formatDate(s.date) }}
                  </div>

                  <!-- Si un statut est déjà choisi -->
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
                          class="mb-1"
                          :color="colorOf(getStatus(st.id, s.id))"
                          title="Commentaire"
                        >
                          <v-icon>mdi-note-text-outline</v-icon>
                        </v-btn>
                      </template>
                    </v-tooltip>

                    <v-btn
                      size="large"
                      :color="colorOf(getStatus(st.id, s.id))"
                      variant="flat"
                      class="status-pill mb-1"
                      @click="toggleEdit(st.id, s.id)"
                    >
                      <v-icon :icon="iconOf(getStatus(st.id, s.id))" start />
                      {{ shortLabel(getStatus(st.id, s.id)) }}
                    </v-btn>

                    <v-btn
                      size="x-small"
                      variant="text"
                      @click="resetCell(st.id, s.id)"
                      title="Changer"
                    >
                      ↺
                    </v-btn>
                  </template>

                  <!-- Choix des statuts — Solution A (3 ronds + labels) -->
                  <template v-else>
                    <v-row class="d-flex justify-center align-center mt-2" dense>
                      <!-- Présent -->
                      <v-col cols="4" class="text-center">
                        <v-btn
                          icon
                          size="large"
                          color="green"
                          class="rounded-circle"
                          @click="onSetStatus(st.id, s.id, 'present')"
                          aria-label="Présent"
                        >
                          <v-icon>mdi-check</v-icon>
                        </v-btn>
                        <div class="text-caption mt-1">Présent</div>
                      </v-col>

                      <!-- Excusé(e) -->
                      <v-col cols="4" class="text-center">
                        <v-btn
                          icon
                          size="large"
                          color="orange"
                          class="rounded-circle"
                          @click="openExcuseDialog(st.id, s.id)"
                          aria-label="Excusé(e)"
                        >
                          <v-icon>mdi-file-check-outline</v-icon>
                        </v-btn>
                        <div class="text-caption mt-1">Excusé(e)</div>
                      </v-col>

                      <!-- Absent -->
                      <v-col cols="4" class="text-center">
                        <v-btn
                          icon
                          size="large"
                          color="red"
                          class="rounded-circle"
                          @click="onSetStatus(st.id, s.id, 'absent')"
                          aria-label="Absent"
                        >
                          <v-icon>mdi-close</v-icon>
                        </v-btn>
                        <div class="text-caption mt-1">Absent</div>
                      </v-col>
                    </v-row>
                  </template>
                </v-card>
              </v-slide-group-item>
            </v-slide-group>
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
                        :color="colorOf(getStatus(st.id, s.id))"
                        title="Commentaire"
                      >
                        <v-icon>mdi-note-text-outline</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>

                  <v-btn
                    size="small"
                    :color="colorOf(getStatus(st.id, s.id))"
                    variant="flat"
                    class="status-pill"
                    @click="toggleEdit(st.id, s.id)"
                  >
                    <v-icon :icon="iconOf(getStatus(st.id, s.id))" start />
                    {{ shortLabel(getStatus(st.id, s.id)) }}
                  </v-btn>

                  <v-btn
                    size="x-small"
                    variant="text"
                    class="ml-1"
                    @click="resetCell(st.id, s.id)"
                    title="Changer"
                  >
                    ↺
                  </v-btn>
                </template>

                <template v-else>
                  <!-- Choix des statuts — Solution A compact (3 ronds + labels) -->
                  <div class="status-row">
                    <div class="status-item">
                      <v-btn
                        class="action-btn"
                        color="green"
                        variant="flat"
                        @click="onSetStatus(st.id, s.id, 'present')"
                        aria-label="Présent"
                      >
                        <v-icon>mdi-check</v-icon>
                      </v-btn>
                      <div class="status-label">Présent</div>
                    </div>

                    <div class="status-item">
                      <v-btn
                        class="action-btn"
                        color="orange"
                        variant="flat"
                        @click="openExcuseDialog(st.id, s.id)"
                        aria-label="Excusé(e)"
                      >
                        <v-icon>mdi-file-check-outline</v-icon>
                      </v-btn>
                      <div class="status-label">Excusé(e)</div>
                    </div>

                    <div class="status-item">
                      <v-btn
                        class="action-btn"
                        color="red"
                        variant="flat"
                        @click="onSetStatus(st.id, s.id, 'absent')"
                        aria-label="Absent"
                      >
                        <v-icon>mdi-close</v-icon>
                      </v-btn>
                      <div class="status-label">Absent</div>
                    </div>
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
        <v-btn
          color="primary"
          :disabled="!excuseDialog.text || !excuseDialog.text.trim()"
          @click="confirmExcuse"
        >
          Enregistrer
        </v-btn>
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

function colorOf(status: 'present' | 'absent' | 'excused' | null) {
  return status === 'present'
    ? 'green'
    : status === 'excused'
      ? 'orange' // ← orange demandé
      : status === 'absent'
        ? 'red'
        : undefined
}

function shortLabel(status: 'present' | 'absent' | 'excused' | null) {
  return status === 'present'
    ? 'Présent'
    : status === 'excused'
      ? 'Excusé(e)'
      : status === 'absent'
        ? 'Absent'
        : ''
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
/* largeur confortable + anti-chevauchement des flèches */
.date-slide {
  width: 260px; /* ↑ plus large qu'avant (200/220) */
  padding-inline: 18px; /* espace pour les flèches du slide-group */
  overflow: visible; /* évite le “bouton coupé” */
}

/* le conteneur du slide-group ne coupe pas non plus */
.v-slide-group,
.v-slide-group__content {
  overflow: visible;
}

/* rangée des 3 actions, centrée et aérée */
.status-row {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 14px; /* espace entre les boutons */
  margin-top: 8px;
}

/* un item = un bouton rond + un label dessous */
.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 72px; /* largeur fixe pour éviter le wrap */
}

/* gros bouton tactile */
.action-btn {
  width: 20px;
  height: 20px;
  border-radius: 999px;
}

/* labels toujours sur une ligne (pas de coupure) */
.status-label {
  margin-top: 6px;
  font-size: 12px;
  white-space: nowrap; /* empêche “Excusé(e)” de se couper */
}

.date-slide {
  width: 200px;
  overflow: visible;
} /* largeur confortable */

.status-inline {
  display: flex;
  gap: 12px;
  align-items: center;
}
.icon-btn {
  border-radius: 999px;
  min-width: 44px;
  height: 44px;
} /* tap-friendly */
.status-pill {
  border-radius: 999px;
  text-transform: none;
  font-weight: 600;
  padding-inline: 12px;
}

.legend {
  gap: 1rem;
}
.legend-chip {
  border-radius: 999px;
  padding-inline: 12px;
  text-transform: none;
  font-weight: 600;
}

.status-inline {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-btn {
  border-radius: 999px;
  min-width: 40px;
  height: 36px;
}

.status-pill {
  border-radius: 999px;
  text-transform: none;
  font-weight: 600;
  padding-inline: 12px;
}

/* Ruban mobile: scroll horizontal fluide */
.dates-ribbon {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(140px, 1fr);
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scroll-snap-type: x mandatory;
}
.dates-ribbon .date-cell {
  scroll-snap-align: start;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 8px;
}
.date-label {
  margin-bottom: 6px;
}

/* Table desktop améliorée */
.table-scroll {
  overflow: auto;
}
.attendance-table {
  width: max(100%, 720px);
  border-collapse: separate;
  border-spacing: 0;
}
.top-sticky {
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgb(var(--v-theme-surface));
}
.sticky-left {
  position: sticky;
  left: 0;
  z-index: 6;
}
.name-col {
  min-width: 220px;
  max-width: 280px;
}
.date-col {
  min-width: 140px;
}
.cell {
  padding: 8px;
}

/* Row striping léger */
.row-strip:nth-child(odd) td {
  background: rgba(0, 0, 0, 0.015);
}

@media (max-width: 600px) {
  .name-col {
    min-width: 160px;
  }
  .date-col {
    min-width: 120px;
  }
}

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
