<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { api } from '@/stores/user'

const attendance = ref([])
const monthlyRaw = ref([])
const years = ref([])
const selectedYear = ref(null)
const loading = ref(false)
const error = ref(null)

async function loadYears() {
  const { data } = await api.get('/api/admin/school-years')
  years.value = Array.isArray(data) ? data : []
  const current = years.value.find((y) => y.is_current)
  selectedYear.value = current?.id ?? years.value[0]?.id ?? null
}

async function loadAttendance() {
  if (!selectedYear.value) return
  loading.value = true
  error.value = null
  try {
    const params = { year_id: selectedYear.value }
    const [r1, r2] = await Promise.all([
      api.get('/api/admin/attendance-rate', { params }),
      api.get('/api/admin/attendance-by-month', { params }),
    ])
    attendance.value = Array.isArray(r1.data) ? r1.data : []
    monthlyRaw.value = Array.isArray(r2.data) ? r2.data : []
    selectedClasses.value = [...new Set(monthlyRaw.value.map((r) => r.name))]
  } catch (e) {
    console.error('loadAttendance :', e)
    error.value = e?.response?.data?.message || 'Erreur de chargement des statistiques'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    await loadYears()
    await loadAttendance()
  } catch (e) {
    console.error(e)
    error.value = 'Erreur de chargement'
  }
})

// ── Classes ayant réellement des séances passées ─────────────
const activeClasses = computed(() => attendance.value.filter((r) => r.expected > 0))
const idleClasses = computed(() => attendance.value.filter((r) => r.expected === 0))

// ── Synthèse globale ─────────────────────────────────────────
const totals = computed(() => {
  const acc = { expected: 0, marked: 0, presents: 0, excused: 0, absents: 0 }
  for (const r of attendance.value) {
    acc.expected += r.expected
    acc.marked += r.marked
    acc.presents += r.presents
    acc.excused += r.excused
    acc.absents += r.absents
  }
  return {
    ...acc,
    rate: acc.marked ? Math.round((1000 * acc.presents) / acc.marked) / 10 : 0,
    coverage: acc.expected ? Math.round((1000 * acc.marked) / acc.expected) / 10 : 0,
    missing: acc.expected - acc.marked,
  }
})

const rateColor = (v) => (v >= 85 ? 'green' : v >= 70 ? 'orange' : 'red')
const coverageColor = (v) => (v >= 90 ? 'green' : v >= 60 ? 'orange' : 'red')

// ── Graphique ────────────────────────────────────────────────
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const selectedClasses = ref([])

const chartSeries = computed(() => {
  const byClass = {}
  monthlyRaw.value.forEach((row) => {
    if (!byClass[row.id]) byClass[row.id] = { name: row.name, data: [] }
    byClass[row.id].data.push({
      x: `${MONTHS_FR[row.month - 1]} ${row.year}`,
      y: Number(row.rate),
    })
  })
  return Object.values(byClass)
})

const allClassNames = computed(() => chartSeries.value.map((s) => s.name))
const filteredChartSeries = computed(() =>
  chartSeries.value.filter((s) => selectedClasses.value.includes(s.name)),
)

function toggleClass(name) {
  const idx = selectedClasses.value.indexOf(name)
  if (idx === -1) selectedClasses.value.push(name)
  else selectedClasses.value.splice(idx, 1)
}

function toggleAll() {
  selectedClasses.value =
    selectedClasses.value.length === allClassNames.value.length ? [] : [...allClassNames.value]
}

const chartOptions = {
  chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
  stroke: { curve: 'smooth', width: 2 },
  markers: { size: 4 },
  xaxis: { type: 'category' },
  yaxis: { min: 0, max: 100, labels: { formatter: (v) => v + '%' } },
  tooltip: { y: { formatter: (v) => v + '%' } },
  legend: { position: 'bottom' },
  colors: ['#C41E3A', '#1565C0', '#2E7D32', '#E65100', '#6A1B9A', '#00838F'],
}
</script>

<template>
  <v-container class="py-6">
    <!-- Sélecteur d'année + rafraîchir -->
    <div class="d-flex flex-wrap align-center ga-3 mb-4">
      <v-select
        v-model="selectedYear"
        :items="years"
        item-title="label"
        item-value="id"
        label="Année scolaire"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 220px"
        @update:model-value="loadAttendance"
      />
      <v-btn
        size="small"
        prepend-icon="mdi-refresh"
        variant="text"
        :loading="loading"
        @click="loadAttendance"
      >
        Rafraîchir
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <!-- Synthèse -->
    <v-card class="rounded-xl elevation-2 mb-6">
      <v-card-title class="text-subtitle-1">Synthèse de l'année</v-card-title>
      <v-divider />
      <v-card-text>
        <v-skeleton-loader v-if="loading" type="paragraph" />
        <div v-else-if="totals.expected === 0" class="text-center text-medium-emphasis py-6">
          Aucune séance passée sur cette année scolaire.
        </div>
        <v-row v-else dense>
          <v-col cols="12" sm="6">
            <div class="stat-box">
              <div class="stat-label">Taux de présence</div>
              <div class="stat-value" :class="`text-${rateColor(totals.rate)}`">
                {{ totals.rate }}<span class="stat-unit">%</span>
              </div>
              <div class="stat-help">
                {{ totals.presents }} présences sur {{ totals.marked }} pointages saisis
              </div>
              <div class="stat-help">
                {{ totals.absents }} absence{{ totals.absents !== 1 ? 's' : '' }} ·
                {{ totals.excused }} excusé{{ totals.excused !== 1 ? 's' : '' }}
              </div>
            </div>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="stat-box">
              <div class="stat-label">Taux de pointage</div>
              <div class="stat-value" :class="`text-${coverageColor(totals.coverage)}`">
                {{ totals.coverage }}<span class="stat-unit">%</span>
              </div>
              <div class="stat-help">
                {{ totals.marked }} pointages saisis sur {{ totals.expected }} attendus
              </div>
              <div class="stat-help">
                {{ totals.missing }} pointage{{ totals.missing !== 1 ? 's' : '' }} manquant{{ totals.missing !== 1 ? 's' : '' }}
              </div>
            </div>
          </v-col>
        </v-row>

        <v-alert
          v-if="!loading && totals.expected > 0 && totals.coverage < 60"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-4 text-caption"
        >
          Moins de 60 % des pointages attendus ont été saisis — le taux de présence
          ci-dessus ne porte que sur les données réellement enregistrées.
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Par classe -->
    <v-card class="rounded-xl elevation-2 mb-6">
      <v-card-title class="text-subtitle-1">Détail par classe</v-card-title>
      <v-divider />
      <v-card-text>
        <v-skeleton-loader v-if="loading" type="list-item@4" />
        <div v-else-if="activeClasses.length === 0" class="text-center text-medium-emphasis py-6">
          Aucune classe avec des séances passées.
        </div>
        <v-list v-else>
          <v-list-item v-for="(row, idx) in activeClasses" :key="row.id" class="rounded-lg mb-1">
            <template #prepend>
              <div class="rank-badge text-medium-emphasis mr-3">{{ idx + 1 }}</div>
            </template>
            <v-list-item-title>{{ row.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-medium-emphasis">
              {{ row.absents }} absence{{ row.absents !== 1 ? 's' : '' }} ·
              {{ row.excused }} excusé{{ row.excused !== 1 ? 's' : '' }} ·
              {{ row.sessions }} séance{{ row.sessions !== 1 ? 's' : '' }}
            </v-list-item-subtitle>
            <template #append>
              <div class="d-flex align-center ga-2">
                <v-chip
                  size="small"
                  :color="coverageColor(row.coverage)"
                  variant="outlined"
                  :title="`${row.marked} pointages saisis sur ${row.expected} attendus`"
                >
                  <v-icon start size="14">mdi-clipboard-check-outline</v-icon>
                  {{ row.coverage }}%
                </v-chip>
                <v-chip
                  :color="rateColor(row.rate)"
                  variant="tonal"
                  :title="`${row.presents} présences sur ${row.marked} pointages saisis`"
                >
                  {{ row.rate }}%
                </v-chip>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <div v-if="!loading && idleClasses.length" class="text-caption text-medium-emphasis mt-3">
          Non listée{{ idleClasses.length !== 1 ? 's' : '' }} faute de séance passée :
          {{ idleClasses.map((c) => c.name).join(', ') }}
        </div>

        <div class="text-caption text-medium-emphasis mt-3">
          <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
          Chip pleine : part de présents parmi les pointages saisis. Chip contourée : part des
          pointages attendus qui ont été saisis.
        </div>
      </v-card-text>
    </v-card>

    <!-- Graphique mensuel -->
    <v-card class="rounded-xl elevation-2">
      <v-card-title class="text-subtitle-1">Évolution mensuelle par classe</v-card-title>
      <v-divider />
      <v-card-text>
        <v-skeleton-loader v-if="loading" type="image" />
        <div v-else-if="chartSeries.length === 0" class="text-center text-medium-emphasis py-8">
          Aucune donnée disponible
        </div>
        <template v-else>
          <div class="d-flex flex-wrap align-center ga-2 mb-3">
            <v-btn size="x-small" variant="outlined" color="grey" @click="toggleAll">
              {{ selectedClasses.length === allClassNames.length ? 'Tout désélectionner' : 'Tout sélectionner' }}
            </v-btn>
            <v-chip
              v-for="name in allClassNames"
              :key="name"
              size="small"
              :variant="selectedClasses.includes(name) ? 'tonal' : 'outlined'"
              :color="selectedClasses.includes(name) ? 'primary' : 'grey'"
              class="cursor-pointer"
              @click="toggleClass(name)"
            >
              {{ name }}
            </v-chip>
          </div>
          <VueApexCharts
            type="line"
            height="320"
            :options="chartOptions"
            :series="filteredChartSeries"
          />
        </template>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.rank-badge {
  font-size: 0.8rem;
  font-weight: 700;
  width: 20px;
  text-align: center;
}
.stat-box {
  padding: 4px 8px;
}
.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(0, 0, 0, 0.6);
}
.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}
.stat-unit {
  font-size: 1.25rem;
  font-weight: 600;
  margin-left: 2px;
}
.stat-help {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.6);
}
</style>
