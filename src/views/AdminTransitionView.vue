<template>
  <v-container>
    <div class="d-flex align-center ga-3 mb-6">
      <v-btn icon variant="text" :to="{ name: 'Admin' }">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <div class="text-h6">Transition de fin d'année</div>
        <div class="text-caption text-medium-emphasis">Traiter les dossiers d'inscription et de réinscription</div>
      </div>
    </div>

    <!-- Sélection année cible -->
    <v-card class="rounded-xl elevation-2 mb-6">
      <v-card-text>
        <v-select
          v-model="yearId"
          :items="years"
          item-title="label"
          item-value="id"
          label="Année cible"
          variant="outlined"
          density="comfortable"
          hide-details
          :loading="loading.years"
          style="max-width: 280px"
        />
      </v-card-text>
    </v-card>

    <!-- Liste des dossiers -->
    <v-skeleton-loader v-if="loading.dossiers" type="list-item@4" class="rounded-xl" />

    <template v-else-if="pendingDossiers.length">
      <!-- Section Nouvelles inscriptions -->
      <template v-if="nouvelles.length">
        <div class="d-flex align-center ga-2 mb-2">
          <span class="text-subtitle-1 font-weight-bold">Nouvelles inscriptions</span>
          <v-chip size="small" color="primary" variant="tonal">{{ nouvelles.length }}</v-chip>
        </div>
        <v-card class="rounded-xl elevation-2 mb-5">
          <v-list class="py-0">
            <template v-for="(d, i) in nouvelles" :key="d.id">
              <v-divider v-if="i > 0" />
              <v-list-item>
                <v-list-item-title>{{ d.prenom_eleve }} {{ d.nom_eleve }}</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(d.submitted_at) }}</v-list-item-subtitle>
                <template #append>
                  <v-btn icon size="small" variant="text" title="Télécharger le PDF" class="mr-1" @click="downloadPdf(d)">
                    <v-icon>mdi-file-pdf-box</v-icon>
                  </v-btn>
                  <v-btn size="small" color="primary" variant="tonal" :disabled="!yearId" @click="openAccept(d)">
                    Accepter
                  </v-btn>
                </template>
              </v-list-item>
            </template>
          </v-list>
        </v-card>
      </template>

      <!-- Section Réinscriptions -->
      <template v-if="reinscriptions.length">
        <div class="d-flex align-center ga-2 mb-2">
          <span class="text-subtitle-1 font-weight-bold">Réinscriptions</span>
          <v-chip size="small" color="teal" variant="tonal">{{ reinscriptions.length }}</v-chip>
        </div>
        <v-card class="rounded-xl elevation-2">
          <v-list class="py-0">
            <template v-for="(d, i) in reinscriptions" :key="d.id">
              <v-divider v-if="i > 0" />
              <v-list-item>
                <v-list-item-title>{{ d.prenom_eleve }} {{ d.nom_eleve }}</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(d.submitted_at) }}</v-list-item-subtitle>
                <template #append>
                  <v-btn icon size="small" variant="text" title="Télécharger le PDF" class="mr-1" @click="downloadPdf(d)">
                    <v-icon>mdi-file-pdf-box</v-icon>
                  </v-btn>
                  <v-btn size="small" color="teal" variant="tonal" :disabled="!yearId" @click="openAccept(d)">
                    Accepter
                  </v-btn>
                </template>
              </v-list-item>
            </template>
          </v-list>
        </v-card>
      </template>
    </template>

    <v-card v-else-if="!loading.dossiers" class="rounded-xl elevation-2">
      <v-card-text class="text-medium-emphasis text-caption">Aucun dossier en attente.</v-card-text>
    </v-card>

    <!-- Dialog : accepter un dossier inscription (nouveau) -->
    <v-dialog v-model="acceptDialog.show" max-width="440">
      <v-card class="rounded-xl">
        <v-card-title class="pt-4 px-4">
          {{ acceptDialog.dossier?.type === 'reinscription' ? 'Réinscription' : 'Nouvelle inscription' }}
        </v-card-title>
        <v-card-text class="px-4 pb-2">
          <div class="text-body-2 mb-4">
            <strong>{{ acceptDialog.dossier?.prenom_eleve }} {{ acceptDialog.dossier?.nom_eleve }}</strong>
            — année <strong>{{ yearLabel }}</strong>
          </div>

          <!-- Réinscription : sélectionner l'élève existant -->
          <v-autocomplete
            v-if="acceptDialog.dossier?.type === 'reinscription'"
            v-model="acceptDialog.studentId"
            :items="allStudents"
            :item-title="(s) => `${s.firstname} ${s.lastname}`"
            item-value="id"
            label="Élève existant *"
            variant="outlined"
            density="comfortable"
            clearable
            class="mb-3"
          />

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
          <v-btn
            color="primary"
            :loading="acceptDialog.saving"
            :disabled="!acceptDialog.classId || (acceptDialog.dossier?.type === 'reinscription' && !acceptDialog.studentId)"
            @click="confirmAccept"
          >
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
import { ref, computed, onMounted } from 'vue'
import { api } from '@/stores/user'

const loading = ref({ years: true, dossiers: true })
const years          = ref([])
const allClasses     = ref([])
const allStudents    = ref([])
const yearId         = ref(null)
const pendingDossiers = ref([])
const snackbar = ref({ show: false, text: '', color: 'success' })

const acceptDialog = ref({
  show: false, dossier: null, classId: null, studentId: null, saving: false,
})

// ─── Computed ───────────────────────────────────────────────
const yearLabel = computed(() => years.value.find((y) => y.id === yearId.value)?.label ?? '—')

const nouvelles     = computed(() => pendingDossiers.value.filter((d) => d.type === 'inscription'))
const reinscriptions = computed(() => pendingDossiers.value.filter((d) => d.type === 'reinscription'))

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Chargement initial ─────────────────────────────────────
onMounted(async () => {
  const [resYears, resClasses, resDossiers, resStudents] = await Promise.all([
    api.get('/api/admin/school-years'),
    api.get('/api/admin/classes'),
    api.get('/api/admin/dossiers', { params: { status: 'pending' } }),
    api.get('/api/admin/students'),
  ])
  years.value         = Array.isArray(resYears.data)    ? resYears.data    : []
  allClasses.value    = Array.isArray(resClasses.data)  ? resClasses.data  : []
  allStudents.value   = Array.isArray(resStudents.data) ? resStudents.data : []
  pendingDossiers.value = Array.isArray(resDossiers.data) ? resDossiers.data : []
  loading.value.years   = false
  loading.value.dossiers = false

  // Pré-sélectionner l'année suivant la courante
  const current = years.value.find((y) => y.is_current)
  if (current) {
    const next = years.value.find((y) => y.id !== current.id && y.label > current.label)
    yearId.value = next?.id ?? current.id
  }
})

// ─── Accepter un dossier ─────────────────────────────────────
function openAccept(dossier) {
  acceptDialog.value = { show: true, dossier, classId: null, studentId: null, saving: false }
}

async function confirmAccept() {
  acceptDialog.value.saving = true
  try {
    await api.post(`/api/admin/dossiers/${acceptDialog.value.dossier.id}/accept`, {
      class_id:       acceptDialog.value.classId,
      school_year_id: yearId.value,
      student_id:     acceptDialog.value.studentId ?? undefined,
    })
    pendingDossiers.value = pendingDossiers.value.filter((d) => d.id !== acceptDialog.value.dossier.id)
    const className = allClasses.value.find((c) => c.id === acceptDialog.value.classId)?.name ?? '?'
    snackbar.value = {
      show: true,
      text: `${acceptDialog.value.dossier.prenom_eleve} ${acceptDialog.value.dossier.nom_eleve} inscrit en ${className}`,
      color: 'success',
    }
    acceptDialog.value.show = false
  } catch (e) {
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Erreur', color: 'error' }
  } finally {
    acceptDialog.value.saving = false
  }
}

// ─── Télécharger le PDF ──────────────────────────────────────
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