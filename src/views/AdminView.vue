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
                <!-- Gérer les profs -->
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
import { api } from '@/stores/user'

const loading = ref({ kpis: true, classes: true, profs: true })
const saving = ref(false)
const deleting = ref(false)

const kpis = ref([
  { label: 'Professeurs', value: 0, icon: 'mdi-account-group', color: 'primary' },
  { label: 'Élèves', value: 0, icon: 'mdi-account-school', color: 'teal' },
  { label: 'Classes', value: 0, icon: 'mdi-google-classroom', color: 'indigo' },
  { label: 'Cours', value: 0, icon: 'mdi-calendar-multiple', color: 'orange' },
])

const classes = ref([])
const profs = ref([])

const classHeaders = [
  { title: 'Nom', key: 'name' },
  { title: 'Description', key: 'description', value: 'description' },
  { title: 'Prof responsable', key: 'owner_username', value: 'owner_username', width: 180 },
  { title: '', key: 'actions', value: 'actions', width: 90, sortable: false },
]

const snackbar = ref({ show: false, text: '', color: 'success' })

const dialog = ref({ open: false, mode: 'create', id: null })
const formRef = ref(null)
const formValid = ref(false)
const form = ref({ name: '', description: '', owner_id: null })
const rules = { required: (v) => !!(v && String(v).trim()) || 'Requis' }

const confirm = ref({ open: false, item: null })

const managersDialog = ref({
  show: false,
  classId: null,
  className: '',
  loading: false,
  managers: [],
  allProfs: [],
  selectedProfId: null,
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
    managersDialog.value.allProfs = Array.isArray(resProfs.data) ? resProfs.data : []
    managersDialog.value.managers = Array.isArray(resMgrs.data) ? resMgrs.data : []
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
    // Dialog reste ouvert — on recharge la liste à jour
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
  form.value = { name: '', description: '', owner_id: null }
}
function openEdit(item) {
  dialog.value = { open: true, mode: 'edit', id: item.id }
  form.value = { name: item.name, description: item.description, owner_id: item.owner_id ?? null }
}
function confirmDelete(item) {
  confirm.value = { open: true, item }
}

async function loadKPIs() {
  try {
    const { data } = await api.get('/api/admin/stats')
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

async function saveClass() {
  const res = await formRef.value?.validate()
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
    await api.delete(`/api/admin/classes/${confirm.value.item.id}`)
    confirm.value.open = false
    snackbar.value = { show: true, text: 'Classe supprimée', color: 'success' }
    await loadClasses()
  } catch (e) {
    console.error('deleteClass :', e)
    snackbar.value = {
      show: true,
      text: e?.response?.data?.message || 'Erreur suppression',
      color: 'error',
    }
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadKPIs(), loadProfs(), loadClasses()])
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
