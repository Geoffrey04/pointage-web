<template>
  <v-card class="rounded-xl elevation-2">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="text-h6">Élèves</div>
      <div class="text-caption text-medium-emphasis" v-if="currentClass">
        {{ currentClass.name }} — {{ students.length }} élève{{ students.length > 1 ? 's' : '' }}
      </div>
    </v-card-title>
    <v-divider />

    <v-card-text>
      <!-- Erreur d’accès / classe non autorisée -->
      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

      <!-- Filtres -->
      <v-row class="mb-3" align="center">
        <v-col cols="12" sm="7">
          <v-text-field
            v-model="q"
            prepend-inner-icon="mdi-magnify"
            label="Rechercher (nom, prénom)"
            variant="outlined"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="7" sm="3">
          <v-select
            v-model="sortKey"
            :items="sortOptions"
            item-title="label"
            item-value="key"
            label="Trier par"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="5" sm="2" class="d-flex">
          <v-switch
            v-model="sortAsc"
            :label="sortAsc ? 'Asc' : 'Desc'"
            hide-details
            color="primary"
            inset
            class="ml-auto"
          />
        </v-col>
      </v-row>

      <!-- Skeletons -->
      <template v-if="loading">
        <v-row>
          <v-col cols="12" sm="6" md="4" v-for="i in 6" :key="'sk' + i">
            <v-skeleton-loader type="image, text@2" class="rounded-xl" />
          </v-col>
        </v-row>
      </template>

      <!-- Liste vide -->
      <v-alert v-else-if="filtered.length === 0" type="info" variant="tonal">
        Aucun élève trouvé.
      </v-alert>

      <!-- Grille cartes (≥ sm) -->
      <v-row v-else class="d-none d-sm-flex">
        <v-col cols="12" sm="6" md="4" v-for="st in paged" :key="st.id">
          <v-card class="rounded-xl hover-elevate">
            <v-card-text class="d-flex align-center ga-3">
              <v-avatar size="44" color="primary">
                <span class="text-subtitle-1">
                  {{ initials(st) }}
                </span>
              </v-avatar>

              <div class="flex-1 overflow-hidden">
                <div class="text-subtitle-1 font-weight-medium truncate">
                  {{ st.lastname }} {{ st.firstname }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ st.phone || '—' }}
                </div>
              </div>

              <div class="d-flex ga-1">
                <v-btn
                  v-if="st.phone"
                  size="small"
                  icon
                  color="primary"
                  variant="tonal"
                  :href="`tel:${plainPhone(st.phone)}`"
                  target="_self"
                  :title="`Appeler ${st.firstname}`"
                >
                  <v-icon>mdi-phone</v-icon>
                </v-btn>
                <v-btn
                  v-if="st.phone"
                  size="small"
                  icon
                  color="primary"
                  variant="tonal"
                  :href="`sms:${plainPhone(st.phone)}`"
                  target="_self"
                  :title="`SMS ${st.firstname}`"
                >
                  <v-icon>mdi-message-text</v-icon>
              </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Liste dense (mobile < sm) -->
      <v-list class="d-sm-none">
        <v-list-item v-for="st in paged" :key="st.id" class="rounded-lg mb-2 border-thin">
          <template #prepend>
            <v-avatar size="40" color="primary">
              <span class="text-subtitle-2">{{ initials(st) }}</span>
            </v-avatar>
          </template>
          <v-list-item-title class="font-weight-medium">
            {{ st.lastname }} {{ st.firstname }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-medium-emphasis">
            {{ st.phone || '—' }}
          </v-list-item-subtitle>
          <template #append>
            <v-btn-group density="comfortable" divided>
              <v-btn v-if="st.phone" icon :href="`tel:${plainPhone(st.phone)}`">
                <v-icon>mdi-phone</v-icon>
              </v-btn>
              <v-btn v-if="st.phone" icon :href="`sms:${plainPhone(st.phone)}`">
                <v-icon>mdi-message-text</v-icon>
              </v-btn>
              <v-btn icon @click="openInfo(st)">
                <v-icon>mdi-information-outline</v-icon>
              </v-btn>
            </v-btn-group>
          </template>
        </v-list-item>
      </v-list>

      <!-- Pagination -->
      <div class="d-flex justify-end mt-3" v-if="filtered.length > perPage">
        <v-pagination v-model="page" :length="pages" total-visible="5" density="comfortable" />
      </div>
    </v-card-text>
  </v-card>

  <!-- Dialog infos -->
  <v-dialog v-model="infoDialog" max-width="420">
    <v-card>
      <v-card-title class="text-h6">Infos élève</v-card-title>
      <v-card-text v-if="selected">
        <div class="mb-2"><strong>Nom :</strong> {{ selected.lastname }}</div>
        <div class="mb-2"><strong>Prénom :</strong> {{ selected.firstname }}</div>
        <div class="mb-2"><strong>Téléphone :</strong> {{ selected.phone || '—' }}</div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="infoDialog = false">Fermer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

// Props (optionnel) : forcer une classe si fournie
const props = defineProps({
  classId: { type: [Number, String], required: false },
})

const route = useRoute()
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const loading = ref(true)
const error = ref(null)

const classes = ref([]) // classes autorisées du user
const currentClass = ref(null) // { id, name, description }
const students = ref([]) // élèves de la classe

// UI state
const q = ref('')
const sortKey = ref('lastname')
const sortAsc = ref(true)
const perPage = ref(12)
const page = ref(1)

const sortOptions = [
  { key: 'lastname', label: 'Nom' },
  { key: 'firstname', label: 'Prénom' },
]

// Dialog infos
const infoDialog = ref(false)
const selected = ref(null)
const openInfo = (st) => {
  selected.value = st
  infoDialog.value = true
}

// Utils
const plainPhone = (p) => (p || '').replace(/\D/g, '')
const initials = (st) =>
  (st?.lastname?.[0] || '').toUpperCase() + (st?.firstname?.[0] || '').toUpperCase()

const effectiveClassId = computed(() => {
  return Number(props.classId ?? route.params.classId ?? route.params.id)
})

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  let arr = [...students.value]
  if (term) {
    arr = arr.filter((s) =>
      [s.firstname, s.lastname, s.phone].some((v) => (v || '').toLowerCase().includes(term)),
    )
  }
  arr.sort((a, b) => {
    const ka = (a[sortKey.value] || '').toString().toLowerCase()
    const kb = (b[sortKey.value] || '').toString().toLowerCase()
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
  const token = localStorage.getItem('token')
  const { data } = await axios.get(`${API}/api/classes`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  classes.value = Array.isArray(data) ? data : []
}

async function fetchStudents() {
  const cid = effectiveClassId.value
  if (!cid) throw new Error('ID de classe manquant.')
  // sécurité : vérifier appartenance
  const allowed = classes.value.some((c) => Number(c.id) === Number(cid))
  if (!allowed) {
    throw new Error('Accès refusé à cette classe.')
  }
  const { data } = await axios.get(`${API}/api/students/${cid}`)
  students.value = Array.isArray(data) ? data : []
}

onMounted(async () => {
  try {
    loading.value = true
    error.value = null

    // 1) Charger classes autorisées (prof/admin)
    await fetchAuthorizedClasses()

    // 2) Retenir la classe courante
    const cid = effectiveClassId.value
    currentClass.value = classes.value.find((c) => Number(c.id) === Number(cid)) || null
    if (!currentClass.value) {
      throw new Error('Classe introuvable ou non autorisée.')
    }

    // 3) Charger élèves de la classe
    await fetchStudents()
  } catch (e) {
    console.error('StudentList error:', e)
    error.value = e?.response?.data?.message || e?.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.hover-elevate {
  transition: box-shadow 0.2s ease;
}
.hover-elevate:hover {
  box-shadow: var(--v-shadow-4);
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Petits affinages responsives */
@media (max-width: 600px) {
  .v-card-title .text-caption {
    display: none;
  }
}
</style>
