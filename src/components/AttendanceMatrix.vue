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

      <!-- ====== MOBILE : Carrousel par élève (cache les séances “hors jour” de l’élève) ====== -->
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

            <v-slide-group
              v-model="activeSlide[st.id]"
              class="attendance-slides"
              center-active
              show-arrows="always"
              mandatory
            >
              <v-slide-group-item
                v-for="s in mobileSessionsFor(st)"
                :key="s.id"
                :value="s.id"
                class="slide-item"
              >
                <div class="slide-center">
                  <v-card
                    class="date-slide px-8 py-3 d-flex flex-column align-center justify-center"
                    width="220"
                  >
                    <div class="text-caption text-medium-emphasis mb-2 d-flex align-center">
                      {{ formatDate(s.date) }}

                      <!-- Chip statut de séance -->
                      <v-chip
                        v-if="sessionStatus(s.id) !== 'scheduled'"
                        size="x-small"
                        :color="chipColor(sessionStatus(s.id))"
                        variant="tonal"
                        class="ml-1"
                        :prepend-icon="chipIcon(sessionStatus(s.id))"
                      >
                        {{ chipLabel(sessionStatus(s.id)) }}
                      </v-chip>

                      <!-- Note éventuelle -->
                      <v-btn
                        v-if="sessionNote(s.id)"
                        icon
                        size="x-small"
                        variant="text"
                        class="ml-1"
                        @click="openCommentViewer(sessionNote(s.id)!)"
                        :title="sessionNote(s.id)!"
                      >
                        <v-icon>mdi-note-text-outline</v-icon>
                      </v-btn>

                      <!-- Éditer statut séance -->
                      <v-btn
                        icon
                        size="x-small"
                        variant="text"
                        class="ml-1"
                        @click="openSessionDialog(s)"
                        :title="`Éditer le statut du ${formatDate(s.date)}`"
                      >
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                    </div>

                    <!-- Contenu cellule -->
                    <template v-if="!isSessionPointable(s.id)">
                      <div class="text-caption text-medium-emphasis mt-1 text-center">
                        Pointage indisponible ({{ chipLabel(sessionStatus(s.id)) }})
                      </div>
                    </template>

                    <template v-else>
                      <!-- Statut déjà saisi -->
                      <template v-if="hasStatus(st.id, s.id)">
                        <template
                          v-if="getStatus(st.id, s.id) === 'excused' && getComment(st.id, s.id)"
                        >
                          <v-tooltip
                            v-if="!smAndDown"
                            :text="getComment(st.id, s.id)"
                            location="top"
                          >
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

                      <!-- À valider : on cache simplement le hors-jour sur mobile -->
                      <template v-else-if="!isPointableForStudent(st.id, s.id)">
                        <div v-if="false" class="text-disabled text-caption mt-2">
                          — hors jour —
                        </div>
                      </template>

                      <!-- Choix des 3 statuts -->
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
                            <div class="text-caption mt-1">Excusé</div>
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
                    </template>
                  </v-card>
                </div>
              </v-slide-group-item>
            </v-slide-group>
          </v-card-text>
        </v-card>
      </div>

      <!-- ====== DESKTOP : Tableau ====== -->
      <div v-else class="table-scroll">
        <v-table fixed-header density="comfortable" class="attendance-table">
          <thead>
            <tr>
              <th class="sticky-left name-col z-20 bg-surface top-sticky">Élève</th>
              <th v-for="s in sortedSessions" :key="s.id" class="text-center date-col top-sticky">
                <div class="d-flex align-center justify-center ga-1">
                  <span class="text-caption text-medium-emphasis">{{ formatDate(s.date) }}</span>

                  <v-chip
                    v-if="sessionStatus(s.id) !== 'scheduled'"
                    size="x-small"
                    :color="chipColor(sessionStatus(s.id))"
                    variant="tonal"
                    :prepend-icon="chipIcon(sessionStatus(s.id))"
                  >
                    {{ chipLabel(sessionStatus(s.id)) }}
                  </v-chip>

                  <v-btn
                    v-if="sessionNote(s.id)"
                    icon
                    size="x-small"
                    variant="text"
                    @click="openCommentViewer(sessionNote(s.id)!)"
                    :title="sessionNote(s.id)!"
                  >
                    <v-icon>mdi-note-text-outline</v-icon>
                  </v-btn>

                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="openSessionDialog(s)"
                    :title="`Éditer le statut du ${formatDate(s.date)}`"
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </div>
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
                <!-- Séance non pointable -->
                <template v-if="!isSessionPointable(s.id)">
                  <div class="text-caption text-medium-emphasis">
                    — {{ chipLabel(sessionStatus(s.id)) }} —
                  </div>
                </template>

                <!-- Statut saisi -->
                <template v-else-if="hasStatus(st.id, s.id)">
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

                <!-- À valider -->
                <template v-else-if="!isPointableForStudent(st.id, s.id)">
                  <span class="text-disabled">—</span>
                </template>
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

  <!-- Fiches & dialogs -->
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
        <v-btn color="error" variant="tonal" :disabled="!selectedStudent" @click="askDeleteStudent(selectedStudent!)"
          >Supprimer</v-btn
        >
        <v-btn variant="text" @click="studentDialog = false">Fermer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

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
        <v-btn variant="text" @click="deleteDialog.show = false" :disabled="deleteDialog.loading"
          >Annuler</v-btn
        >
        <v-btn color="error" :loading="deleteDialog.loading" @click="doDeleteStudent"
          >Supprimer</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

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

  <!-- Dialog édition statut de séance -->
  <v-dialog v-model="sessionDialog.show" max-width="520">
    <v-card>
      <v-card-title class="text-h6">Statut de la séance</v-card-title>
      <v-card-text>
        <div class="mb-2 text-caption text-medium-emphasis">{{ sessionDialog.dateLabel }}</div>

        <v-select
          v-model="sessionDialog.status"
          :items="sessionStatusOptions"
          item-title="label"
          item-value="value"
          label="Statut"
          density="comfortable"
          variant="outlined"
        />

        <v-textarea
          v-model="sessionDialog.note"
          class="mt-2"
          label="Note (optionnelle)"
          auto-grow
          rows="2"
          counter="300"
          variant="outlined"
        />

        <v-checkbox
          v-if="['cancelled', 'holiday', 'vacation'].includes(sessionDialog.status)"
          v-model="sessionDialog.force"
          class="mt-1"
          label="Supprimer les pointages existants pour cette séance"
          density="compact"
          hide-details
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="sessionDialog.show = false" :disabled="sessionDialog.saving"
          >Annuler</v-btn
        >
        <v-btn color="primary" :loading="sessionDialog.saving" @click="saveSessionStatus"
          >Enregistrer</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="1600">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useDisplay } from 'vuetify'
import axios,{ isAxiosError, AxiosError } from 'axios'

/* ===== Types ===== */
type Student = {
  id: number
  firstname: string
  lastname: string
  phone?: string | null
  weekday?: number | null
}
type SessionStatus = 'scheduled' | 'cancelled' | 'holiday' | 'vacation' | 'extra'
type Session = { id: number; date: string; status?: SessionStatus | null; note?: string | null }
type AttendanceRow = {
  student_id: number
  session_id: number
  status: 'present' | 'absent' | 'excused'
  comment?: string | null
}

/* ===== Consts / refs ===== */
const NON_POINTABLE = new Set<SessionStatus>(['cancelled', 'holiday', 'vacation'])

const props = defineProps<{ classId: number | string }>()
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const { smAndDown } = useDisplay()

const classWeekday = ref<number | null>(null) // jour par défaut de la classe (fallback)
const students = ref<Student[]>([])
const sessions = ref<Session[]>([])

/** Map réactive : studentId -> sessionId -> { status, comment } */
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

/** Mobile : session active PAR élève */
const activeSlide = ref<Record<number, number>>({})

/* ===== Dialogs ===== */
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
  await onSetStatus(excuseDialog.value.studentId!, excuseDialog.value.sessionId!, 'excused', text)
  closeExcuseDialog()
}

/* Suppression élève */
const deleteDialog = ref<{ show: boolean; loading: boolean; student: Student | null }>({
  show: false,
  loading: false,
  student: null,
})
async function doDeleteStudent() {
  const st = deleteDialog.value.student
  if (!st) return
  deleteDialog.value.loading = true

  try {
    await axios.delete(`${API}/api/students/${st.id}`, { headers: authHeaders() })

    // MAJ UI locale
    students.value = students.value.filter((x) => x.id !== st.id)
    delete attendanceMap[st.id]
    delete activeSlide.value[st.id]
    restoreActiveSessionForAllStudents()

    // Ferme les dialogs + feedback
    deleteDialog.value = { show: false, loading: false, student: null }
    studentDialog.value = false
    snackbar.value = { show: true, text: '🗑️ Élève supprimé', color: 'success' }
  } catch (e: unknown) {
    let msg = '❌ Échec suppression'
    if (isAxiosError(e)) {
      const status = e.response?.status
      const serverMsg =
        (e.response?.data as { error?: string; message?: string } | undefined)?.error ??
        (e.response?.data as any)?.message

      if (status === 404) msg = serverMsg || 'Endpoint introuvable (base API incorrecte ?)'
      else if (status === 401 || status === 403) msg = 'Action non autorisée'
      else msg = serverMsg || msg
    }
    console.error('Suppression élève échouée', e)
    snackbar.value = { show: true, text: msg, color: 'error' }
  } finally {
    deleteDialog.value.loading = false
  }
}

/* ===== Utils ===== */
function authHeaders() {
  const t = localStorage.getItem('token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}
function formatDate(d?: string) {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return `${dd}-${m}-${y}`
}

function ensureKey(studentId: number, sessionId: number) {
  if (!attendanceMap[studentId]) attendanceMap[studentId] = {}
  if (!attendanceMap[studentId][sessionId])
    attendanceMap[studentId][sessionId] = { status: null, comment: null }
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

/** ISO (1..7) depuis YYYY-MM-DD (UTC) */
function isoDowFromYmd(ymd: string): number {
  const d = new Date(ymd + 'T12:00:00Z')
  const js = d.getUTCDay() // 0..6, 0=dim
  return js === 0 ? 7 : js
}

/** Jour personnel élève (1..7) si défini, sinon null */
function studentIsoWeekday(st: Student): number | null {
  const w = Number((st as any).weekday ?? 0)
  return w >= 1 && w <= 7 ? w : null
}

/** Sessions affichées en MOBILE pour l’élève (filtrage “hors jour”) */
function mobileSessionsFor(st: Student): Session[] {
  const w = studentIsoWeekday(st)
  if (!w) return sortedSessions.value
  return sortedSessions.value.filter((s) => isoDowFromYmd(s.date) === w)
}

/* Couleurs / labels / icônes pour boutons d’élève */
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

/* ===== Statut / note de séance + pointabilité ===== */
function sessionStatus(id: number): SessionStatus {
  const s = sessions.value.find((x) => x.id === id)
  return (s?.status as SessionStatus) ?? 'scheduled'
}
function sessionNote(id: number) {
  return sessions.value.find((x) => x.id === id)?.note ?? null
}
function isSessionPointable(id: number) {
  return !NON_POINTABLE.has(sessionStatus(id))
}

/** Jour attendu pour l’élève (priorité: élève > classe) */
function expectedIsoForStudent(stId: number): number | null {
  const st = students.value.find((x) => x.id === stId)
  return st?.weekday ?? classWeekday.value ?? null
}
/** Cette séance correspond-elle au jour attendu de l’élève ? */
function isExpectedForStudent(stId: number, seId: number): boolean {
  const se = sessions.value.find((x) => x.id === seId)
  if (!se) return false
  const iso = isoDowFromYmd(se.date)
  const expected = expectedIsoForStudent(stId)
  if (!expected || !iso) return true // pas de restriction si aucun jour paramétré
  return iso === expected
}
/** Pointable pour l’élève = bon jour & séance pointable */
function isPointableForStudent(stId: number, seId: number): boolean {
  if (!isExpectedForStudent(stId, seId)) return false
  return isSessionPointable(seId)
}

/* Chips de statut séance */
function chipLabel(s: SessionStatus) {
  return s === 'extra'
    ? 'Séance extra'
    : s === 'cancelled'
      ? 'Annulé'
      : s === 'holiday'
        ? 'Férié'
        : s === 'vacation'
          ? 'Vacances'
          : ''
}
function chipIcon(s: SessionStatus) {
  return s === 'extra'
    ? 'mdi-plus-circle-outline'
    : s === 'cancelled'
      ? 'mdi-close-octagon-outline'
      : s === 'holiday'
        ? 'mdi-flag-variant-outline'
        : 'mdi-airplane'
}
function chipColor(s: SessionStatus) {
  return s === 'extra'
    ? 'secondary'
    : s === 'cancelled'
      ? 'error'
      : s === 'holiday'
        ? 'grey'
        : 'info'
}
const sessionStatusOptions = [
  { value: 'scheduled', label: 'Programmé (pointable)' },
  { value: 'cancelled', label: 'Annulé (non pointable)' },
  { value: 'holiday', label: 'Férié (non pointable)' },
  { value: 'vacation', label: 'Vacances (non pointable)' },
  { value: 'extra', label: 'Séance extra (pointable)' },
] as { value: SessionStatus; label: string }[]

/* Dialog édition statut */
const sessionDialog = ref<{
  show: boolean
  id: number | null
  status: SessionStatus
  note: string
  force: boolean
  saving: boolean
  dateLabel: string
}>({
  show: false,
  id: null,
  status: 'scheduled',
  note: '',
  force: false,
  saving: false,
  dateLabel: '',
})
function openSessionDialog(s: Session) {
  sessionDialog.value = {
    show: true,
    id: s.id,
    status: (s.status as SessionStatus) ?? 'scheduled',
    note: s.note ?? '',
    force: false,
    saving: false,
    dateLabel: `Séance du ${formatDate(s.date)}`,
  }
}
async function saveSessionStatus() {
  const d = sessionDialog.value
  if (!d.id) return
  try {
    d.saving = true
    const params = d.force ? '?force=true' : ''
    const body = { status: d.status, note: d.note?.trim() || null }
    const { data } = await axios.patch(`${API}/sessions/${d.id}/status${params}`, body, {
      headers: authHeaders(),
    })
    const idx = sessions.value.findIndex((s) => s.id === d.id)
    if (idx >= 0)
      sessions.value[idx] = {
        ...sessions.value[idx],
        status: (data?.status as SessionStatus) ?? d.status,
        note: data?.note ?? body.note ?? null,
      }
    sessionDialog.value.show = false
    snackbar.value = { show: true, text: 'Statut de séance mis à jour', color: 'success' }
  } catch (e: any) {
    const msg =
      e?.response?.data?.message ||
      (e?.response?.status === 409
        ? 'Des pointages existent. Cochez "Supprimer les pointages…" pour forcer.'
        : 'Erreur de mise à jour.')
    snackbar.value = { show: true, text: msg, color: 'error' }
  } finally {
    d.saving = false
  }
}

function askDeleteStudent(st: Student) {
  studentDialog.value = false
  deleteDialog.value = { show: true, loading: false, student: st }
}


/* ===== Tri & fenêtre scolaire ===== */
function schoolStartYear(dateStr: string) {
  const y = Number(dateStr.slice(0, 4)),
    m = Number(dateStr.slice(5, 7))
  return m >= 9 ? y : y - 1
}
function inSchoolWindow(dateStr: string) {
  const y0 = schoolStartYear(dateStr)
  const lower = `${y0}-09-15`,
    upper = `${y0 + 1}-07-14`
  return dateStr >= lower && dateStr <= upper
}
const sortedSessions = computed<Session[]>(() =>
  sessions.value
    .filter((s) => s && s.date && inSchoolWindow(s.date))
    .sort((a, b) => a.date.localeCompare(b.date)),
)

/* ===== Avancement (mobile) ===== */
function isValidated(studentId: number, sessionId: number) {
  if (!isSessionPointable(sessionId)) return true // une séance non pointable est “validée”
  return !!getStatus(studentId, sessionId)
}
function isSessionFullyValidated(sessionId: number) {
  const concerned = students.value.filter((st) => isPointableForStudent(st.id, sessionId))
  if (!concerned.length) return true
  return concerned.every((st) => !!getStatus(st.id, sessionId))
}
const progressKeyForStudent = (studentId: number) =>
  `attendance_progress_class_${String(props.classId)}_student_${studentId}`
function firstUnvalidatedForStudent(studentId: number): number {
  const st = students.value.find((x) => x.id === studentId)
  if (!st) return 0
  const list = mobileSessionsFor(st)
  for (const s of list) if (!isValidated(studentId, s.id)) return s.id
  return list[0]?.id ?? 0
}
function nextUnvalidatedFromForStudent(studentId: number, sessionId: number): number {
  const st = students.value.find((x) => x.id === studentId)
  if (!st) return 0
  const list = mobileSessionsFor(st)
  if (!list.length) return 0
  const startIdx = Math.max(
    0,
    list.findIndex((s) => s.id === sessionId),
  )
  for (let i = startIdx + 1; i < list.length; i++)
    if (!isValidated(studentId, list[i].id)) return list[i].id
  return firstUnvalidatedForStudent(studentId)
}
function setActiveSessionForStudent(studentId: number, sessionId: number) {
  activeSlide.value[studentId] = sessionId
  localStorage.setItem(progressKeyForStudent(studentId), String(sessionId))
}
function restoreActiveSessionForAllStudents() {
  if (!students.value.length) return
  for (const st of students.value) {
    const list = mobileSessionsFor(st)
    if (!list.length) continue
    const computedId = firstUnvalidatedForStudent(st.id)
    const saved = Number(localStorage.getItem(progressKeyForStudent(st.id)))
    const savedExists = list.some((s) => s.id === saved)
    const target = computedId || (savedExists ? saved : list[0].id)
    setActiveSessionForStudent(st.id, target)
  }
}

/* ===== Dédup + init nouvel élève ===== */
function dedupeSessions(list: Session[]) {
  const seen = new Set<number>()
  return list.filter((s) => !seen.has(s.id) && seen.add(s.id))
}
watch(
  students,
  (newList, oldList) => {
    const oldIds = new Set((oldList ?? []).map((s) => s.id))
    for (const st of newList) {
      if (!oldIds.has(st.id)) {
        for (const s of sessions.value) ensureKey(st.id, s.id)
        setActiveSessionForStudent(st.id, firstUnvalidatedForStudent(st.id))
      }
    }
  },
  { deep: false },
)

/* ===== Fetch ===== */
async function fetchAll() {
  loading.value = true
  error.value = null
  try {
    const auth = authHeaders()
    const classIdNum = Number(props.classId)

    // (0) fallback weekday de la classe
    try {
      const clRes = await axios.get(`${API}/api/classes/${classIdNum}`, { headers: auth })
      classWeekday.value = Number(clRes.data?.weekday ?? 0) || null
    } catch {
      classWeekday.value = null
    }

    // (1) élèves
    const stRes = await axios.get<Student[]>(`${API}/api/students/${classIdNum}`, { headers: auth })
    students.value = Array.isArray(stRes.data) ? stRes.data : []

    // (2) sessions
    const seRes = await axios.get<
      { id: number; date: string; status?: SessionStatus; note?: string | null }[]
    >(`${API}/sessions/${classIdNum}`, { headers: auth })
    const raw = Array.isArray(seRes.data) ? seRes.data : []
    sessions.value = dedupeSessions(
      raw
        .filter((s) => s && typeof s.id === 'number' && s.date)
        .map((s) => ({
          id: s.id,
          date: s.date,
          status: (s.status as SessionStatus) ?? 'scheduled',
          note: s.note ?? null,
        })),
    )

    // (3) présences
    const atRes = await axios.get<AttendanceRow[]>(`${API}/attendance/${classIdNum}`, {
      headers: auth,
    })
    for (const sid in attendanceMap) delete attendanceMap[+sid] // reset
    for (const row of atRes.data || []) {
      ensureKey(row.student_id, row.session_id)
      attendanceMap[row.student_id][row.session_id] = {
        status: row.status,
        comment: row.comment ?? null,
      }
    }
    // pré-créer cellules vides
    for (const st of students.value) for (const s of sessions.value) ensureKey(st.id, s.id)

    restoreActiveSessionForAllStudents()
  } catch (e) {
    console.error('[AttendanceMatrix] fetchAll error', e)
    error.value = 'Impossible de charger élèves / sessions.'
  } finally {
    loading.value = false
  }
}

/* ===== Save présence (avec rollback fiable) ===== */
async function onSetStatus(
  studentId: number,
  sessionId: number,
  status: 'present' | 'absent' | 'excused',
  comment: string | null = null,
) {
  // garde-fou : pas de pointage sur séance non pointable
  if (!isSessionPointable(sessionId)) {
    snackbar.value = {
      show: true,
      text: 'Séance non pointable (annulée/férié/vacances).',
      color: 'error',
    }
    return
  }

  ensureKey(studentId, sessionId)

  // excusé => commentaire requis (ouvrir le dialog si vide)
  if (status === 'excused' && (!comment || !comment.trim())) {
    return openExcuseDialog(studentId, sessionId)
  }

  // snapshot pour rollback
  const prevStatus = attendanceMap[studentId][sessionId].status
  const prevComment = attendanceMap[studentId][sessionId].comment

  try {
    // MAJ optimiste
    if (status === 'present' || status === 'absent') {
      attendanceMap[studentId][sessionId].status = status
      attendanceMap[studentId][sessionId].comment = null
    } else {
      attendanceMap[studentId][sessionId].status = 'excused'
      attendanceMap[studentId][sessionId].comment = (comment ?? '').trim()
    }

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

    // auto-avance (mobile)
    if (smAndDown.value) {
      const next = nextUnvalidatedFromForStudent(studentId, sessionId)
      setActiveSessionForStudent(studentId, next)
    }
  } catch (e) {
    console.error('Erreur sauvegarde présence :', e)
    // rollback fidèle
    attendanceMap[studentId][sessionId].status = prevStatus ?? null
    attendanceMap[studentId][sessionId].comment = prevComment ?? null
    snackbar.value = { show: true, text: '❌ Erreur enregistrement', color: 'error' }
  }
}

/* ===== Exposition au parent & lifecycle ===== */
function reload() {
  return fetchAll()
}
defineExpose({ reload })

onMounted(fetchAll)
watch(() => props.classId, fetchAll)
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
