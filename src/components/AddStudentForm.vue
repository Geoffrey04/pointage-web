<template>
  <v-form ref="formRef" v-model="formValid" @submit.prevent="submitForm">
    <v-text-field
      v-model="firstname"
      label="Prénom"
      :rules="[rules.required, rules.onlyLetters]"
      variant="outlined"
      density="comfortable"
      class="mb-3"
      autocomplete="off"
    />
    <v-text-field
      v-model="lastname"
      label="Nom"
      :rules="[rules.required, rules.onlyLetters]"
      variant="outlined"
      density="comfortable"
      class="mb-3"
      autocomplete="off"
    />
    <v-text-field
      v-model="phone"
      label="Téléphone"
      :rules="[rules.phoneLength]"
      variant="outlined"
      density="comfortable"
      class="mb-3"
      autocomplete="tel"
      @input="formatPhone"
    />

    <!-- Sélecteur de classe (affiche le NOM) -->
    <v-select
      v-model="class_id"
      :items="classes"
      item-title="name"
      item-value="id"
      label="Classe"
      :rules="[rules.required]"
      variant="outlined"
      density="comfortable"
      class="mb-4"
      :disabled="lockClass"
    >
      <template #selection="{ item }">
        <!-- Affiche le nom choisi dans le champ -->
        <span>{{ item?.raw?.name ?? '—' }}</span>
      </template>
    </v-select>

    <v-select
      v-model="weekday"
      :items="weekdayItems"
      item-title="label"
      item-value="value"
      label="Jour du cours"
      :rules="[rules.required]"
      variant="outlined"
      density="comfortable"
      class="mb-4"
    />

    <v-btn type="submit" color="primary" :disabled="!formValid" block> Ajouter l’élève </v-btn>
  </v-form>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useStudentsStore } from '@/stores/Students'

const emit = defineEmits(['student-added', 'sessions-changed'])

const route = useRoute()
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const studentStore = useStudentsStore()

// Champs cohérents avec la DB
const firstname = ref('')
const lastname = ref('')
const phone = ref('')
const class_id = ref(null) // on stocke l'ID mais on affiche le NOM dans le select

// Sélecteur de classe (affiche le NOM)
const classes = ref([]) // [{ id, name }]

// Jour du cours (1..7 / Lundi..Dimanche)
const weekday = ref(null)
const weekdayItems = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
]

const formRef = ref(null)
const formValid = ref(false)

const rules = {
  required: (v) => !!v || 'Champ requis',
  onlyLetters: (v) => /^[a-zA-ZÀ-ÿ\s\-']+$/.test(v || '') || 'Lettres uniquement',
  phoneLength: (v) => {
    const digits = (v || '').replace(/\D/g, '')
    return digits.length === 10 || '10 chiffres requis'
  },
}

function formatPhone(e) {
  let digits = (e.target.value || '').replace(/\D/g, '').slice(0, 10)
  const parts = digits.match(/.{1,2}/g) || []
  phone.value = parts.join(' ')
}

// On verrouille le select si on est déjà dans une page de classe
const routeClassId = computed(() => Number(route.params.classId ?? route.params.id))
const lockClass = computed(() => !!routeClassId.value)

// Helper headers
function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Charger les classes au montage
onMounted(async () => {
  try {
    const { data } = await axios.get(`${API}/api/classes`, { headers: authHeaders() })
    // data attendu: [{ id, name }]
    classes.value = Array.isArray(data) ? data.map((c) => ({ id: Number(c.id), name: c.name })) : []

    // Pré-sélectionner la classe depuis l’URL si présente et existante
    if (routeClassId.value) {
      const exists = classes.value.some((c) => c.id === routeClassId.value)
      if (exists) class_id.value = routeClassId.value
    }
  } catch (err) {
    console.error('Erreur chargement classes :', err)
  }
})

async function submitForm() {
  const ok = await formRef.value?.validate()
  if (!ok) return

  const cid = Number(class_id.value)

  try {
    // 1) créer l’élève
    await studentStore.addStudent({
      firstname: firstname.value.trim(),
      lastname: lastname.value.trim(),
      phone: phone.value.trim(),
      class_id: cid,
    })
    emit('student-added') // 🔔 informer le parent

    // 2) générer les sessions pour la classe (jour choisi)
    try {
      await axios.post(
        `${API}/classes/${cid}/generate-sessions`,
        { weekday: Number(weekday.value) },
        { headers: authHeaders() },
      )
      emit('sessions-changed') // 🔔 informer le parent
    } catch (e) {
      console.warn('Génération sessions: ', e?.response?.data || e.message)
      // on rafraîchit quand même la matrice au cas où
      emit('sessions-changed')
    }

    // 3) reset (on garde la classe si verrouillée)
    firstname.value = ''
    lastname.value = ''
    phone.value = ''
    if (!lockClass.value) class_id.value = null
    weekday.value = null
  } catch (e) {
    console.error('Erreur ajout élève :', e)
  }
}
</script>
