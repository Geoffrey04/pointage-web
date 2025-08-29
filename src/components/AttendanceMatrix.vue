<template>
  <v-card class="rounded-xl elevation-2">
    <v-card-title class="text-h6 d-flex justify-space-between align-center">
      <span>Présences</span>
      <div class="text-caption text-medium-emphasis">
        {{ students.length }} élèves • {{ sortedSessions.length }} cours
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
          <v-card-text class="pt-3 pb-1 pa-0">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="font-weight-medium pa-2">{{ st.lastname }} {{ st.firstname }}</div>
              <v-btn size="x-small" icon variant="text" @click="openStudentInfo(st)">
                <v-icon>mdi-information-outline</v-icon>
              </v-btn>
            </div>

            <!-- Carrousel des dates (1 date visible à la fois) -->
            <v-slide-group
              v-model="activeSlide[st.id]"
              class="attendance-slides"
              center-active
              show-arrows="always"
              mandatory
            >
              <v-slide-group-item
                v-for="s in sortedSessions"
                :key="s.id"
                :value="s.id"
                class="slide-item"
              >
                <div class="slide-center">
                  <v-card
                    class="date-slide px-4 py-3 d-flex flex-column align-center justify-center"
                    width="220"
                  >
                    <div class="text-caption text-medium-emphasis mb-2">
                      {{ formatDate(s.date) }}
                      <v-chip
                        v-if="!isSessionFullyValidated(s.id)"
                        size="x-small"
                        class="ml-1"
                        variant="tonal"
                      >
                        À valider
                      </v-chip>
                    </div>

                    <!-- ====== tout ton contenu inchangé (statuts, boutons, etc.) ====== -->
                    <!-- Icône commentaire : tooltip sur desktop / dialog au tap sur mobile -->
                    <!-- ====== SI UN STATUT EST DÉJÀ CHOISI ====== -->
                    <template v-if="hasStatus(st.id, s.id)">
                      <!-- Icône commentaire, visible uniquement si Excusé + commentaire -->
                      <template
                        v-if="getStatus(st.id, s.id) === 'excused' && getComment(st.id, s.id)"
                      >
                        <!-- Desktop : tooltip -->
                        <v-tooltip v-if="!smAndDown" :text="getComment(st.id, s.id)" location="top">
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon
                              variant="text"
                              class="mb-1"
                              :color="colorOf(getStatus(st.id, s.id))"
                              aria-label="Voir le motif"
                            >
                              <v-icon>mdi-note-text-outline</v-icon>
                            </v-btn>
                          </template>
                        </v-tooltip>
                        <!-- Mobile : tap = dialog -->
                        <v-btn
                          v-else
                          size="x-small"
                          icon
                          variant="text"
                          class="mb-1"
                          :color="colorOf(getStatus(st.id, s.id))"
                          aria-label="Voir le motif"
                          @click="openCommentViewer(getComment(st.id, s.id)!)"
                        >
                          <v-icon>mdi-note-text-outline</v-icon>
                        </v-btn>
                      </template>

                      <!-- Pilule du statut -->
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

                      <!-- Remettre à “À valider” -->
                      <v-btn
                        size="x-small"
                        variant="text"
                        @click="resetCell(st.id, s.id)"
                        title="Changer"
                        >↺</v-btn
                      >
                    </template>

                    <!-- ====== SINON : CHOIX DES 3 STATUTS (À VALIDER) ====== -->
                    <template v-else>
                      <v-row class="d-flex justify-center align-center mt-2" dense>
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
                </div>
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
              <th v-for="s in sortedSessions" :key="s.id" class="text-center date-col top-sticky">
                {{ formatDate(s.date) }}
                <v-chip
                  v-if="!isSessionFullyValidated(s.id)"
                  size="x-small"
                  class="ml-1"
                  variant="tonal"
                >
                  À valider
                </v-chip>
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

              <td v-for="s in sortedSessions" :key="`${s.id}-${st.id}`" class="text-center cell">
                <!-- État choisi -->
                <template v-if="hasStatus(st.id, s.id)">
                  <!-- Icône commentaire si Excusé + commentaire -->
                  <template v-if="getStatus(st.id, s.id) === 'excused' && getComment(st.id, s.id)">
                    <v-tooltip v-if="!smAndDown" :text="getComment(st.id, s.id)" location="top">
                      <template #activator="{ props }">
                        <v-btn
                          v-bind="props"
                          size="x-small"
                          icon
                          variant="text"
                          class="mr-1"
                          :color="colorOf(getStatus(st.id, s.id))"
                          aria-label="Voir le motif"
                        >
                          <v-icon>mdi-note-text-outline</v-icon>
                        </v-btn>
                      </template>
                    </v-tooltip>
                    <v-btn
                      v-else
                      size="x-small"
                      icon
                      variant="text"
                      class="mr-1"
                      :color="colorOf(getStatus(st.id, s.id))"
                      aria-label="Voir le motif"
                      @click="openCommentViewer(getComment(st.id, s.id)!)"
                    >
                      <v-icon>mdi-note-text-outline</v-icon>
                    </v-btn>
                  </template>

                  <!-- Pilule du statut -->
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
                    >↺</v-btn
                  >
                </template>

                <!-- Sinon : 3 boutons -->
                <template v-else>
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

                <!-- ====== SINON : CHOIX DES 3 STATUTS (À VALIDER) ====== -->
                <template v-else>
                  <v-row class="d-flex justify-center align-center mt-2" dense>
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
              <td :colspan="1 + sortedSessions.length">
                <v-alert type="info" variant="tonal">Aucun élève.</v-alert>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td :colspan="1 + sortedSessions.length"><v-skeleton-loader type="table-row" /></td>
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
        <v-btn color="error" variant="tonal" @click="askDeleteStudent(selectedStudent!)">
          Supprimer
        </v-btn>
        <v-btn variant="text" @click="studentDialog = false">Fermer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!--Dialog suppression d'un eleve -->

  <v-dialog v-model="deleteDialog.show" max-width="460">
    <v-card>
      <v-card-title class="text-h6">Supprimer l'élève ?</v-card-title>
      <v-card-text>
        Cette action supprimera aussi ses présences associées.
        <div class="mt-2 text-medium-emphasis">
          {{ deleteDialog.student?.lastname }} {{ deleteDialog.student?.firstname }}
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteDialog.show = false" :disabled="deleteDialog.loading">
          Annuler
        </v-btn>
        <v-btn color="error" :loading="deleteDialog.loading" @click="doDeleteStudent">
          Supprimer
        </v-btn>
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

  <!-- Dialog lecture du motif (mobile & desktop click) -->
  <v-dialog v-model="commentViewer.show" max-width="420">
    <v-card>
      <v-card-title class="text-h6">Motif d'absence</v-card-title>
      <v-card-text class="text-body-2" style="white-space: pre-line">
        {{ commentViewer.text }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="commentViewer.show = false">Fermer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Snackbar -->
  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="1600">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
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

const props = defineProps<{ classId: number | string }>()
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

/**
 * Mobile : session active PAR élève (valeur = sessionId)
 */
const activeSlide = ref<Record<number, number>>({}) // st.id -> sessionId actif

/* ─────────────── Dialogs ─────────────── */
const studentDialog = ref(false)
const selectedStudent = ref<Student | null>(null)
function openStudentInfo(st: Student) {
  selectedStudent.value = st
  studentDialog.value = true
}
const commentViewer = ref<{ show: boolean; text: string }>({ show: false, text: '' })
function openCommentViewer(text: string) {
  commentViewer.value = { show: true, text: text ?? '' }
}

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
  await onSetStatus(stId, seId, 'excused', text) // avance par élève (mobile) dans onSetStatus
  closeExcuseDialog()
}

const deleteDialog = ref<{ show: boolean; loading: boolean; student: Student | null }>({
  show: false,
  loading: false,
  student: null,
})

function askDeleteStudent(st: Student) {
  deleteDialog.value = { show: true, loading: false, student: st }
}

async function doDeleteStudent() {
  const st = deleteDialog.value.student
  if (!st) return
  deleteDialog.value.loading = true
  try {
    await axios.delete(`${API}/api/students/${st.id}`, { headers: authHeaders() })

    // Retirer l'élève du state (UI instantanée)
    students.value = students.value.filter((x) => x.id !== st.id)
    // Nettoyer ses cellules et sa slide
    delete attendanceMap[st.id]
    delete activeSlide.value[st.id]

    // Repositionner les slides si besoin
    restoreActiveSessionForAllStudents()

    deleteDialog.value = { show: false, loading: false, student: null }
    studentDialog.value = false
    snackbar.value = { show: true, text: '🗑️ Élève supprimé', color: 'success' }
  } catch (e) {
    console.error('Suppression élève échouée', e)
    deleteDialog.value.loading = false
    snackbar.value = { show: true, text: '❌ Échec suppression', color: 'error' }
  }
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
    attendanceMap[studentId][sessionId] = { status: null, comment: null } // ← non validé
  }
}
function getStatus(studentId: number, sessionId: number) {
  return attendanceMap[studentId]?.[sessionId]?.status ?? null
}
function getComment(studentId: number, sessionId: number) {
  return attendanceMap[studentId]?.[sessionId]?.comment ?? null
}
function resetCell(studentId: number, sessionId: number) {
  ensureKey(studentId, sessionId)
  attendanceMap[studentId][sessionId] = { status: null, comment: null }
}
function toggleEdit(studentId: number, sessionId: number) {
  resetCell(studentId, sessionId)
}
function hasStatus(studentId: number, sessionId: number) {
  const s = getStatus(studentId, sessionId)
  return s === 'present' || s === 'absent' || s === 'excused'
}

/* Couleurs / labels / icônes */
function colorOf(status: 'present' | 'absent' | 'excused' | null) {
  return status === 'present'
    ? 'green'
    : status === 'excused'
      ? 'orange'
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

/* ─────────────── Validation & Tri ─────────────── */

/** Une session est “pleinement validée” si TOUS les élèves ont un statut non null */
function isSessionFullyValidated(sessionId: number) {
  if (!students.value.length) return false
  return students.value.every((st) => !!getStatus(st.id, sessionId))
}

/** Sessions triées :
 * - Desktop : strictement chronologique (stable)
 * - Mobile : non validées d’abord (optionnel) puis chronologique
 */
const sortedSessions = computed<Session[]>(() => {
  return [...sessions.value].sort((a, b) => a.date.localeCompare(b.date))
})

/* ─────────────── Avance & Restauration — PAR ÉLÈVE (mobile) ─────────────── */

/** Validé pour un élève donné ? (cellule) */
function isValidated(studentId: number, sessionId: number) {
  return !!getStatus(studentId, sessionId)
}

const progressKeyForStudent = (studentId: number) =>
  `attendance_progress_class_${String(props.classId)}_student_${studentId}`

/** 1ʳᵉ date non validée pour UN élève */
function firstUnvalidatedForStudent(studentId: number): number {
  for (const s of sortedSessions.value) {
    if (!isValidated(studentId, s.id)) return s.id
  }
  return sortedSessions.value[0]?.id ?? 0
}

/** Prochaine date non validée à partir d'une session pour UN élève */
function nextUnvalidatedFromForStudent(studentId: number, sessionId: number): number {
  if (!sortedSessions.value.length) return 0
  const startIdx = Math.max(
    0,
    sortedSessions.value.findIndex((s) => s.id === sessionId),
  )
  for (let i = startIdx + 1; i < sortedSessions.value.length; i++) {
    const s = sortedSessions.value[i]
    if (!isValidated(studentId, s.id)) return s.id
  }
  // wrap sur la première non validée (de CET élève)
  return firstUnvalidatedForStudent(studentId)
}

/** Fixe la session active pour UN élève + mémorise */
function setActiveSessionForStudent(studentId: number, sessionId: number) {
  activeSlide.value[studentId] = sessionId
  localStorage.setItem(progressKeyForStudent(studentId), String(sessionId))
}

/** Restaure la session active pour TOUS les élèves (individuellement) */
function restoreActiveSessionForAllStudents() {
  if (!sortedSessions.value.length || !students.value.length) return
  for (const st of students.value) {
    const computedId = firstUnvalidatedForStudent(st.id)
    const saved = Number(localStorage.getItem(progressKeyForStudent(st.id)))
    const savedExists = sortedSessions.value.some((s) => s.id === saved)
    const target = computedId || (savedExists ? saved : sortedSessions.value[0].id)
    setActiveSessionForStudent(st.id, target)
  }
}

/* ─────────────── Dédup sessions + init nouvel élève ─────────────── */

// Déduplique les sessions (au cas où l'API renverrait des doublons)
function dedupeSessions(list: { id: number; date: string }[]) {
  const seen = new Set<number>()
  return list.filter((s) => !seen.has(s.id) && seen.add(s.id))
}

// Quand un nouvel élève arrive dans la liste, on initialise ses cellules & sa slide
watch(
  students,
  (newList, oldList) => {
    const oldIds = new Set((oldList ?? []).map((s) => s.id))
    for (const st of newList) {
      if (!oldIds.has(st.id)) {
        for (const s of sessions.value) ensureKey(st.id, s.id)
        const target = firstUnvalidatedForStudent(st.id)
        setActiveSessionForStudent(st.id, target)
      }
    }
  },
  { deep: false },
)

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
    sessions.value = dedupeSessions(
      (Array.isArray(seRes.data) ? seRes.data : []).filter(
        (s) => s && typeof s.id === 'number' && s.date,
      ),
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

    // pre-create empty cells (status = null = non validé)
    for (const st of students.value) {
      for (const s of sessions.value) ensureKey(st.id, s.id)
    }

    // positionner la session active — PAR ÉLÈVE
    restoreActiveSessionForAllStudents()
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
    // on crée la cellule si besoin, mais hors rendu
    ensureKey(studentId, sessionId)

    // Si excusé sans motif -> ouvrir le dialog
    if (status === 'excused' && (!comment || !comment.trim())) {
      return openExcuseDialog(studentId, sessionId)
    }

    // snapshot pour rollback
    const prevStatus = attendanceMap[studentId][sessionId].status
    const prevComment = attendanceMap[studentId][sessionId].comment

    // ✅ MAJ optimiste **champ par champ** (réactivité fiable)
    if (status === 'present') {
      attendanceMap[studentId][sessionId].status = 'present'
      attendanceMap[studentId][sessionId].comment = null
    } else if (status === 'absent') {
      attendanceMap[studentId][sessionId].status = 'absent'
      attendanceMap[studentId][sessionId].comment = null
    } else {
      // 'excused'
      attendanceMap[studentId][sessionId].status = 'excused'
      attendanceMap[studentId][sessionId].comment = (comment ?? '').trim()
    }

    console.log('after set', studentId, sessionId, attendanceMap[studentId][sessionId])

    // API
    await axios.post(
      `${API}/attendance`,
      {
        student_id: studentId,
        session_id: sessionId,
        status,
        comment: status === 'excused' ? (comment ?? '').trim() : null,
      },
      { headers: authHeaders() },
    )

    snackbar.value = { show: true, text: '✅ Enregistré', color: 'success' }

    // auto-avance par élève (mobile uniquement)
    if (smAndDown.value) {
      const next = nextUnvalidatedFromForStudent(studentId, sessionId)
      setActiveSessionForStudent(studentId, next)
    }
  } catch (e) {
    console.error('Erreur sauvegarde présence :', e)
    // rollback
    attendanceMap[studentId][sessionId].status = prevStatus ?? null
    attendanceMap[studentId][sessionId].comment = prevComment ?? null
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

// Si la classe change → reload
watch(() => props.classId, fetchAll)

// Si les listes changent (après fetch/ajout) → restaurer par élève
watch([students, sessions], () => {
  if (students.value.length && sessions.value.length) restoreActiveSessionForAllStudents()
})
</script>

<style scoped>
/* =========================
    MOBILE – carrousel centré
    ========================= */
.attendance-slides {
  width: 100%;
  padding-inline: 8px;
}
.slide-item {
  flex: 0 0 100% !important;
  display: flex !important;
}
.slide-center {
  display: flex;
  justify-content: center;
  width: 100%;
}
.date-slide {
  width: 240px;
  max-width: 90vw;
  margin: 0 !important;
  overflow: visible;
}
.attendance-slides :deep(.v-slide-group__content) {
  touch-action: pan-x !important;
  -ms-touch-action: pan-x;
  user-select: none;
  cursor: grab;
}
.attendance-slides :deep(.v-slide-group__content:active) {
  cursor: grabbing;
}
.attendance-slides :deep(.v-slide-group__prev),
.attendance-slides :deep(.v-slide-group__next) {
  z-index: 3;
}

/* =========================
    BOUTONS / ÉTIQUETTES
    ========================= */
.status-row {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 14px;
  margin-top: 8px;
}
.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 72px;
}
.status-label {
  margin-top: 6px;
  font-size: 12px;
  white-space: nowrap;
}
.action-btn {
  min-width: 36px;
  height: 36px;
  border-radius: 999px;
}
.status-pill {
  border-radius: 999px;
  text-transform: none;
  font-weight: 600;
  padding-inline: 12px;
}

/* Légende */
.legend {
  gap: 1rem;
}
.legend-chip {
  border-radius: 999px;
  padding-inline: 12px;
  text-transform: none;
  font-weight: 600;
}

/* =========================
    TABLE DESKTOP
    ========================= */
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
