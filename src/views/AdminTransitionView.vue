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

    <!-- ── BLOC 1 : Élèves existants ───────────────────────── -->
    <div class="text-subtitle-1 font-weight-bold mb-3">Élèves existants</div>

    <template v-if="loading.enrollments">
      <v-card v-for="n in 3" :key="n" class="rounded-xl elevation-2 mb-4">
        <v-skeleton-loader type="list-item-avatar-three-line" />
      </v-card>
    </template>

    <template v-else-if="ready">
      <v-card
        v-for="cls in classesList"
        :key="cls.class_id"
        class="rounded-xl elevation-2 mb-4"
      >
        <v-card-title class="d-flex align-center ga-2 py-3 flex-wrap">
          <v-checkbox-btn
            :model-value="allSelected(cls)"
            :indeterminate="someSelected(cls)"
            density="compact"
            :ripple="false"
            title="Tout sélectionner / déselectionner"
            @update:model-value="(v) => toggleAll(cls, v)"
          />
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
        </v-card-title>

        <v-divider />

        <v-list density="compact" class="py-0">
          <v-list-item v-for="s in cls.students" :key="s.student_id">
            <template #prepend>
              <v-checkbox-btn v-model="s.selected" density="compact" :ripple="false" class="mr-1" />
            </template>
            <v-list-item-title class="text-body-2">
              {{ s.firstname }} {{ s.lastname }}
            </v-list-item-title>
            <template #append>
              <v-btn icon size="x-small" variant="text" title="Changer de classe" @click="openMove(s, cls)">
                <v-icon>mdi-swap-horizontal</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" color="error" title="Supprimer l'élève" @click="openDelete(s, cls)">
                <v-icon>mdi-delete-outline</v-icon>
              </v-btn>
            </template>
          </v-list-item>
          <v-list-item v-if="cls.students.length === 0" class="text-medium-emphasis text-caption">
            Aucun élève inscrit
          </v-list-item>
        </v-list>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-check"
            :loading="cls.loading"
            :disabled="cls.reconduited || selectedCount(cls) === 0"
            @click="reconduire(cls)"
          >
            Valider ({{ selectedCount(cls) }})
          </v-btn>
        </v-card-actions>
      </v-card>

      <v-alert v-if="classesList.length === 0" type="info" variant="tonal" class="mb-4">
        Aucun élève inscrit pour l'année source.
      </v-alert>
    </template>

    <v-alert v-else-if="!fromYearId || !toYearId" type="info" variant="tonal" class="mb-4">
      Sélectionnez les deux années pour afficher les élèves.
    </v-alert>

    <!-- ── BLOC 2 : Nouveaux dossiers ──────────────────────── -->
    <v-divider class="my-6" />

    <div class="d-flex align-center ga-2 mb-3">
      <span class="text-subtitle-1 font-weight-bold">Nouveaux dossiers</span>
      <v-chip v-if="pendingDossiers.length" size="small" color="primary" variant="tonal">
        {{ pendingDossiers.length }}
      </v-chip>
    </div>

    <v-card class="rounded-xl elevation-2">
      <v-skeleton-loader v-if="loading.dossiers" type="list-item@3" />
      <template v-else>
        <v-list v-if="pendingDossiers.length" class="py-0">
          <v-list-item
            v-for="d in pendingDossiers"
            :key="d.id"
            :subtitle="d.type === 'inscription' ? 'Nouvelle inscription' : 'Réinscription'"
          >
            <v-list-item-title>{{ d.prenom_eleve }} {{ d.nom_eleve }}</v-list-item-title>
            <template #append>
              <v-btn
                icon
                size="small"
                variant="text"
                title="Télécharger le PDF"
                class="mr-1"
                @click="downloadPdf(d)"
              >
                <v-icon>mdi-file-pdf-box</v-icon>
              </v-btn>
              <v-btn
                size="small"
                color="primary"
                variant="tonal"
                :disabled="!toYearId"
                @click="openAccept(d)"
              >
                Accepter
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
        <v-card-text v-else class="text-medium-emphasis text-caption">
          Aucun dossier en attente.
        </v-card-text>
      </template>
    </v-card>

    <!-- Dialog : changer de classe -->
    <v-dialog v-model="moveDialog.show" max-width="440">
      <v-card class="rounded-xl">
        <v-card-title class="pt-4 px-4">Changer de classe</v-card-title>
        <v-card-text class="px-4 pb-2">
          <div class="text-body-2 mb-4">
            Inscrire <strong>{{ moveDialog.student?.firstname }} {{ moveDialog.student?.lastname }}</strong>
            dans quelle classe pour <strong>{{ toYearLabel }}</strong> ?
          </div>
          <v-select
            v-model="moveDialog.targetClassId"
            :items="allClasses"
            item-title="name"
            item-value="id"
            label="Classe cible *"
            variant="outlined"
            density="comfortable"
          />
          <v-checkbox
            v-model="moveDialog.updateCurrent"
            label="Mettre à jour la classe courante de l'élève"
            density="compact"
            hide-details
            class="mt-1"
          />
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="moveDialog.show = false">Annuler</v-btn>
          <v-btn color="primary" :loading="moveDialog.saving" :disabled="!moveDialog.targetClassId" @click="confirmMove">
            Inscrire
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog : supprimer un élève -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card class="rounded-xl">
        <v-card-title class="pt-4 px-4">Supprimer l'élève</v-card-title>
        <v-card-text class="px-4">
          Supprimer définitivement
          <strong>{{ deleteDialog.student?.firstname }} {{ deleteDialog.student?.lastname }}</strong> ?
          Cette action est irréversible.
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.show = false">Annuler</v-btn>
          <v-btn color="error" :loading="deleteDialog.loading" @click="confirmDelete">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog : accepter un dossier -->
    <v-dialog v-model="acceptDialog.show" max-width="440">
      <v-card class="rounded-xl">
        <v-card-title class="pt-4 px-4">Accepter le dossier</v-card-title>
        <v-card-text class="px-4 pb-2">
          <div class="text-body-2 mb-4">
            Inscrire <strong>{{ acceptDialog.dossier?.prenom_eleve }} {{ acceptDialog.dossier?.nom_eleve }}</strong>
            dans quelle classe pour <strong>{{ toYearLabel }}</strong> ?
          </div>
          <v-select
            v-model="acceptDialog.classId"
            :items="allClasses"
            item-title="name"
            item-value="id"
            label="Classe *"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="acceptDialog.show = false">Annuler</v-btn>
          <v-btn color="primary" :loading="acceptDialog.saving" :disabled="!acceptDialog.classId" @click="confirmAccept">
            Accepter
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

const loading = ref({ years: true, enrollments: false, dossiers: true })
const years        = ref([])
const allClasses   = ref([])
const fromYearId   = ref(null)
const toYearId     = ref(null)
const classesList  = ref([])
const pendingDossiers = ref([])
const snackbar = ref({ show: false, text: '', color: 'success' })

const moveDialog   = ref({ show: false, student: null, sourceClass: null, targetClassId: null, updateCurrent: false, saving: false })
const deleteDialog = ref({ show: false, student: null, cls: null, loading: false })
const acceptDialog = ref({ show: false, dossier: null, classId: null, saving: false })

// ─── Computed ───────────────────────────────────────────────
const ready = computed(
  () => fromYearId.value && toYearId.value && fromYearId.value !== toYearId.value && !loading.value.enrollments,
)
const toYearLabel = computed(() => years.value.find((y) => y.id === toYearId.value)?.label ?? '—')

function selectedCount(cls) { return cls.students.filter((s) => s.selected).length }
function allSelected(cls)   { return cls.students.length > 0 && cls.students.every((s) => s.selected) }
function someSelected(cls)  { return cls.students.some((s) => s.selected) && !allSelected(cls) }
function toggleAll(cls, v)  { cls.students.forEach((s) => { s.selected = v }) }

// ─── Chargement initial ─────────────────────────────────────
onMounted(async () => {
  const [resYears, resClasses, resDossiers] = await Promise.all([
    api.get('/api/admin/school-years'),
    api.get('/api/admin/classes'),
    api.get('/api/admin/dossiers', { params: { status: 'pending' } }),
  ])
  years.value         = Array.isArray(resYears.data)    ? resYears.data    : []
  allClasses.value    = Array.isArray(resClasses.data)  ? resClasses.data  : []
  pendingDossiers.value = Array.isArray(resDossiers.data) ? resDossiers.data : []
  loading.value.years   = false
  loading.value.dossiers = false

  const current = years.value.find((y) => y.is_current)
  if (current) {
    fromYearId.value = current.id
    const next = years.value.find((y) => y.id !== current.id && y.label > current.label)
    if (next) toYearId.value = next.id
  }
})

// ─── Chargement enrollments ─────────────────────────────────
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
    const toKeys   = new Set(toRows.map((r) => `${r.student_id}-${r.class_id}`))

    const map = new Map()
    for (const row of fromRows) {
      if (!map.has(row.class_id)) {
        map.set(row.class_id, { class_id: row.class_id, class_name: row.class_name, students: [], loading: false, reconduited: false })
      }
      map.get(row.class_id).students.push({ ...row, selected: true })
    }
    for (const cls of map.values()) {
      if (cls.students.length > 0) {
        cls.reconduited = cls.students.every((s) => toKeys.has(`${s.student_id}-${s.class_id}`))
      }
    }
    classesList.value = [...map.values()].sort((a, b) => a.class_name.localeCompare(b.class_name, 'fr'))
  } catch (e) {
    snackbar.value = { show: true, text: 'Erreur de chargement', color: 'error' }
  } finally {
    loading.value.enrollments = false
  }
})

// ─── Reconduire les élèves sélectionnés ─────────────────────
async function reconduire(cls) {
  const selected = cls.students.filter((s) => s.selected)
  if (!selected.length) return
  cls.loading = true
  let count = 0
  try {
    for (const s of selected) {
      try {
        await api.post('/api/admin/enrollments', { student_id: s.student_id, class_id: cls.class_id, school_year_id: toYearId.value })
        count++
      } catch (e) {
        if (e?.response?.status === 409) count++
        else throw e
      }
    }
    cls.reconduited = true
    snackbar.value = { show: true, text: `${cls.class_name} — ${count} élève${count > 1 ? 's' : ''} reconduit${count > 1 ? 's' : ''}`, color: 'success' }
  } catch (e) {
    snackbar.value = { show: true, text: 'Erreur lors de la reconduction', color: 'error' }
  } finally {
    cls.loading = false
  }
}

// ─── Changer de classe ───────────────────────────────────────
function openMove(student, cls) {
  moveDialog.value = { show: true, student, sourceClass: cls, targetClassId: null, updateCurrent: false, saving: false }
}
async function confirmMove() {
  moveDialog.value.saving = true
  try {
    await api.post('/api/admin/enrollments', { student_id: moveDialog.value.student.student_id, class_id: moveDialog.value.targetClassId, school_year_id: toYearId.value })
    if (moveDialog.value.updateCurrent) {
      await api.patch(`/api/students/${moveDialog.value.student.student_id}`, { class_id: moveDialog.value.targetClassId })
    }
    const name = allClasses.value.find((c) => c.id === moveDialog.value.targetClassId)?.name ?? '?'
    snackbar.value = { show: true, text: `${moveDialog.value.student.firstname} inscrit en ${name}`, color: 'success' }
    moveDialog.value.show = false
  } catch (e) {
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Erreur', color: 'error' }
  } finally {
    moveDialog.value.saving = false
  }
}

// ─── Supprimer un élève ──────────────────────────────────────
function openDelete(student, cls) {
  deleteDialog.value = { show: true, student, cls, loading: false }
}
async function confirmDelete() {
  deleteDialog.value.loading = true
  try {
    await api.delete(`/api/students/${deleteDialog.value.student.student_id}`)
    const cls = deleteDialog.value.cls
    cls.students = cls.students.filter((s) => s.student_id !== deleteDialog.value.student.student_id)
    snackbar.value = { show: true, text: `${deleteDialog.value.student.firstname} ${deleteDialog.value.student.lastname} supprimé`, color: 'success' }
    deleteDialog.value.show = false
  } catch (e) {
    snackbar.value = { show: true, text: 'Erreur lors de la suppression', color: 'error' }
  } finally {
    deleteDialog.value.loading = false
  }
}

// ─── Accepter un dossier ─────────────────────────────────────
function openAccept(dossier) {
  acceptDialog.value = { show: true, dossier, classId: null, saving: false }
}
async function confirmAccept() {
  acceptDialog.value.saving = true
  try {
    await api.post(`/api/admin/dossiers/${acceptDialog.value.dossier.id}/accept`, {
      class_id:       acceptDialog.value.classId,
      school_year_id: toYearId.value,
    })
    pendingDossiers.value = pendingDossiers.value.filter((d) => d.id !== acceptDialog.value.dossier.id)
    const name = allClasses.value.find((c) => c.id === acceptDialog.value.classId)?.name ?? '?'
    snackbar.value = {
      show: true,
      text: `${acceptDialog.value.dossier.prenom_eleve} ${acceptDialog.value.dossier.nom_eleve} ajouté en ${name}`,
      color: 'success',
    }
    acceptDialog.value.show = false
  } catch (e) {
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Erreur', color: 'error' }
  } finally {
    acceptDialog.value.saving = false
  }
}

// ─── Télécharger le PDF d'un dossier ────────────────────────
async function downloadPdf(dossier) {
  try {
    const res = await api.get(`/api/admin/dossiers/${dossier.id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a   = document.createElement('a')
    a.href = url
    a.download = `dossier-${dossier.type}-${dossier.prenom_eleve}-${dossier.nom_eleve}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    snackbar.value = { show: true, text: 'Erreur téléchargement PDF', color: 'error' }
  }
}
</script>