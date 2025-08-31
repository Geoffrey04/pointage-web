<template>
  <v-container>
    <!-- KPIs -->
    <v-row class="mb-4" align="stretch">
      <v-col cols="6" sm="3" v-for="kpi in kpis" :key="kpi.label">
        <v-card class="rounded-xl elevation-2 kpi-card">
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
          <v-card></v-card>
        </v-card>
      </v-col>
    </v-row>

    <!-- Classes -->
    <v-row>
      <v-col cols="12" md="8">
        <v-card class="rounded-xl elevation-2">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-1">Classes</span>
            <div class="d-flex ga-2">
              <v-btn
                size="small"
                variant="tonal"
                color="primary"
                @click="openCreate"
                prepend-icon="mdi-account-multiple-outline"
              >
                Nouvelle classe
              </v-btn>
            </div>
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
                <span class="linkish" @click="goToClass(item.id)">{{ item.name }}</span>
              </template>

              <template #item.owner_id="{ item }">
                <span class="text-medium-emphasis">{{ ownerName(item.owner_id) }}</span>
              </template>

              <template #item.actions="{ item }">
                <!-- ⬇️ Nouveau bouton “gérer les profs” par ligne -->
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

    <!-- Dialog Création / Édition -->
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
        <!-- En-tête compacte avec sélecteur de classe à droite -->
        <v-toolbar flat density="comfortable">
          <v-toolbar-title class="text-subtitle-1 font-weight-600"> Gestionnaires </v-toolbar-title>
          <v-spacer />
          <v-select
            v-model="managersDialog.classId"
            :items="managersDialog.classes"
            item-title="name"
            item-value="id"
            label="Classe"
            density="comfortable"
            variant="outlined"
            hide-details
            style="max-width: 260px"
          />
        </v-toolbar>

        <v-divider />

        <v-card-text>
          <v-skeleton-loader v-if="managersDialog.loading" type="list-item@3" />

          <template v-else>
            <!-- Titre classe courant -->
            <div class="text-h6 mb-2">{{ managersDialog.className }}</div>

            <!-- Profs actuels -->
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

            <!-- Ajout co-prof -->
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
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/* Helpers */
const authHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/* Loading flags */
const loading = ref({ kpis: true, classes: true, profs: true })
const saving = ref(false)
const deleting = ref(false)

/* KPIs */
const kpis = ref([
  { label: 'Professeurs', value: 0, icon: 'mdi-account-group', color: 'primary' },
  { label: 'Élèves', value: 0, icon: 'mdi-account-school', color: 'teal' },
  { label: 'Classes', value: 0, icon: 'mdi-google-classroom', color: 'indigo' },
  { label: 'Cours', value: 0, icon: 'mdi-calendar-multiple', color: 'orange' },
])

/* Data */
const classes = ref([])
const profs = ref([])

/* Table headers (sans ID, avec actions) */
const classHeaders = [
  { title: 'Nom', value: 'name' },
  { title: 'Description', value: 'description' },
  { title: 'Prof responsable', value: 'owner_id', width: 180 },
  { title: '', value: 'actions', width: 90, sortable: false },
]

/* Snackbar */
const snackbar = ref({ show: false, text: '', color: 'success' })

/* Form dialog */
const dialog = ref({ open: false, mode: 'create', id: null })
const formRef = ref(null)
const formValid = ref(false)
const form = ref({ name: '', description: '', owner_id: null })
const rules = { required: (v) => !!(v && String(v).trim()) || 'Requis' }

/* Confirm delete */
const confirm = ref({ open: false, item: null })

// état du dialog (JS pur)
const managersDialog = ref({
  show: false,
  classId: null,
  className: '',
  loading: false,
  classes: [],
  managers: [], // [{ id, username, role, is_owner }]
  allProfs: [], // [{ id, username }]
  selectedProfId: null,
})

// ouvre le dialog et charge les données
async function openManagersDialog(cls) {
  try {
    managersDialog.value.show = true
    managersDialog.value.loading = true

    // 1) Si on a reçu la classe → on fixe l'ID + libellé
    if (cls && cls.id) {
      managersDialog.value.classId = cls.id
      managersDialog.value.className = cls.name || ''
    }

    // 2) Si on n'a pas encore de classe (ou ouverture globale),
    // on charge la liste pour permettre la sélection
    if (!managersDialog.value.classId) {
      const resClasses = await axios.get(`${API}/api/admin/classes`, { headers: authHeaders() })
      managersDialog.value.classes = Array.isArray(resClasses.data) ? resClasses.data : []
      if (managersDialog.value.classes.length) {
        managersDialog.value.classId = managersDialog.value.classes[0].id
        managersDialog.value.className = managersDialog.value.classes[0].name
      }
    }

    // 3) Charger les profs disponibles (pour le <v-select>)
    const resProfs = await axios.get(`${API}/api/admin/profs`, { headers: authHeaders() })
    managersDialog.value.allProfs = Array.isArray(resProfs.data) ? resProfs.data : []

    // 4) Charger les managers de la classe courante
    if (managersDialog.value.classId) {
      const resMgrs = await axios.get(`${API}/api/admin/class-users`, {
        headers: authHeaders(),
        params: { class_id: managersDialog.value.classId },
      })
      managersDialog.value.managers = Array.isArray(resMgrs.data) ? resMgrs.data : []
    }
  } catch (e) {
    console.error('openManagersDialog error:', e)
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
      const res = await axios.get(`${API}/api/admin/class-users`, {
        headers: authHeaders(),
        params: { class_id: cid },
      })
      managersDialog.value.managers = Array.isArray(res.data) ? res.data : []

      // synchronise le libellé si tu as la liste des classes chargée
      const found = (managersDialog.value.classes || []).find((c) => c.id === cid)
      managersDialog.value.className = found ? found.name : managersDialog.value.className
    } catch (e) {
      console.error('reload managers on class change', e)
    } finally {
      managersDialog.value.loading = false
    }
  },
)

async function addCoProf() {
  const cid = managersDialog.value.classId
  const uid = managersDialog.value.selectedProfId
  if (!cid || !uid) return
  await axios.post(
    `${API}/api/admin/class-users`,
    { class_id: cid, user_id: uid },
    { headers: authHeaders() },
  )
  await openManagersDialog({ id: cid, name: managersDialog.value.className })
}

async function removeCoProf(userId) {
  const cid = managersDialog.value.classId
  if (!cid || !userId) return

  try {
    managersDialog.value.loading = true
    await axios.delete(`${API}/api/admin/class-users`, {
      headers: authHeaders(),
      data: { class_id: cid, user_id: userId },
    })
    // Recharge le contenu du dialog (managers + liste des profs)
    await openManagersDialog({ id: cid, name: managersDialog.value.className })
  } catch (e) {
    console.error('removeCoProf error:', e)
  } finally {
    managersDialog.value.loading = false
  }
}

/* Utils */
function ownerName(id) {
  if (id == null) return '—'
  const u = profs.value.find((p) => Number(p.id) === Number(id))
  return u ? u.username : '—'
}
function openCreate() {
  dialog.value = { open: true, mode: 'create', id: null }
  form.value = { name: '', description: '', owner_id: null }
}
function openEdit(item) {
  dialog.value = { open: true, mode: 'edit', id: item.id }
  form.value = { name: item.name, description: item.description, owner_id: item.owner_id ?? null }
}
function confirmDelete(item) {
  confirm.value = { open: true, item }
}

/* API calls */
async function loadKPIs() {
  try {
    const { data } = await axios.get(`${API}/api/admin/stats`, { headers: authHeaders() })
    kpis.value[0].value = Number(data.users || 0)
    kpis.value[1].value = Number(data.students || 0)
    kpis.value[2].value = Number(data.classes || 0)
    kpis.value[3].value = Number(data.sessions || 0)
  } finally {
    loading.value.kpis = false
  }
}
async function loadProfs() {
  try {
    const { data } = await axios.get(`${API}/api/admin/profs`, { headers: authHeaders() })
    profs.value = Array.isArray(data) ? data : []
  } finally {
    loading.value.profs = false
  }
}
async function loadClasses() {
  try {
    const { data } = await axios.get(`${API}/api/admin/classes`, { headers: authHeaders() })
    classes.value = Array.isArray(data) ? data : []
  } finally {
    loading.value.classes = false
  }
}

async function saveClass() {
  const res = await formRef.value?.validate()
  const valid = typeof res === 'object' ? res.valid : !!res
  if (!valid) return

  saving.value = true
  const payload = { ...form.value }
  try {
    if (dialog.value.mode === 'create') {
      await axios.post(`${API}/api/admin/classes`, payload, { headers: authHeaders() })
      snackbar.value = { show: true, text: 'Classe créée', color: 'success' }
    } else {
      await axios.patch(`${API}/api/admin/classes/${dialog.value.id}`, payload, {
        headers: authHeaders(),
      })
      snackbar.value = { show: true, text: 'Classe mise à jour', color: 'success' }
    }
    dialog.value.open = false
    await loadClasses()
  } catch (e) {
    console.error('saveClass', e)
    snackbar.value = {
      show: true,
      text: e?.response?.data?.message || 'Erreur sauvegarde',
      color: 'error',
    }
  } finally {
    saving.value = false
  }
}

async function deleteClass() {
  if (!confirm.value.item) return
  deleting.value = true
  try {
    await axios.delete(`${API}/api/admin/classes/${confirm.value.item.id}`, {
      headers: authHeaders(),
    })
    confirm.value.open = false
    snackbar.value = { show: true, text: 'Classe supprimée', color: 'success' }
    await loadClasses()
  } catch (e) {
    console.error('deleteClass', e)
    snackbar.value = {
      show: true,
      text: e?.response?.data?.message || 'Erreur suppression',
      color: 'error',
    }
  } finally {
    deleting.value = false
  }
}

/* Navigation vers le tableau de présence d’une classe */
function goToClass(id) {
  // Adapte le nom de route si besoin (ex: 'DashboardView' ou path `/dashboard/${id}`)
  router.push({ name: 'DashboardView', params: { id: String(id) } })
}

/* Init */
onMounted(async () => {
  try {
    await Promise.all([loadKPIs(), loadProfs(), loadClasses()])
  } catch (e) {
    console.error('Admin init', e)
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
    grid-template-columns: 1fr; /* le bouton passe sous le select */
  }
}

.kpi-card {
  min-height: 86px;
}
.linkish {
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
