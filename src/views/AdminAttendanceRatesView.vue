<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const headers = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const attendance = ref([])
const monthlyRaw = ref([])
const loading = ref(false)

async function loadAttendance() {
  loading.value = true
  try {
    const [r1, r2] = await Promise.all([
      axios.get(`${API}/api/admin/attendance-rate`, { headers: headers() }),
      axios.get(`${API}/api/admin/attendance-by-month`, { headers: headers() }),
    ])
    attendance.value = Array.isArray(r1.data) ? r1.data : []
    monthlyRaw.value = Array.isArray(r2.data) ? r2.data : []
    selectedClasses.value = [...new Set(monthlyRaw.value.map(r => r.name))]
  } catch (e) {
    console.error('loadAttendance :', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadAttendance)

// ── Graphique ────────────────────────────────────────────────
const MONTHS_FR = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']

const selectedClasses = ref([])

const chartSeries = computed(() => {
  const byClass = {}
  monthlyRaw.value.forEach(row => {
    if (!byClass[row.id]) byClass[row.id] = { name: row.name, data: [] }
    byClass[row.id].data.push({
      x: `${MONTHS_FR[row.month - 1]} ${row.year}`,
      y: Number(row.rate),
    })
  })
  return Object.values(byClass)
})

const allClassNames = computed(() => chartSeries.value.map(s => s.name))

const filteredChartSeries = computed(() =>
  chartSeries.value.filter(s => selectedClasses.value.includes(s.name))
)

function toggleClass(name) {
  const idx = selectedClasses.value.indexOf(name)
  if (idx === -1) selectedClasses.value.push(name)
  else selectedClasses.value.splice(idx, 1)
}

function toggleAll() {
  selectedClasses.value =
    selectedClasses.value.length === allClassNames.value.length
      ? []
      : [...allClassNames.value]
}

const chartOptions = {
  chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
  stroke: { curve: 'smooth', width: 2 },
  markers: { size: 4 },
  xaxis: { type: 'category' },
  yaxis: {
    min: 0, max: 100,
    labels: { formatter: v => v + '%' },
  },
  tooltip: { y: { formatter: v => v + '%' } },
  legend: { position: 'bottom' },
  colors: ['#C41E3A', '#1565C0', '#2E7D32', '#E65100', '#6A1B9A', '#00838F'],
}
</script>

<template>
  <v-container class="py-6">

    <!-- Classement par taux de présence -->
    <v-card class="rounded-xl elevation-2 mb-6">
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-subtitle-1">Taux de présence par classe</span>
        <v-btn size="small" prepend-icon="mdi-refresh" variant="text" :loading="loading" @click="loadAttendance">
          Rafraîchir
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-list>
          <v-list-item
            v-for="(row, idx) in attendance"
            :key="row.id"
            class="rounded-lg mb-1"
          >
            <template #prepend>
              <div class="rank-badge text-medium-emphasis mr-3">{{ idx + 1 }}</div>
            </template>
            <v-list-item-title>{{ row.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-medium-emphasis">
              {{ row.marked - row.presents }} absences · {{ row.sessions }} séances
            </v-list-item-subtitle>
            <template #append>
              <v-chip
                :color="row.rate >= 70 ? 'green' : row.rate >= 55 ? 'orange' : 'red'"
                variant="tonal"
              >
                {{ row.rate }}%
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Graphique mensuel -->
    <v-card class="rounded-xl elevation-2">
      <v-card-title class="text-subtitle-1">Évolution mensuelle par classe</v-card-title>
      <v-divider />
      <v-card-text>
        <div v-if="chartSeries.length === 0" class="text-center text-medium-emphasis py-8">
          Aucune donnée disponible
        </div>
        <template v-else>
          <!-- Filtre classes -->
          <div class="d-flex flex-wrap align-center ga-2 mb-3">
            <v-btn
              size="x-small"
              variant="outlined"
              color="grey"
              @click="toggleAll"
            >
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
</style>