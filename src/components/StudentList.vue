<template>
  <div class="sl-root">
    <!-- Bande rouge de cohérence visuelle -->
    <div class="sl-stripe"></div>

    <!-- Contrôles : tri + compteur -->
    <div class="sl-controls">
      <div class="sl-sort-row">
        <v-btn
          size="small"
          variant="outlined"
          color="primary"
          rounded="lg"
          @click="sortAsc = !sortAsc"
        >
          {{ sortAsc ? 'A → Z' : 'Z → A' }}
        </v-btn>
        <span class="sl-count text-medium-emphasis text-caption" v-if="currentClass">
          {{ filtered.length }}&nbsp;élève{{ filtered.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Erreur -->
    <v-alert v-if="error" type="error" variant="tonal" class="mx-4 mb-3">{{ error }}</v-alert>

    <!-- Skeleton -->
    <div v-if="loading" class="sl-list">
      <v-skeleton-loader v-for="i in 6" :key="i" type="list-item-avatar" class="mb-2 rounded-xl" />
    </div>

    <!-- Aucun résultat -->
    <div v-else-if="filtered.length === 0" class="text-center text-medium-emphasis pa-8">
      Aucun élève trouvé.
    </div>

    <!-- Liste mobile -->
    <div v-else-if="smAndDown" class="sl-list">
      <div v-for="st in paged" :key="st.id" class="sl-card">
        <div class="sl-avatar">{{ initials(st) }}</div>
        <div class="sl-info">
          <div class="sl-lastname">{{ st.lastname }}</div>
          <div class="sl-firstname">{{ st.firstname }}</div>
          <div v-if="st.phone" class="sl-phone">{{ st.phone }}</div>
        </div>
        <div class="sl-actions">
          <v-btn
            v-if="st.phone"
            icon
            size="small"
            color="primary"
            variant="tonal"
            :href="`tel:${plainPhone(st.phone)}`"
            :title="`Appeler ${st.firstname}`"
          >
            <v-icon size="18" style="color:#1E88E5">mdi-phone</v-icon>
          </v-btn>
          <v-btn
            v-if="st.phone"
            icon
            size="small"
            color="primary"
            variant="tonal"
            :href="`sms:${plainPhone(st.phone)}`"
            :title="`SMS ${st.firstname}`"
          >
            <v-icon size="18" style="color:#1E88E5">mdi-message-text</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="tonal" color="primary" @click="openInfo(st)" title="Modifier">
            <v-icon size="18" style="color:#1E88E5">mdi-pencil</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Grille desktop -->
    <v-row v-else class="sl-grid px-4">
      <v-col cols="12" sm="6" md="4" v-for="st in paged" :key="st.id">
        <v-card class="rounded-xl hover-elevate" variant="outlined">
          <v-card-text class="d-flex align-center ga-3">
            <v-avatar size="44" color="primary">
              <span class="text-subtitle-1 font-weight-bold text-white">{{ initials(st) }}</span>
            </v-avatar>
            <div class="flex-1 overflow-hidden">
              <div class="text-subtitle-2 font-weight-bold truncate">{{ st.lastname }}</div>
              <div class="text-body-2 truncate">{{ st.firstname }}</div>
              <div class="text-caption text-medium-emphasis">{{ st.phone || '—' }}</div>
            </div>
            <div class="d-flex flex-column ga-1">
              <v-btn
                v-if="st.phone"
                size="small"
                icon
                color="primary"
                variant="tonal"
                :href="`tel:${plainPhone(st.phone)}`"
                :title="`Appeler ${st.firstname}`"
              >
                <v-icon size="16" style="color:#1E88E5">mdi-phone</v-icon>
              </v-btn>
              <v-btn
                v-if="st.phone"
                size="small"
                icon
                color="primary"
                variant="tonal"
                :href="`sms:${plainPhone(st.phone)}`"
                :title="`SMS ${st.firstname}`"
              >
                <v-icon size="16" style="color:#1E88E5">mdi-message-text</v-icon>
              </v-btn>
              <v-btn size="small" icon variant="tonal" color="primary" @click="openInfo(st)">
                <v-icon size="16" style="color:#1E88E5">mdi-pencil</v-icon>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pagination -->
    <div v-if="filtered.length > perPage" class="d-flex justify-center py-4">
      <v-pagination v-model="page" :length="pages" total-visible="5" density="comfortable" />
    </div>
  </div>

  <!-- Dialog édition -->
  <v-dialog v-model="infoDialog" max-width="420">
    <v-card>
      <v-card-title class="text-h6">Infos élève</v-card-title>
      <v-card-text v-if="selected">
        <div class="mb-2"><strong>Nom :</strong> {{ selected.lastname }}</div>
        <div class="mb-2"><strong>Prénom :</strong> {{ selected.firstname }}</div>
        <v-text-field
          label="Téléphone"
          v-model="selected.phone"
          density="compact"
          variant="outlined"
          placeholder="Ajouter un numéro"
          class="mb-2"
        />
        <v-select
          v-model="selected.weekday"
          :items="weekdayItems"
          item-title="label"
          item-value="value"
          label="Jour de cours"
          density="compact"
          variant="outlined"
          clearable
          :hint="classWeekdayHint"
          persistent-hint
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" variant="text" @click="saveStudent">Enregistrer</v-btn>
        <v-btn variant="text" @click="infoDialog = false">Fermer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { api } from '@/stores/user'

const props = defineProps({
  classId: { type: [Number, String], required: false },
})

const route = useRoute()
const { smAndDown } = useDisplay()

const loading = ref(true)
const error = ref(null)

const classes = ref([])
const currentClass = ref(null)
const students = ref([])

const sortAsc = ref(true)
const perPage = ref(12)
const page = ref(1)

const infoDialog = ref(false)
const selected = ref(null)
const snackbar = ref({ show: false, text: '', color: 'success' })
const openInfo = (st) => {
  selected.value = { ...st, weekday: st.weekday ?? null }
  infoDialog.value = true
}

const weekdayItems = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
]

const weekdayLabel = (n) =>
  weekdayItems.find((w) => w.value === Number(n))?.label ?? null

const classWeekdayHint = computed(() => {
  const cwd = currentClass.value?.weekday
  if (!cwd) return 'Aucun jour par défaut sur la classe'
  return `Par défaut de la classe : ${weekdayLabel(cwd)}`
})

const plainPhone = (p) => (p || '').replace(/\D/g, '')
const initials = (st) =>
  (st?.lastname?.[0] || '').toUpperCase() + (st?.firstname?.[0] || '').toUpperCase()

const effectiveClassId = computed(() =>
  Number(props.classId ?? route.params.classId ?? route.params.id),
)

const filtered = computed(() => {
  const arr = [...students.value]
  arr.sort((a, b) => {
    const ka = (a.lastname || '').toLowerCase()
    const kb = (b.lastname || '').toLowerCase()
    if (ka < kb) return sortAsc.value ? -1 : 1
    if (ka > kb) return sortAsc.value ? 1 : -1
    return 0
  })
  return arr
})

const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)))
const paged = computed(() => {
  const start = (page.value - 1) * perPage.value
  return filtered.value.slice(start, start + perPage.value)
})

async function fetchAuthorizedClasses() {
  const { data } = await api.get('/api/classes')
  classes.value = Array.isArray(data) ? data : []
}

async function fetchStudents() {
  const cid = effectiveClassId.value
  if (!cid) throw new Error('ID de classe manquant.')
  const allowed = classes.value.some((c) => Number(c.id) === Number(cid))
  if (!allowed) throw new Error('Accès refusé à cette classe.')
  const { data } = await api.get(`/api/students/${cid}`)
  students.value = Array.isArray(data) ? data : []
}

onMounted(async () => {
  try {
    loading.value = true
    error.value = null
    await fetchAuthorizedClasses()
    const cid = effectiveClassId.value
    currentClass.value = classes.value.find((c) => Number(c.id) === Number(cid)) || null
    if (!currentClass.value) throw new Error('Classe introuvable ou non autorisée.')
    await fetchStudents()
  } catch (e) {
    console.error('StudentList error:', e)
    error.value = e?.response?.data?.message || e?.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
})

const saveStudent = async () => {
  if (!selected.value?.id) return
  try {
    const { data } = await api.patch(`/api/students/${selected.value.id}`, {
      phone: selected.value.phone || null,
      weekday: selected.value.weekday ?? null,
    })
    const index = students.value.findIndex((s) => s.id === selected.value.id)
    if (index !== -1) students.value[index] = data
    snackbar.value = { show: true, text: 'Élève mis à jour', color: 'success' }
    infoDialog.value = false
  } catch (e) {
    const msg = e?.response?.data?.message || 'Erreur lors de la mise à jour'
    snackbar.value = { show: true, text: msg, color: 'error' }
  }
}
</script>

<style scoped>
.sl-root {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Bande rouge cohérence visuelle */
.sl-stripe {
  height: 5px;
  background: #c8102e;
  flex-shrink: 0;
}

/* Contrôles */
.sl-controls {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #dde3f5;
}
.sl-sort-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.sl-count {
  margin-left: auto;
}

/* Liste mobile */
.sl-list {
  padding: 14px 14px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Card élève (mobile) */
.sl-card {
  background: #fff;
  border-radius: 14px;
  padding: 11px 13px;
  display: flex;
  align-items: center;
  gap: 11px;
  box-shadow: 0 2px 10px rgba(26, 58, 143, 0.09);
  border: 1.5px solid #dde3f5;
}
.sl-avatar {
  width: 38px;
  height: 38px;
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
.sl-info {
  flex: 1;
  min-width: 0;
}
.sl-lastname {
  font-size: 13.5px;
  font-weight: 700;
  color: #0d1a3a;
  line-height: 1.3;
}
.sl-firstname {
  font-size: 12px;
  color: #4b5a7a;
  line-height: 1.3;
}
.sl-phone {
  font-size: 11px;
  color: #6272a0;
  margin-top: 2px;
}
.sl-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Grille desktop */
.sl-grid {
  padding-top: 12px;
}
.hover-elevate {
  transition: box-shadow 0.2s ease;
}
.hover-elevate:hover {
  box-shadow: 0 4px 16px rgba(30, 136, 229, 0.18);
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>