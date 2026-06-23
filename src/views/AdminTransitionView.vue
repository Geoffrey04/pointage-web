<template>
  <v-container>
    <div class="d-flex align-center ga-3 mb-6">
      <v-btn icon variant="text" :to="{ name: 'Admin' }">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <div class="text-h6">Transition de fin d'année</div>
        <div class="text-caption text-medium-emphasis">Reconduire les élèves vers l'année suivante</div>
      </div>
    </div>

    <!-- Sélection des années -->
    <v-card class="rounded-xl elevation-2 mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="5">
            <v-select
              v-model="fromYearId"
              :items="years"
              item-title="label"
              item-value="id"
              label="Année source"
              variant="outlined"
              density="comfortable"
              hide-details
              :loading="loading.years"
            />
          </v-col>
          <v-col cols="12" sm="2" class="text-center">
            <v-icon color="medium-emphasis">mdi-arrow-right</v-icon>
          </v-col>
          <v-col cols="12" sm="5">
            <v-select
              v-model="toYearId"
              :items="years"
              item-title="label"
              item-value="id"
              label="Année cible"
              variant="outlined"
              density="comfortable"
              hide-details
              :loading="loading.years"
            />
          </v-col>
        </v-row>
        <v-alert
          v-if="fromYearId && toYearId && fromYearId === toYearId"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          L'année source et l'année cible sont identiques.
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Progression -->
    <v-card v-if="ready" class="rounded-xl elevation-2 mb-4">
      <v-card-text class="d-flex align-center ga-4 py-3">
        <div>
          <span class="text-h6 font-weight-bold">{{ doneCount }}</span>
          <span class="text-medium-emphasis"> / {{ classesList.length }} classes</span>
        </div>
        <v-progress-linear
          :model-value="progress"
          color="success"
          rounded
          class="flex-grow-1"
          height="8"
        />
        <v-chip
          v-if="doneCount === classesList.length && classesList.length > 0"
          color="success"
          variant="tonal"
          size="small"
          prepend-icon="mdi-check-all"
        >
          Terminé
        </v-chip>
      </v-card-text>
    </v-card>

    <!-- Squelette chargement -->
    <template v-if="loading.enrollments">
      <v-card v-for="n in 3" :key="n" class="rounded-xl elevation-2 mb-4">
        <v-skeleton-loader type="list-item-avatar-three-line" />
      </v-card>
    </template>

    <!-- Liste des classes -->
    <template v-else-if="ready">
      <v-card
        v-for="cls in classesList"
        :key="cls.class_id"
        class="rounded-xl elevation-2 mb-4"
      >
        <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2 py-3">
          <div class="d-flex align-center ga-2 flex-wrap">
            <span>{{ cls.class_name }}</span>
            <v-chip size="small" variant="tonal">
              {{ cls.students.length }} élève{{ cls.students.length > 1 ? 's' : '' }}
            </v-chip>
            <v-chip
              v-if="cls.reconduited"
              size="small"
              color="success"
              variant="tonal"
              prepend-icon="mdi-check"
            >
              Reconduit
            </v-chip>
          </div>
          <v-btn
            color="primary"
            size="small"
            variant="tonal"
            prepend-icon="mdi-account-multiple-plus"
            :loading="cls.loading"
            :disabled="cls.reconduited || cls.students.length === 0"
            @click="reconduire(cls)"
          >
            Reconduire la classe
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-list density="compact" class="py-0">
          <v-list-item
            v-for="s in cls.students"
            :key="s.student_id"
            :title="`${s.firstname} ${s.lastname}`"
            prepend-icon="mdi-account-school"
          >
            <template #append>
              <v-btn
                size="x-small"
                variant="tonal"
                prepend-icon="mdi-swap-horizontal"
                @click="openMove(s, cls)"
              >
                Changer de classe
              </v-btn>
            </template>
          </v-list-item>
          <v-list-item v-if="cls.students.length === 0" class="text-medium-emphasis text-caption">
            Aucun élève inscrit
          </v-list-item>
        </v-list>
      </v-card>

      <v-alert v-if="classesList.length === 0" type="info" variant="tonal">
        Aucun enrollment trouvé pour l'année source.
      </v-alert>
    </template>

    <!-- Dialog : changer de classe -->
    <v-dialog v-model="moveDialog.show" max-width="440">
      <v-card class="rounded-xl">
        <v-card-title class="pt-4 px-4">Changer de classe</v-card-title>
        <v-card-text class="px-4 pb-2">
          <div class="text-body-2 mb-4">
            Inscrire
            <strong>{{ moveDialog.student?.firstname }} {{ moveDialog.student?.lastname }}</strong>
            dans quelle classe pour <strong>{{ toYearLabel }}</strong> ?
          </div>
          <v-select
            v-model="moveDialog.targetClassId"
            :items="allClasses"
            item-title="nom"
            item-value="id"
            label="Classe cible *"
            variant="outlined"
            density="comfortable"
          />
          <v-checkbox
            v-model="moveDialog.updateCurrent"
            label="Mettre à jour la classe courante de l'élève (students.class_id)"
            density="compact"
            hide-details
            class="mt-1"
          />
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="moveDialog.show = false">Annuler</v-btn>
          <v-btn
            color="primary"
            :loading="moveDialog.saving"
            :disabled="!moveDialog.targetClassId"
            @click="confirmMove"
          >
            Inscrire
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '@/stores/user'

const loading = ref({ years: true, enrollments: false })
const years    = ref([])
const allClasses = ref([])
const fromYearId = ref(null)
const toYearId   = ref(null)
const classesList = ref([])
const snackbar = ref({ show: false, text: '', color: 'success' })

const moveDialog = ref({
  show: false,
  student: null,
  sourceClass: null,
  targetClassId: null,
  updateCurrent: false,
  saving: false,
})

// ─── Computed ───────────────────────────────────────────────
const ready = computed(
  () => fromYearId.value && toYearId.value && fromYearId.value !== toYearId.value && !loading.enrollments,
)

const toYearLabel = computed(
  () => years.value.find((y) => y.id === toYearId.value)?.label ?? '—',
)

const doneCount = computed(() => classesList.value.filter((c) => c.reconduited).length)

const progress = computed(() =>
  classesList.value.length ? (doneCount.value / classesList.value.length) * 100 : 0,
)

// ─── Chargement initial ─────────────────────────────────────
onMounted(async () => {
  const [resYears, resClasses] = await Promise.all([
    api.get('/api/admin/school-years'),
    api.get('/api/admin/classes'),
  ])
  years.value     = Array.isArray(resYears.data)   ? resYears.data   : []
  allClasses.value = Array.isArray(resClasses.data) ? resClasses.data : []
  loading.value.years = false

  // Pré-sélection : année courante → suivante si possible
  const current = years.value.find((y) => y.is_current)
  if (current) {
    fromYearId.value = current.id
    const next = years.value.find((y) => y.id !== current.id && y.label > current.label)
    if (next) toYearId.value = next.id
  }
})

// ─── Chargement des enrollments quand les années changent ───
watch([fromYearId, toYearId], async ([from, to]) => {
  classesList.value = []
  if (!from || !to || from === to) return

  loading.value.enrollments = true
  try {
    const [resFrom, resTo] = await Promise.all([
      api.get('/api/admin/enrollments', { params: { year_id: from } }),
      api.get('/api/admin/enrollments', { params: { year_id: to } }),
    ])

    const fromRows = Array.isArray(resFrom.data) ? resFrom.data : []
    const toRows   = Array.isArray(resTo.data)   ? resTo.data   : []

    // Clés déjà inscrites dans l'année cible
    const toKeys = new Set(toRows.map((r) => `${r.student_id}-${r.class_id}`))

    // Grouper par classe
    const map = new Map()
    for (const row of fromRows) {
      if (!map.has(row.class_id)) {
        map.set(row.class_id, {
          class_id:   row.class_id,
          class_name: row.class_name,
          students:   [],
          loading:    false,
          reconduited: false,
        })
      }
      map.get(row.class_id).students.push(row)
    }

    // Marquer les classes déjà reconductées (tous les élèves déjà dans to_year)
    for (const cls of map.values()) {
      if (cls.students.length > 0) {
        cls.reconduited = cls.students.every((s) =>
          toKeys.has(`${s.student_id}-${s.class_id}`),
        )
      }
    }

    classesList.value = [...map.values()].sort((a, b) =>
      a.class_name.localeCompare(b.class_name, 'fr'),
    )
  } catch (e) {
    console.error('loadEnrollments :', e)
    snackbar.value = { show: true, text: 'Erreur de chargement', color: 'error' }
  } finally {
    loading.value.enrollments = false
  }
})

// ─── Reconduire une classe entière ─────────────────────────
async function reconduire(cls) {
  cls.loading = true
  try {
    const { data } = await api.post('/api/admin/enrollments/bulk', {
      from_year_id: fromYearId.value,
      to_year_id:   toYearId.value,
      class_id:     cls.class_id,
    })
    cls.reconduited = true
    snackbar.value = {
      show: true,
      text: `${cls.class_name} — ${data.enrolled} élève${data.enrolled > 1 ? 's' : ''} reconduit${data.enrolled > 1 ? 's' : ''}`,
      color: 'success',
    }
  } catch (e) {
    snackbar.value = { show: true, text: 'Erreur lors de la reconduction', color: 'error' }
  } finally {
    cls.loading = false
  }
}

// ─── Changer un élève de classe ─────────────────────────────
function openMove(student, cls) {
  moveDialog.value = {
    show: true,
    student,
    sourceClass: cls,
    targetClassId: null,
    updateCurrent: false,
    saving: false,
  }
}

async function confirmMove() {
  moveDialog.value.saving = true
  try {
    await api.post('/api/admin/enrollments', {
      student_id:     moveDialog.value.student.student_id,
      class_id:       moveDialog.value.targetClassId,
      school_year_id: toYearId.value,
    })

    if (moveDialog.value.updateCurrent) {
      await api.patch(`/api/students/${moveDialog.value.student.student_id}`, {
        class_id: moveDialog.value.targetClassId,
      })
    }

    const targetName = allClasses.value.find((c) => c.id === moveDialog.value.targetClassId)?.nom ?? '?'
    snackbar.value = {
      show: true,
      text: `${moveDialog.value.student.firstname} inscrit en ${targetName}`,
      color: 'success',
    }
    moveDialog.value.show = false
  } catch (e) {
    const msg = e?.response?.data?.message || 'Erreur'
    snackbar.value = { show: true, text: msg, color: 'error' }
  } finally {
    moveDialog.value.saving = false
  }
}
</script>