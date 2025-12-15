<template>
  <v-container class="py-4" style="max-width: 900px;">
    <v-card class="rounded-xl">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon>mdi-file-pdf-box</v-icon>
        <span>Fiches de solfège</span>
      </v-card-title>
      <v-divider />

      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
          {{ error }}
        </v-alert>

        <v-skeleton-loader
          v-if="loading"
          type="list-item-two-line,list-item-two-line,list-item-two-line"
        />

        <v-list v-else nav>
          <v-list-item
            v-for="f in fiches"
            :key="f.id"
            :title="f.title"
            prepend-icon="mdi-file-pdf-box"
            @click="openFiche(f.id)"
          >
            <template #append>
              <v-icon>mdi-chevron-right</v-icon>
            </template>
          </v-list-item>
        </v-list>

        <div v-if="!loading && !error && fiches.length === 0" class="text-medium-emphasis">
          Aucune fiche disponible.
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const fiches = ref([])
const loading = ref(true)
const error = ref('')

async function loadFiches() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/fiches/fiches.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    fiches.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = "Impossible de charger la liste des fiches."
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openFiche(id) {
  router.push(`/fiches/${encodeURIComponent(id)}`)
}

onMounted(loadFiches)
</script>
