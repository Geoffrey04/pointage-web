<template>
  <v-container class="py-4" style="max-width: 1100px;">
    <v-card class="rounded-xl overflow-hidden">
     <v-card-title class="d-flex align-center ga-2">
  <v-btn icon variant="text" @click="goBack" aria-label="Retour">
    <v-icon>mdi-arrow-left</v-icon>
  </v-btn>

  <!-- ✅ titre sans icône PDF -->
  <div class="file-title">
    {{ fiche?.title ?? 'Fiche' }}
  </div>

  <v-spacer />

  <!-- ✅ bouton plus élégant -->
  <v-btn
    v-if="pdfUrl"
    class="open-btn"
    variant="tonal"
    color="primary"
    rounded="pill"
    @click="openNewTab"
  >
    <v-icon start>mdi-open-in-new</v-icon>
    Ouvrir
  </v-btn>
</v-card-title>


      <v-divider />

      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
          {{ error }}
        </v-alert>

        <v-skeleton-loader v-if="loading" type="image" height="520" />

        <div v-else class="viewer">
          <iframe
            v-if="pdfUrl"
            class="viewer__frame"
            :src="pdfUrl"
            title="PDF"
          />
          <div v-else class="text-medium-emphasis">
            PDF introuvable.
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const fiches = ref([])
const fiche = ref(null)

const ficheId = computed(() => String(route.params.id || ''))

const pdfUrl = computed(() => {
  if (!fiche.value?.file) return ''
  return `/fiches/${fiche.value.file}`
})

function goBack() {
  router.push('/fiches')
}

function openNewTab() {
  if (!pdfUrl.value) return
  window.open(pdfUrl.value, '_blank', 'noopener')
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/fiches/fiches.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    fiches.value = Array.isArray(data) ? data : []
    fiche.value = fiches.value.find((f) => String(f.id) === ficheId.value) ?? null

    if (!fiche.value) {
      error.value = "Cette fiche n'existe pas (ou a été supprimée)."
    }
  } catch (e) {
    console.error(e)
    error.value = "Impossible de charger la fiche."
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
watch(ficheId, loadAll)
</script>

<style scoped>

.file-title{
  min-width: 0;
  font-weight: 700;
  font-size: 1.05rem;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;     /* 2 lignes max */
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.viewer {
  width: 100%;
}
.viewer__frame {
  width: 100%;
  height: min(75vh, 760px);
  border: 0;
  border-radius: 12px;
}
@media (max-width: 600px) {
  .viewer__frame {
    height: 70vh;
    border-radius: 10px;
  }
}

.open-btn{
  font-weight: 700;
  letter-spacing: .3px;
}
@media (max-width: 380px){
  .open-btn{
    padding-inline: 10px;
  }
  .open-btn :deep(.v-icon){
    margin-inline-end: 6px;
  }
}

</style>
