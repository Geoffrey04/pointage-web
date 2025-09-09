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
                <span class="linkish" @click="goToClass(item.raw.id)">{{ item.raw.name }}</span>
              </template>

              <template #item.owner_id="{ item }">
                <span class="text-medium-emphasis">{{ ownerName(item.raw.owner_id) }}</span>
              </template>

              <template #item.description="{ item }">
                <span>{{ item.raw.description || '—' }}</span>
              </template>

              <template #item.actions="{ item }">
                <!-- Gérer les profs -->
                <v-btn
                  icon
                  variant="text"
                  :title="`Gérer les profs de ${item.raw.name}`"
                  @click="openManagersDialog(item)"
                >
                  <v-icon>mdi-account-multiple-outline</v-icon>
                </v-btn>

                <v-btn icon variant="text" @click="openEdit(item.raw)" :title="`Éditer ${item.raw.name}`">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  color="red"
                  @click="confirmDelete(item.raw)"
                  :title="`Supprimer ${item.raw.name}`"
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
        <!-- ✅ Titre simple sans sélecteur de classe -->
        <v-card-title class="text-subtitle-1 font-weight-600">
          Gestionnaires — {{ managersDialog.className }}
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-skeleton-loader v-if="managersDialog.loading" type="list-item@3" />

          <template v-else>
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
  { title: 'Nom', key: 'name' },
  { title: 'Description', key: 'description', value:'description'},
  { title: 'Prof responsable', key: 'owner_username', value: 'owner_username', width: 180 },
  { title: '', key: 'actions', value: 'actions', width: 90, sortable: false },
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

/* Dialog gestion des profs */
const managersDialog = ref({
  show: false,
  classId: null,
  className: '',
  loading: false,
  classes: [], // conservé si besoin ultérieur, mais plus affiché
  managers: [], // [{ id, username, role, is_owner }]
  allProfs: [], // [{ id, username }]
  selectedProfId: null,
})

async function openManagersDialog(cls) {
  try {
    managersDialog.value.show = true
    managersDialog.value.loading = true

    // On reçoit toujours la classe depuis le bouton de la ligne
    managersDialog.value.classId = cls.id
    managersDialog.value.className = cls.name || ''

    // Profs disponibles
    const resProfs = await axios.get(`${API}/api/admin/profs`, { headers: authHeaders() })
    managersDialog.value.allProfs = Array.isArray(resProfs.data) ? resProfs.data : []

    // Managers de la classe
    const resMgrs = await axios.get(`${API}/api/admin/class-users`, {
      headers: authHeaders(),
      params: { class_id: managersDialog.value.classId },
    })
    managersDialog.value.managers = Array.isArray(resMgrs.data) ? resMgrs.data : []
  } catch (e) {
    console.error('openManagersDialog error:', e)
  } finally {
    managersDialog.value.loading = false
  }
}

/* Si jamais classId change (peu probable sans sélecteur), on garde le rechargement en place */
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
  try {
    await axios.post(
      `${API}/api/admin/class-users`,
      { class_id: cid, user_id: uid },
      { headers: authHeaders() },
    )
    // ✅ Fermer le dialog et reset le champ
    managersDialog.value.selectedProfId = null
    managersDialog.value.show = false
    snackbar.value = { show: true, text: 'Co-prof ajouté', color: 'success' }
  } catch (e) {
    console.error('addCoProf error:', e)
    snackbar.value = { show: true, text: "Erreur lors de l'ajout", color: 'error' }
  }
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
    // On recharge la liste (on garde le dialog ouvert ici)
    const resMgrs = await axios.get(`${API}/api/admin/class-users`, {
      headers: authHeaders(),
      params: { class_id: cid },
    })
    managersDialog.value.managers = Array.isArray(resMgrs.data) ? resMgrs.data : []
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
