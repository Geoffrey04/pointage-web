<template>
  <v-container>
    <!-- KPIs -->
    <v-row class="mb-4" align="stretch">
      <v-col cols="6" sm="3" v-for="kpi in kpis" :key="kpi.label">
        <v-card
          class="rounded-xl elevation-2 kpi-card"
          style="cursor: pointer"
          @click="openKpiModal(kpi)"
        >
          <v-card-text class="d-flex align-center ga-3">
            <v-avatar size="42" :color="kpi.color" variant="tonal">
              <v-icon :icon="kpi.icon" />
            </v-avatar>
            <div>
              <div class="text-h6">
                <v-skeleton-loader type="text" v-if="loading.kpis" width="48" />
                <span v-else>{{ kpi.value }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">{{ kpi.label }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Raccourcis admin -->
    <div class="d-flex justify-end mb-2">
      <v-btn
        variant="tonal"
        size="small"
        prepend-icon="mdi-swap-horizontal"
        :to="{ name: 'AdminTransition' }"
      >
        Transition de fin d'année
      </v-btn>
    </div>

    <!-- Tabs: Classes / Dossiers -->
    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="classes">
        <v-icon start>mdi-google-classroom</v-icon>
        Classes
      </v-tab>
      <v-tab value="dossiers">
        <v-icon start>mdi-file-document-multiple-outline</v-icon>
        Dossiers
        <v-chip v-if="dossiers.length" size="x-small" color="primary" variant="tonal" class="ml-2">
          {{ dossiers.length }}
        </v-chip>
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">
      <!-- ── Onglet Classes ── -->
      <v-tabs-window-item value="classes">
        <v-row>
          <v-col cols="12" md="8">
            <v-card class="rounded-xl elevation-2">
              <v-card-title class="d-flex align-center justify-space-between">
                <span class="text-subtitle-1">Classes</span>
                <v-btn
                  size="small"
                  variant="tonal"
                  color="primary"
                  @click="openCreate"
                  prepend-icon="mdi-account-multiple-outline"
                >
                  Nouvelle classe
                </v-btn>
              </v-card-title>

              <v-divider />

              <v-card-text>
                <v-skeleton-loader v-if="loading.classes" type="table" class="rounded-lg" />
                <v-data-table
                  v-else
                  :headers="classHeaders"
                  :items="classes"
                  item-key="id"
                  density="comfortable"
                  class="rounded-lg"
                >
                  <template #item.name="{ item }">
                    <RouterLink
                      :to="{ name: 'DashboardView', params: { id: String(item.id) } }"
                      class="linkish"
                    >
                      {{ item.name }}
                    </RouterLink>
                  </template>
                  <template #item.owner_id="{ item }">
                    <span class="text-medium-emphasis">{{ ownerName(item.owner_id) }}</span>
                  </template>
                  <template #item.description="{ item }">
                    <span>{{ item.description || '—' }}</span>
                  </template>
                  <template #item.actions="{ item }">
                    <v-btn
                      icon
                      variant="text"
                      :title="`Gérer les profs de ${item.name}`"
                      @click="openManagersDialog(item)"
                    >
                      <v-icon>mdi-account-multiple-outline</v-icon>
                    </v-btn>
                    <v-btn icon variant="text" @click="openEdit(item)" :title="`Éditer ${item.name}`">
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      variant="text"
                      color="red"
                      @click="confirmDelete(item)"
                      :title="`Supprimer ${item.name}`"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                  <template #no-data>
                    <v-alert type="info" variant="tonal">Aucune classe.</v-alert>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- ── Onglet Dossiers ── -->
      <v-tabs-window-item value="dossiers">
        <v-card class="rounded-xl elevation-2">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-1">Dossiers reçus</span>
            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-refresh"
              @click="loadDossiers"
              :loading="loading.dossiers"
            >
              Actualiser
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <v-skeleton-loader v-if="loading.dossiers" type="table" class="rounded-lg" />
            <v-data-table
              v-else
              :headers="dossierHeaders"
              :items="dossiers"
              item-key="id"
              density="comfortable"
              class="rounded-lg"
              :sort-by="[{ key: 'submitted_at', order: 'desc' }]"
            >
              <template #item.type="{ item }">
                <v-chip
                  size="small"
                  :color="item.type === 'inscription' ? 'teal' : 'indigo'"
                  variant="tonal"
                >
                  {{ item.type === 'inscription' ? 'Inscription' : 'Réinscription' }}
                </v-chip>
              </template>
              <template #item.submitted_at="{ item }">
                {{ formatDate(item.submitted_at) }}
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  icon
                  variant="text"
                  color="primary"
                  title="Télécharger le PDF"
                  :loading="downloadingId === item.id"
                  @click="downloadPdf(item)"
                >
                  <v-icon>mdi-file-pdf-box</v-icon>
                </v-btn>
              </template>
              <template #no-data>
                <v-alert type="info" variant="tonal">Aucun dossier reçu pour l'instant.</v-alert>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- ─── Modal Année scolaire ─────────────────────────────── -->
    <v-dialog v-model="schoolYearModal.show" max-width="420">
      <v-card class="rounded-xl">

        <!-- Vue : année en cours -->
        <template v-if="schoolYearModal.step === 'view'">
          <v-card-title class="d-flex align-center justify-space-between pt-4 px-4">
            <span>Année en cours</span>
            <v-btn icon variant="text" @click="schoolYearModal.show = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text class="px-4 pb-4">
            <v-card variant="tonal" color="primary" class="rounded-xl mb-4 pa-5 text-center">
              <div class="text-h4 font-weight-bold mb-1">{{ currentYear?.label || '—' }}</div>
              <div class="text-caption text-medium-emphasis" v-if="currentYear">
                {{ formatDateShort(currentYear.start_date) }} → {{ formatDateShort(currentYear.end_date) }}
              </div>
              <v-chip size="small" color="success" variant="tonal" class="mt-2">
                <v-icon start size="x-small">mdi-circle</v-icon>
                En cours
              </v-chip>
            </v-card>

            <v-btn
              block
              variant="tonal"
              prepend-icon="mdi-format-list-bulleted"
              class="mb-3"
              @click="openYearList"
            >
              Voir toutes les années
            </v-btn>

            <v-btn block color="primary" prepend-icon="mdi-plus" @click="goToCreate">
              Créer {{ suggestNextYear() }}
            </v-btn>
          </v-card-text>
        </template>

        <!-- Vue : liste des années -->
        <template v-else-if="schoolYearModal.step === 'list'">
          <v-card-title class="d-flex align-center pt-4 px-4">
            <v-btn icon variant="text" size="small" @click="schoolYearModal.step = 'view'" class="mr-2">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <span>Toutes les années</span>
            <v-spacer />
            <v-btn icon variant="text" @click="schoolYearModal.show = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text class="px-2 pb-4">
            <v-skeleton-loader v-if="schoolYearModal.loading" type="list-item@3" />
            <v-list v-else lines="two">
              <v-list-item
                v-for="year in schoolYears"
                :key="year.id"
                :subtitle="`${formatDateShort(year.start_date)} → ${formatDateShort(year.end_date)}`"
              >
                <template #title>
                  <span class="font-weight-medium">{{ year.label }}</span>
                  <v-chip v-if="year.is_current" size="x-small" color="success" variant="tonal" class="ml-2">
                    En cours
                  </v-chip>
                </template>
                <template #append>
                  <v-btn
                    v-if="!year.is_current"
                    size="small"
                    variant="tonal"
                    @click="setCurrentYear(year.id)"
                  >
                    Activer
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </template>

        <!-- Vue : formulaire création -->
        <template v-else-if="schoolYearModal.step === 'create'">
          <v-card-title class="d-flex align-center pt-4 px-4">
            <v-btn icon variant="text" size="small" @click="schoolYearModal.step = 'view'" class="mr-2">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <span>Nouvelle année scolaire</span>
            <v-spacer />
            <v-btn icon variant="text" @click="schoolYearModal.show = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text class="px-4 pb-2">
            <v-text-field
              v-model="yearForm.label"
              label="Label *"
              hint="Format : 2026-2027"
              persistent-hint
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model="yearForm.start_date"
              label="Date de début *"
              type="date"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model="yearForm.end_date"
              label="Date de fin *"
              type="date"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-alert type="info" variant="tonal" density="compact" class="text-caption">
              Les vacances Zone B et jours fériés seront pré-marqués automatiquement.
            </v-alert>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-spacer />
            <v-btn variant="text" @click="schoolYearModal.step = 'view'">Annuler</v-btn>
            <v-btn
              color="primary"
              :loading="schoolYearModal.creating"
              :disabled="!yearForm.label || !yearForm.start_date || !yearForm.end_date"
              @click="createSchoolYear"
            >
              Créer l'année
            </v-btn>
          </v-card-actions>
        </template>
      </v-card>
    </v-dialog>

    <!-- ─── Modal Professeurs ─────────────────────────────────── -->
    <v-dialog v-model="profsModal.show" max-width="420">
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-space-between pt-4 px-4">
          <span>Professeurs ({{ profs.length }})</span>
          <v-btn icon variant="text" @click="profsModal.show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="px-2 pb-4">
          <v-list density="compact">
            <v-list-item
              v-for="prof in profs"
              :key="prof.id"
              :title="prof.username"
              prepend-icon="mdi-account"
            />
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ─── Modal Élèves ──────────────────────────────────────── -->
    <v-dialog v-model="elevesModal.show" max-width="480">
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-space-between pt-4 px-4">
          <span>Élèves ({{ elevesModal.items.length }})</span>
          <v-btn icon variant="text" @click="elevesModal.show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="px-2 pb-4">
          <v-skeleton-loader v-if="elevesModal.loading" type="list-item@6" />
          <v-list v-else density="compact">
            <v-list-item
              v-for="s in elevesModal.items"
              :key="s.id"
              :title="`${s.firstname} ${s.lastname}`"
              :subtitle="s.class_name || '—'"
              prepend-icon="mdi-account-school"
            />
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ─── Modal Classes ─────────────────────────────────────── -->
    <v-dialog v-model="classesModal.show" max-width="480">
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-space-between pt-4 px-4">
          <span>Classes ({{ classes.length }})</span>
          <v-btn icon variant="text" @click="classesModal.show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="px-2 pb-4">
          <v-list density="compact">
            <v-list-item
              v-for="cls in classes"
              :key="cls.id"
              :title="cls.name"
              :subtitle="ownerName(cls.owner_id)"
              prepend-icon="mdi-google-classroom"
            />
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog Création / Édition classe -->
    <v-dialog v-model="dialog.open" max-width="560">
      <v-card>
        <v-card-title>
          {{ dialog.mode === 'create' ? 'Nouvelle classe' : 'Éditer la classe' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="form.name"
              label="Nom *"
              :rules="[rules.required]"
              autocomplete="off"
            />
            <v-textarea v-model="form.description" label="Description" auto-grow rows="2" />
            <v-select
              v-model="form.owner_id"
              :items="profs"
              item-title="username"
              item-value="id"
              label="Prof responsable (optionnel)"
              clearable
              :loading="loading.profs"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog.open = false">Annuler</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!formValid || saving"
            @click="saveClass"
          >
            {{ dialog.mode === 'create' ? 'Créer' : 'Enregistrer' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm suppression -->
    <v-dialog v-model="confirm.open" max-width="420">
      <v-card>
        <v-card-title>Supprimer la classe</v-card-title>
        <v-card-text>
          Confirmer la suppression de <strong>{{ confirm.item?.name }}</strong> ?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirm.open = false">Annuler</v-btn>
          <v-btn color="red" :loading="deleting" @click="deleteClass">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog gestion des profs -->
    <v-dialog v-model="managersDialog.show" max-width="640">
      <v-card>
        <v-card-title class="text-subtitle-1 font-weight-600">
          Gestionnaires — {{ managersDialog.className }}
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-skeleton-loader v-if="managersDialog.loading" type="list-item@3" />

          <template v-else>
            <div class="text-subtitle-2 mb-2">Profs actuels</div>
            <div class="chips-wrap mb-4">
              <v-chip
                v-for="m in managersDialog.managers"
                :key="m.id"
                :color="m.is_owner ? 'primary' : undefined"
                variant="tonal"
                :prepend-icon="m.is_owner ? 'mdi-crown' : 'mdi-account'"
                :closable="!m.is_owner"
                @click:close="removeCoProf(m.id)"
              >
                {{ m.username }} <span v-if="m.is_owner" class="ml-1">(owner)</span>
              </v-chip>
            </div>

            <v-divider class="my-4" />

            <div class="text-subtitle-2 mb-2">Ajouter un co-prof</div>
            <div class="add-grid">
              <v-select
                v-model="managersDialog.selectedProfId"
                :items="managersDialog.allProfs"
                item-title="username"
                item-value="id"
                label="Choisir un prof"
                density="comfortable"
                variant="outlined"
                :loading="managersDialog.loading"
              />
              <v-btn color="primary" :disabled="!managersDialog.selectedProfId" @click="addCoProf">
                Ajouter
              </v-btn>
            </div>
          </template>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="managersDialog.show = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="1600">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { api } from '@/stores/user'

const activeTab = ref('classes')
const loading = ref({ kpis: true, classes: true, profs: true, dossiers: false })
const saving = ref(false)
const deleting = ref(false)
const downloadingId = ref(null)

const kpis = ref([
  { label: 'Professeurs',    value: 0,   icon: 'mdi-account-group',    color: 'primary', action: 'profs' },
  { label: 'Élèves',         value: 0,   icon: 'mdi-account-school',   color: 'teal',    action: 'eleves' },
  { label: 'Classes',        value: 0,   icon: 'mdi-google-classroom', color: 'indigo',  action: 'classes' },
  { label: 'Année en cours', value: '—', icon: 'mdi-calendar-star',    color: 'orange',  action: 'schoolYear' },
])

const classes  = ref([])
const profs    = ref([])
const dossiers = ref([])

// ─── État année scolaire ────────────────────────────────────
const currentYear     = ref(null)
const schoolYears     = ref([])
const schoolYearModal = ref({ show: false, step: 'view', loading: false, creating: false })
const yearForm        = ref({ label: '', start_date: '', end_date: '' })

// ─── État modals KPI ────────────────────────────────────────
const profsModal  = ref({ show: false })
const elevesModal = ref({ show: false, loading: false, items: [] })
const classesModal = ref({ show: false })

// ─── Handlers ouverture modals ──────────────────────────────
async function openKpiModal(kpi) {
  if (kpi.action === 'schoolYear') {
    schoolYearModal.value = { show: true, step: 'view', loading: false, creating: false }
  } else if (kpi.action === 'profs') {
    profsModal.value.show = true
  } else if (kpi.action === 'eleves') {
    elevesModal.value.show = true
    await loadAllStudents()
  } else if (kpi.action === 'classes') {
    classesModal.value.show = true
  }
}

// ─── Années scolaires ───────────────────────────────────────
function suggestNextYear() {
  if (currentYear.value) {
    const [y1, y2] = currentYear.value.label.split('-').map(Number)
    return `${y1 + 1}-${y2 + 1}`
  }
  const y = new Date().getFullYear()
  return `${y}-${y + 1}`
}

function goToCreate() {
  const label = suggestNextYear()
  const y1 = parseInt(label.split('-')[0])
  yearForm.value = {
    label,
    start_date: `${y1}-09-01`,
    end_date:   `${y1 + 1}-06-30`,
  }
  schoolYearModal.value.step = 'create'
}

async function openYearList() {
  schoolYearModal.value.step = 'list'
  schoolYearModal.value.loading = true
  try {
    const { data } = await api.get('/api/admin/school-years')
    schoolYears.value = Array.isArray(data) ? data : []
  } finally {
    schoolYearModal.value.loading = false
  }
}

async function createSchoolYear() {
  schoolYearModal.value.creating = true
  try {
    const { data } = await api.post('/api/admin/school-years', yearForm.value)
    schoolYears.value.unshift(data)
    currentYear.value = data.is_current ? data : currentYear.value
    snackbar.value = {
      show: true,
      text: `Année ${data.label} créée — ${data.sessions_generated} séances générées`,
      color: 'success',
    }
    schoolYearModal.value.step = 'view'
  } catch (e) {
    snackbar.value = {
      show: true,
      text: e?.response?.data?.message || 'Erreur lors de la création',
      color: 'error',
    }
  } finally {
    schoolYearModal.value.creating = false
  }
}

async function setCurrentYear(id) {
  try {
    const { data } = await api.patch(`/api/admin/school-years/${id}/current`)
    schoolYears.value = schoolYears.value.map((y) => ({ ...y, is_current: y.id === id }))
    currentYear.value = data
    kpis.value[3].value = data.label
    snackbar.value = { show: true, text: `Année ${data.label} activée`, color: 'success' }
  } catch (e) {
    snackbar.value = { show: true, text: 'Erreur', color: 'error' }
  }
}

async function loadCurrentYear() {
  try {
    const { data } = await api.get('/api/current-school-year')
    currentYear.value = data
    kpis.value[3].value = data.label
  } catch {
    kpis.value[3].value = '—'
  }
}

// ─── Élèves (liste admin) ───────────────────────────────────
async function loadAllStudents() {
  elevesModal.value.loading = true
  try {
    const { data } = await api.get('/api/admin/students')
    elevesModal.value.items = Array.isArray(data) ? data : []
  } finally {
    elevesModal.value.loading = false
  }
}

// ─── Formatage dates ────────────────────────────────────────
function formatDateShort(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ─── Reste du code existant ─────────────────────────────────
const classHeaders = [
  { title: 'Nom', key: 'name' },
  { title: 'Description', key: 'description', value: 'description' },
  { title: 'Prof responsable', key: 'owner_id', width: 180 },
  { title: '', key: 'actions', value: 'actions', width: 90, sortable: false },
]

const dossierHeaders = [
  { title: 'Type', key: 'type', width: 140 },
  { title: 'Nom', key: 'nom_eleve', width: 140 },
  { title: 'Prénom', key: 'prenom_eleve', width: 140 },
  { title: 'Reçu le', key: 'submitted_at' },
  { title: '', key: 'actions', width: 60, sortable: false },
]

const snackbar = ref({ show: false, text: '', color: 'success' })
const dialog   = ref({ open: false, mode: 'create', id: null })
const formRef  = ref(null)
const formValid = ref(false)
const form     = ref({ name: '', description: '', owner_id: null })
const rules    = { required: (v) => !!(v && String(v).trim()) || 'Requis' }
const confirm  = ref({ open: false, item: null })

const managersDialog = ref({
  show: false, classId: null, className: '', loading: false,
  managers: [], allProfs: [], selectedProfId: null,
})

async function openManagersDialog(cls) {
  try {
    managersDialog.value.show = true
    managersDialog.value.loading = true
    managersDialog.value.classId = cls.id
    managersDialog.value.className = cls.name || ''
    const [resProfs, resMgrs] = await Promise.all([
      api.get('/api/admin/profs'),
      api.get('/api/admin/class-users', { params: { class_id: cls.id } }),
    ])
    managersDialog.value.allProfs  = Array.isArray(resProfs.data)  ? resProfs.data  : []
    managersDialog.value.managers  = Array.isArray(resMgrs.data)   ? resMgrs.data   : []
  } catch (e) {
    console.error('openManagersDialog :', e)
  } finally {
    managersDialog.value.loading = false
  }
}

watch(
  () => managersDialog.value.classId,
  async (cid) => {
    if (!cid) return
    try {
      managersDialog.value.loading = true
      const res = await api.get('/api/admin/class-users', { params: { class_id: cid } })
      managersDialog.value.managers = Array.isArray(res.data) ? res.data : []
    } catch (e) {
      console.error('rechargement managers :', e)
    } finally {
      managersDialog.value.loading = false
    }
  },
)

async function addCoProf() {
  const cid = managersDialog.value.classId
  const uid = managersDialog.value.selectedProfId
  if (!cid || !uid) return
  try {
    await api.post('/api/admin/class-users', { class_id: cid, user_id: uid })
    managersDialog.value.selectedProfId = null
    managersDialog.value.show = false
    snackbar.value = { show: true, text: 'Co-prof ajouté', color: 'success' }
  } catch (e) {
    console.error('addCoProf :', e)
    snackbar.value = { show: true, text: "Erreur lors de l'ajout", color: 'error' }
  }
}

async function removeCoProf(userId) {
  const cid = managersDialog.value.classId
  if (!cid || !userId) return
  try {
    managersDialog.value.loading = true
    await api.delete('/api/admin/class-users', { data: { class_id: cid, user_id: userId } })
    const resMgrs = await api.get('/api/admin/class-users', { params: { class_id: cid } })
    managersDialog.value.managers = Array.isArray(resMgrs.data) ? resMgrs.data : []
  } catch (e) {
    console.error('removeCoProf :', e)
  } finally {
    managersDialog.value.loading = false
  }
}

function ownerName(id) {
  if (id == null) return '—'
  const u = profs.value.find((p) => Number(p.id) === Number(id))
  return u ? u.username : '—'
}

function openCreate() {
  dialog.value = { open: true, mode: 'create', id: null }
  form.value   = { name: '', description: '', owner_id: null }
}
function openEdit(item) {
  dialog.value = { open: true, mode: 'edit', id: item.id }
  form.value   = { name: item.name, description: item.description, owner_id: item.owner_id ?? null }
}
function confirmDelete(item) {
  confirm.value = { open: true, item }
}

async function loadKPIs() {
  try {
    const { data } = await api.get('/api/admin/stats')
    kpis.value[0].value = Number(data.users    || 0)
    kpis.value[1].value = Number(data.students || 0)
    kpis.value[2].value = Number(data.classes  || 0)
  } finally {
    loading.value.kpis = false
  }
}

async function loadProfs() {
  try {
    const { data } = await api.get('/api/admin/profs')
    profs.value = Array.isArray(data) ? data : []
  } finally {
    loading.value.profs = false
  }
}

async function loadClasses() {
  try {
    const { data } = await api.get('/api/admin/classes')
    classes.value = Array.isArray(data) ? data : []
  } finally {
    loading.value.classes = false
  }
}

async function loadDossiers() {
  loading.value.dossiers = true
  try {
    const { data } = await api.get('/api/admin/dossiers')
    dossiers.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('loadDossiers :', e)
  } finally {
    loading.value.dossiers = false
  }
}

async function downloadPdf(item) {
  downloadingId.value = item.id
  try {
    const { data } = await api.get(`/api/admin/dossiers/${item.id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `dossier-${item.type}-${item.prenom_eleve}-${item.nom_eleve}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('downloadPdf :', e)
    snackbar.value = { show: true, text: 'Erreur lors du téléchargement', color: 'error' }
  } finally {
    downloadingId.value = null
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

async function saveClass() {
  const res   = await formRef.value?.validate()
  const valid = typeof res === 'object' ? res.valid : !!res
  if (!valid) return
  saving.value = true
  try {
    if (dialog.value.mode === 'create') {
      await api.post('/api/admin/classes', { ...form.value })
      snackbar.value = { show: true, text: 'Classe créée', color: 'success' }
    } else {
      await api.patch(`/api/admin/classes/${dialog.value.id}`, { ...form.value })
      snackbar.value = { show: true, text: 'Classe mise à jour', color: 'success' }
    }
    dialog.value.open = false
    await loadClasses()
  } catch (e) {
    console.error('saveClass :', e)
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Erreur sauvegarde', color: 'error' }
  } finally {
    saving.value = false
  }
}

async function deleteClass() {
  if (!confirm.value.item) return
  deleting.value = true
  try {
    await api.delete(`/api/admin/classes/${confirm.value.item.id}`)
    confirm.value.open = false
    snackbar.value = { show: true, text: 'Classe supprimée', color: 'success' }
    await loadClasses()
  } catch (e) {
    console.error('deleteClass :', e)
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Erreur suppression', color: 'error' }
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadKPIs(), loadProfs(), loadClasses(), loadDossiers(), loadCurrentYear()])
  } catch (e) {
    console.error('Admin init :', e)
    snackbar.value = { show: true, text: 'Erreur de chargement', color: 'error' }
  }
})
</script>

<style scoped>
.chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.add-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}

@media (max-width: 600px) {
  .add-grid {
    grid-template-columns: 1fr;
  }
}

.kpi-card {
  min-height: 86px;
  transition: box-shadow 0.15s ease;
}

.kpi-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
}

.linkish {
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>