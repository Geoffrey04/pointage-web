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
              <div class="text-h6">{{ kpi.value }}</div>
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
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate"
              >Nouvelle classe</v-btn
            >
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-data-table
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

      <!-- Taux de présence -->
      <v-col cols="12" md="4">
        <v-card class="rounded-xl elevation-2">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-subtitle-1">Taux de présence par classe</span>
            <v-btn size="small" prepend-icon="mdi-refresh" variant="text" @click="loadAttendance"
              >Rafraîchir</v-btn
            >
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-list>
              <v-list-item v-for="row in attendance" :key="row.id" class="rounded-lg mb-1">
                <v-list-item-title>{{ row.name }}</v-list-item-title>
                <v-list-item-subtitle class="text-medium-emphasis">
                  {{ row.presents }}/{{ row.marked }} présents
                </v-list-item-subtitle>
                <template #append>
                  <v-chip
                    :color="row.rate >= 90 ? 'green' : row.rate >= 75 ? 'orange' : 'red'"
                    variant="tonal"
                  >
                    {{ row.rate }}%
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Création / Édition -->
    <v-dialog v-model="dialog.open" max-width="560">
      <v-card>
        <v-card-title>{{
          dialog.mode === 'create' ? 'Nouvelle classe' : 'Éditer la classe'
        }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="formValid">
            <v-text-field v-model="form.name" label="Nom *" :rules="[rules.required]" />
            <v-textarea v-model="form.description" label="Description" auto-grow />
            <v-select
              v-model="form.owner_id"
              :items="profs"
              item-title="username"
              item-value="id"
              label="Prof responsable (optionnel)"
              clearable
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog.open = false">Annuler</v-btn>
          <v-btn color="primary" :disabled="!formValid" @click="saveClass">
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
          <v-btn color="red" @click="deleteClass">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="1600">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const headers = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// KPIs
const kpis = ref([
  { label: 'Utilisateurs', value: 0, icon: 'mdi-account-group', color: 'primary' },
  { label: 'Élèves', value: 0, icon: 'mdi-account-school', color: 'teal' },
  { label: 'Classes', value: 0, icon: 'mdi-google-classroom', color: 'indigo' },
  { label: 'Cours', value: 0, icon: 'mdi-calendar-multiple', color: 'orange' },
])

// Data
const classes = ref([])
const profs = ref([])
const attendance = ref([])

// Table headers (sans ID, avec actions)
const classHeaders = [
  { title: 'Nom', value: 'name' },
  { title: 'Description', value: 'description' },
  { title: 'Prof responsable', value: 'owner_id', width: 160 },
  { title: '', value: 'actions', width: 90, sortable: false },
]

// Snackbar
const snackbar = ref({ show: false, text: '', color: 'success' })

// Form dialog
const dialog = ref({ open: false, mode: 'create', id: null })
const formRef = ref(null)
const formValid = ref(false)
const form = ref({ name: '', description: '', owner_id: null })
const rules = { required: (v) => !!(v && v.trim()) || 'Requis' }

const confirm = ref({ open: false, item: null })

// Utils
function ownerName(id) {
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

// Actions
async function loadKPIs() {
  const { data } = await axios.get(`${API}/api/admin/stats`, { headers: headers() })
  kpis.value[0].value = Number(data.users || 0)
  kpis.value[1].value = Number(data.students || 0)
  kpis.value[2].value = Number(data.classes || 0)
  kpis.value[3].value = Number(data.sessions || 0)
}
async function loadProfs() {
  const { data } = await axios.get(`${API}/api/admin/profs`, { headers: headers() })
  profs.value = Array.isArray(data) ? data : []
}
async function loadClasses() {
  const { data } = await axios.get(`${API}/api/admin/classes`, { headers: headers() })
  classes.value = Array.isArray(data) ? data : []
}
async function loadAttendance() {
  const { data } = await axios.get(`${API}/api/admin/attendance-rate`, { headers: headers() })
  attendance.value = Array.isArray(data) ? data : []
}
async function saveClass() {
  if (!(await formRef.value?.validate())) return
  const payload = { ...form.value }
  try {
    if (dialog.value.mode === 'create') {
      await axios.post(`${API}/api/admin/classes`, payload, { headers: headers() })
      snackbar.value = { show: true, text: 'Classe créée', color: 'success' }
    } else {
      await axios.patch(`${API}/api/admin/classes/${dialog.value.id}`, payload, {
        headers: headers(),
      })
      snackbar.value = { show: true, text: 'Classe mise à jour', color: 'success' }
    }
    dialog.value.open = false
    await loadClasses()
  } catch (e) {
    console.error('saveClass', e)
    snackbar.value = { show: true, text: 'Erreur sauvegarde', color: 'error' }
  }
}
async function deleteClass() {
  try {
    await axios.delete(`${API}/api/admin/classes/${confirm.value.item.id}`, { headers: headers() })
    confirm.value.open = false
    snackbar.value = { show: true, text: 'Classe supprimée', color: 'success' }
    await loadClasses()
  } catch (e) {
    console.error('deleteClass', e)
    snackbar.value = { show: true, text: 'Erreur suppression', color: 'error' }
  }
}

function goToClass(id) {
  // vers la route dédiée au tableau de présence
  router.push({ name: 'Attendance', params: { id: String(id) } })
}

onMounted(async () => {
  try {
    await Promise.all([loadKPIs(), loadProfs(), loadClasses(), loadAttendance()])
  } catch (e) {
    console.error('Admin init', e)
    snackbar.value = { show: true, text: 'Erreur de chargement', color: 'error' }
  }
})
</script>

<style scoped>
.kpi-card {
  min-height: 86px;
}
.linkish {
  color: var(--v-theme-primary);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
