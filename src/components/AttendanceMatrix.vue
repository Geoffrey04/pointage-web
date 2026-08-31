<template>
  <div class="att-root">

    <!-- ====== MOBILE : Vue par date ====== -->
    <div v-if="smAndDown" class="mobile-att">
      <v-alert v-if="error" type="error" variant="tonal" class="ma-3">{{ error }}</v-alert>

      <template v-else>
        <!-- Navigateur de date -->
        <div class="date-nav">
          <div class="date-row">
            <button class="btn-arrow" :disabled="currentSessionIdx <= 0" @click="goPrev">&#8249;</button>
            <div class="date-label">{{ readableDate(currentSession?.date) }}</div>
            <button
              class="btn-arrow"
              :disabled="currentSessionIdx >= sortedSessions.length - 1"
              @click="goNext"
            >&#8250;</button>
          </div>
          <div class="date-meta">
            <v-btn
              size="small"
              rounded="pill"
              color="error"
              variant="flat"
              prepend-icon="mdi-calendar-today"
              @click="goToday"
            >Séance du jour</v-btn>
            <v-btn
              size="small"
              icon
              variant="tonal"
              color="primary"
              title="Choisir une date"
              @click="calendarOpen = true"
            >
              <v-icon size="18">mdi-calendar-month</v-icon>
            </v-btn>
            <span v-if="currentSession" class="session-chip">
              {{ studentsForCurrentSession.length }}&nbsp;élève{{ studentsForCurrentSession.length !== 1 ? 's' : '' }}&nbsp;&middot;&nbsp;Séance&nbsp;n&deg;{{ currentSessionIdx + 1 }}
            </span>
            <v-chip
              v-if="currentSession && sessionStatus(currentSession.id) !== 'scheduled'"
              size="x-small"
              :color="chipColor(sessionStatus(currentSession.id))"
              variant="tonal"
              class="ml-1"
            >{{ chipLabel(sessionStatus(currentSession.id)) }}</v-chip>
          </div>
        </div>

        <!-- Résumé compact -->
        <div v-if="currentSession && !loading" class="summary-chips">
          <v-chip size="small" color="success" variant="tonal" prepend-icon="mdi-check">{{ summary.present }} présent{{ summary.present !== 1 ? 's' : '' }}</v-chip>
          <v-chip size="small" color="warning" variant="tonal" prepend-icon="mdi-minus-circle-outline">{{ summary.excused }} excusé{{ summary.excused !== 1 ? 's' : '' }}</v-chip>
          <v-chip size="small" color="error" variant="tonal" prepend-icon="mdi-close">{{ summary.absent }} absent{{ summary.absent !== 1 ? 's' : '' }}</v-chip>
        </div>

        <!-- Skeleton -->
        <div v-if="loading" class="student-list">
          <v-skeleton-loader v-for="i in 4" :key="i" type="list-item-avatar" class="mb-2" />
        </div>

        <!-- Liste des élèves -->
        <div v-else-if="currentSession" class="student-list">
          <div
            v-if="studentsForCurrentSession.length === 0"
            class="text-center text-medium-emphasis pa-6"
          >
            Aucun élève pour cette séance
          </div>
          <div
            v-for="st in studentsForCurrentSession"
            :key="st.id"
            class="student-card"
            :class="{
              'is-present': getStatus(st.id, currentSession.id) === 'present',
              'is-excused': getStatus(st.id, currentSession.id) === 'excused',
              'is-absent':  getStatus(st.id, currentSession.id) === 'absent',
            }"
          >
            <div class="student-avatar">{{ initials(st) }}</div>
            <div class="student-name">
              <div class="sname">{{ st.lastname }}</div>
              <div class="ssub">{{ st.firstname }}<template v-if="st.weekday"> &middot; {{ weekdayLabel(st.weekday) }}</template></div>
              <div
                v-if="currentSession && getStatus(st.id, currentSession.id) === 'excused' && getComment(st.id, currentSession.id)"
                class="excuse-hint"
                @click.stop="openCommentViewer(getComment(st.id, currentSession.id))"
              >
                <v-icon size="11" color="warning">mdi-information-outline</v-icon>
                {{ getComment(st.id, currentSession.id).slice(0, 28) }}{{ getComment(st.id, currentSession.id).length > 28 ? '…' : '' }}
              </div>
            </div>
            <div v-if="isSessionPointable(currentSession.id)" class="status-group">
              <button
                class="status-btn"
                :class="{ 'active-present': getStatus(st.id, currentSession.id) === 'present' }"
                @click="handleStatusClick(st.id, currentSession.id, 'present')"
                aria-label="Présent"
              >&#10003;</button>
              <button
                class="status-btn"
                :class="{ 'active-excused': getStatus(st.id, currentSession.id) === 'excused' }"
                @click="handleStatusClick(st.id, currentSession.id, 'excused')"
                aria-label="Excusé(e)"
              >~</button>
              <button
                class="status-btn"
                :class="{ 'active-absent': getStatus(st.id, currentSession.id) === 'absent' }"
                @click="handleStatusClick(st.id, currentSession.id, 'absent')"
                aria-label="Absent"
              >&#10005;</button>
            </div>
            <div v-if="!isSessionPointable(currentSession.id)" class="session-na-label">{{ chipLabel(sessionStatus(currentSession.id)) }}</div>
          </div>
        </div>

        <div v-else class="text-center text-medium-emphasis pa-6">
          Aucune séance disponible
        </div>

      </template>

      <!-- Calendrier de sélection de séance -->
      <v-dialog v-model="calendarOpen" max-width="360" content-class="cal-dialog">
        <v-card class="rounded-xl overflow-hidden pa-0">
          <v-date-picker
            :model-value="currentSession?.date ?? null"
            :allowed-dates="sessionDates"
            show-adjacent-months
            hide-actions
            color="primary"
            @update:model-value="onCalendarPick"
          >
            <template #header>
              <div class="cal-slim-header">Choisir une séance</div>
            </template>
          </v-date-picker>
        </v-card>
      </v-dialog>
    </div>

    <!-- ====== DESKTOP : Tableau ====== -->
    <div v-else>
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

      <div class="table-scroll">
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
                <template v-if="!isSessionPointable(s.id)">
                  <div class="text-caption text-medium-emphasis">
                    — {{ chipLabel(sessionStatus(s.id)) }} —
                  </div>
                </template>

                <template v-else-if="hasStatus(st.id, s.id)">
                  <template v-if="getStatus(st.id, s.id) === 'excused' && getComment(st.id, s.id)">
                    <v-tooltip :text="getComment(st.id, s.id)" location="top">
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
                  </template>

                  <v-btn
                    size="small"
                    :color="colorOf(getStatus(st.id, s.id))"
                    variant="flat"
                    class="status-pill"
                    @click="resetCell(st.id, s.id)"
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
                    >&#8634;</v-btn
                  >
                </template>

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
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { isAxiosError } from 'axios'
import { api } from '@/stores/user'

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

const NON_POINTABLE = new Set<SessionStatus>(['cancelled', 'holiday', 'vacation'])

const props = defineProps<{ classId: number | string }>()
const { smAndDown } = useDisplay()

const classWeekday = ref<number | null>(null)
const className = ref<string>('')
const students = ref<Student[]>([])
const sessions = ref<Session[]>([])

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

// ─── Vue mobile par date ─────────────────────────────────────
const currentSessionIdx = ref<number>(0)

const currentSession = computed<Session | null>(
  () => sortedSessions.value[currentSessionIdx.value] ?? null,
)

const studentsForCurrentSession = computed<Student[]>(() => {
  const s = currentSession.value
  if (!s) return []
  return students.value.filter((st) => isPointableForStudent(st.id, s.id))
})

const summary = computed(() => {
  const s = currentSession.value
  if (!s) return { present: 0, excused: 0, absent: 0 }
  let present = 0,
    excused = 0,
    absent = 0
  for (const st of studentsForCurrentSession.value) {
    const status = getStatus(st.id, s.id)
    if (status === 'present') present++
    else if (status === 'excused') excused++
    else if (status === 'absent') absent++
  }
  return { present, excused, absent }
})

function goPrev() {
  if (currentSessionIdx.value > 0) currentSessionIdx.value--
}
function goNext() {
  if (currentSessionIdx.value < sortedSessions.value.length - 1) currentSessionIdx.value++
}
function goToday() {
  const today = new Date().toISOString().slice(0, 10)
  let best = 0
  for (let i = 0; i < sortedSessions.value.length; i++) {
    if (sortedSessions.value[i].date <= today) best = i
    else break
  }
  currentSessionIdx.value = best
}

const calendarOpen = ref(false)
const sessionDates = computed(() => sortedSessions.value.map((s) => s.date).filter(Boolean))
function onCalendarPick(date: string | null) {
  if (!date) return
  const idx = sortedSessions.value.findIndex((s) => s.date === date)
  if (idx !== -1) {
    currentSessionIdx.value = idx
    calendarOpen.value = false
  }
}
function initSessionIdx() {
  goToday()
}

const WEEKDAY_NAMES = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
function weekdayLabel(w: number | null | undefined): string {
  return w ? (WEEKDAY_NAMES[w] ?? '') : ''
}
function initials(st: Student): string {
  return `${(st.firstname[0] ?? '').toUpperCase()}${(st.lastname[0] ?? '').toUpperCase()}`
}
function readableDate(d?: string | null): string {
  if (!d) return '—'
  const date = new Date(d + 'T12:00:00Z')
  const dayNames = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.']
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  return `${dayNames[date.getUTCDay()]} ${date.getUTCDate()} ${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}
function handleStatusClick(
  studentId: number,
  sessionId: number,
  status: 'present' | 'absent' | 'excused',
) {
  if (getStatus(studentId, sessionId) === status) {
    resetCell(studentId, sessionId)
  } else {
    onSetStatus(studentId, sessionId, status)
  }
}

// ─── Dialogs ────────────────────────────────────────────────
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
    await api.delete(`/api/students/${st.id}`)

    students.value = students.value.filter((x) => x.id !== st.id)
    delete attendanceMap[st.id]

    deleteDialog.value = { show: false, loading: false, student: null }
    studentDialog.value = false
    snackbar.value = { show: true, text: 'Élève supprimé', color: 'success' }
  } catch (e: unknown) {
    let msg = 'Échec de la suppression'
    if (isAxiosError(e)) {
      const status = e.response?.status
      const serverMsg =
        (e.response?.data as { error?: string; message?: string } | undefined)?.error ??
        (e.response?.data as { message?: string } | undefined)?.message

      if (status === 401 || status === 403) msg = 'Action non autorisée'
      else msg = serverMsg || msg
    }
    console.error('Suppression élève échouée :', e)
    snackbar.value = { show: true, text: msg, color: 'error' }
  } finally {
    deleteDialog.value.loading = false
  }
}

// ─── Utilitaires ────────────────────────────────────────────
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
function hasStatus(studentId: number, sessionId: number) {
  const s = getStatus(studentId, sessionId)
  return s === 'present' || s === 'absent' || s === 'excused'
}

function isoDowFromYmd(ymd: string): number {
  const d = new Date(ymd + 'T12:00:00Z')
  const js = d.getUTCDay()
  return js === 0 ? 7 : js
}

function studentIsoWeekday(st: Student): number | null {
  const w = Number((st as Student & { weekday?: number }).weekday ?? 0)
  return w >= 1 && w <= 7 ? w : null
}

function mobileSessionsFor(st: Student): Session[] {
  const w = studentIsoWeekday(st)
  if (!w) return sortedSessions.value
  return sortedSessions.value.filter((s) => isoDowFromYmd(s.date) === w)
}

// ─── Couleurs / labels / icônes des statuts élève ───────────
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

// ─── Statut / note de séance & pointabilité ─────────────────
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

function expectedIsoForStudent(stId: number): number | null {
  const st = students.value.find((x) => x.id === stId)
  return st?.weekday ?? classWeekday.value ?? null
}
function isExpectedForStudent(stId: number, seId: number): boolean {
  const se = sessions.value.find((x) => x.id === seId)
  if (!se) return false
  const iso = isoDowFromYmd(se.date)
  const expected = expectedIsoForStudent(stId)
  if (!expected || !iso) return true
  return iso === expected
}
function isPointableForStudent(stId: number, seId: number): boolean {
  if (!isExpectedForStudent(stId, seId)) return false
  return isSessionPointable(seId)
}

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
    const { data } = await api.patch(`/sessions/${d.id}/status${params}`, body)
    const idx = sessions.value.findIndex((s) => s.id === d.id)
    if (idx >= 0)
      sessions.value[idx] = {
        ...sessions.value[idx],
        status: (data?.status as SessionStatus) ?? d.status,
        note: data?.note ?? body.note ?? null,
      }
    sessionDialog.value.show = false
    snackbar.value = { show: true, text: 'Statut de séance mis à jour', color: 'success' }
  } catch (e: unknown) {
    let msg = 'Erreur de mise à jour.'
    if (isAxiosError(e)) {
      const responseData = (e.response?.data as { message?: string } | undefined)?.message
      if (responseData) msg = responseData
      else if (e.response?.status === 409)
        msg = 'Des pointages existent. Cochez "Supprimer les pointages…" pour forcer.'
    }
    snackbar.value = { show: true, text: msg, color: 'error' }
  } finally {
    d.saving = false
  }
}

function askDeleteStudent(st: Student) {
  studentDialog.value = false
  deleteDialog.value = { show: true, loading: false, student: st }
}

// ─── Tri & fenêtre scolaire ─────────────────────────────────
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

// ─── Déduplication ──────────────────────────────────────────
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
      }
    }
  },
  { deep: false },
)

// ─── Chargement des données ──────────────────────────────────
async function fetchAll() {
  loading.value = true
  error.value = null
  try {
    const classIdNum = Number(props.classId)

    try {
      const clRes = await api.get(`/api/classes/${classIdNum}`)
      classWeekday.value = Number(clRes.data?.weekday ?? 0) || null
      className.value = clRes.data?.name ?? ''
    } catch {
      classWeekday.value = null
      className.value = ''
    }

    const stRes = await api.get<Student[]>(`/api/students/${classIdNum}`)
    students.value = Array.isArray(stRes.data) ? stRes.data : []

    const seRes = await api.get<
      { id: number; date: string; status?: SessionStatus; note?: string | null }[]
    >(`/sessions/${classIdNum}`)
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

    const atRes = await api.get<AttendanceRow[]>(`/attendance/${classIdNum}`)
    for (const sid in attendanceMap) delete attendanceMap[+sid]
    for (const row of atRes.data || []) {
      ensureKey(row.student_id, row.session_id)
      attendanceMap[row.student_id][row.session_id] = {
        status: row.status,
        comment: row.comment ?? null,
      }
    }
    for (const st of students.value) for (const s of sessions.value) ensureKey(st.id, s.id)

    initSessionIdx()
  } catch (e) {
    console.error('fetchAll error :', e)
    error.value = 'Impossible de charger élèves / sessions.'
  } finally {
    loading.value = false
  }
}

// ─── Enregistrement d'une présence ──────────────────────────
async function onSetStatus(
  studentId: number,
  sessionId: number,
  status: 'present' | 'absent' | 'excused',
  comment: string | null = null,
) {
  if (!isSessionPointable(sessionId)) {
    snackbar.value = {
      show: true,
      text: 'Séance non pointable (annulée/férié/vacances).',
      color: 'error',
    }
    return
  }

  ensureKey(studentId, sessionId)

  if (status === 'excused' && (!comment || !comment.trim())) {
    return openExcuseDialog(studentId, sessionId)
  }

  const prevStatus = attendanceMap[studentId][sessionId].status
  const prevComment = attendanceMap[studentId][sessionId].comment

  try {
    if (status === 'present' || status === 'absent') {
      attendanceMap[studentId][sessionId].status = status
      attendanceMap[studentId][sessionId].comment = null
    } else {
      attendanceMap[studentId][sessionId].status = 'excused'
      attendanceMap[studentId][sessionId].comment = (comment ?? '').trim()
    }

    await api.post('/attendance', {
      student_id: studentId,
      session_id: sessionId,
      status,
      comment: status === 'excused' ? (comment ?? '').trim() : null,
    })

    snackbar.value = { show: true, text: 'Enregistré', color: 'success' }
    window.umami?.track('pointage-marque', { status })
  } catch (e) {
    console.error('Erreur sauvegarde présence :', e)
    attendanceMap[studentId][sessionId].status = prevStatus ?? null
    attendanceMap[studentId][sessionId].comment = prevComment ?? null
    snackbar.value = { show: true, text: 'Erreur enregistrement', color: 'error' }
  }
}

// ─── Exposition au parent & lifecycle ───────────────────────
function reload() {
  return fetchAll()
}
defineExpose({ reload })

onMounted(fetchAll)
watch(() => props.classId, fetchAll)
watch([students, sessions], () => {
  if (students.value.length && sessions.value.length) initSessionIdx()
})
</script>

<style scoped>
/* ========================
   ROOT
   ======================== */
.att-root {
  position: relative;
}

/* ========================
   MOBILE — en-tête classe
   ======================== */
.mobile-att {
  display: flex;
  flex-direction: column;
  min-height: 400px;
}
.att-class-header {
  background: #1e88e5;
}
.att-header-content {
  padding: 12px 16px 8px;
}
.att-class-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}
.att-stripe {
  height: 5px;
  background: #c8102e;
}

/* ========================
   MOBILE — navigateur date
   ======================== */
.date-nav {
  background: #fff;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #dde3f5;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.date-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-arrow {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #eef2ff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e88e5;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
  font-family: inherit;
  line-height: 1;
}
.btn-arrow:disabled {
  opacity: 0.35;
  cursor: default;
}
.date-label {
  flex: 1;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #0d1a3a;
}
.date-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.session-chip {
  font-size: 11.5px;
  color: #6272a0;
  font-weight: 500;
}

/* ========================
   MOBILE — liste élèves
   ======================== */
.student-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  background: #fff;
  min-height: 120px;
}
.student-card {
  background: #fff;
  border-radius: 14px;
  padding: 11px 13px;
  display: flex;
  align-items: center;
  gap: 11px;
  box-shadow: 0 2px 10px rgba(26, 58, 143, 0.09);
  border: 1.5px solid #dde3f5;
}
.student-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #1e88e5;
  flex-shrink: 0;
}
.student-card.is-present .student-avatar { background: #f0fdf4; color: #16a34a; }
.student-card.is-excused .student-avatar { background: #fffbeb; color: #b45309; }
.student-card.is-absent  .student-avatar { background: #fff0f2; color: #c8102e; }

.student-name {
  flex: 1;
  min-width: 0;
}
.sname {
  font-size: 13.5px;
  font-weight: 600;
  color: #0d1a3a;
  line-height: 1.3;
}
.ssub {
  font-size: 11px;
  color: #6272a0;
  margin-top: 1px;
}
.excuse-hint {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 3px;
  font-size: 10.5px;
  color: #b45309;
  font-style: italic;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Boutons statut */
.status-group {
  display: flex;
  border-radius: 9px;
  overflow: hidden;
  border: 1.5px solid #dde3f5;
  flex-shrink: 0;
}
.status-btn {
  width: 36px;
  height: 32px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  font-size: 14px;
  font-weight: 700;
  color: #a0aec0;
  font-family: inherit;
}
.status-btn + .status-btn { border-left: 1.5px solid #dde3f5; }
.status-btn.active-present { background: #dcfce7; color: #16a34a; }
.status-btn.active-excused { background: #fef3c7; color: #b45309; }
.status-btn.active-absent  { background: #ffd6dd; color: #c8102e; }

.session-na-label {
  font-size: 11px;
  color: #6272a0;
  text-align: right;
}

/* ========================
   MOBILE — résumé chips
   ======================== */
.summary-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: #f5f7ff;
  border-bottom: 1px solid #dde3f5;
}

/* ========================
   DESKTOP — boutons/labels
   ======================== */
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

/* ========================
   DESKTOP — tableau
   ======================== */
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
  .name-col { min-width: 160px; }
  .date-col { min-width: 120px; }
}
</style>

<style>
/* Calendrier de séance — font Outfit + header compact */
.cal-dialog .v-date-picker,
.cal-dialog .v-date-picker * {
  font-family: 'Outfit', sans-serif;
}
.cal-slim-header {
  padding: 12px 16px 6px;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1e88e5;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
</style>