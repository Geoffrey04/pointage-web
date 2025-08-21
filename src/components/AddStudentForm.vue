<template>
  <v-container>
    <v-card class="pa-4" max-width="500px">
      <v-card-title>Ajouter un élève</v-card-title>
      <v-divider class="mb-4" />

      <v-form @submit.prevent="submitForm" ref="formRef" v-model="formValid">
        <v-text-field
          v-model="firstname"
          label="Prénom"
          :rules="[rules.required, rules.onlyLetters]"
          required
        />
        <v-text-field
          v-model="lastname"
          label="Nom"
          :rules="[rules.required, rules.onlyLetters]"
          required
        />
        <v-select
          v-model="class_id"
          :items="classes"
          item-title="nom"
          item-value="id"
          :loading="classesLoading"
          :error-messages="classesError ? [classesError] : []"
          label="Classe"
          variant="outlined"
        />

        <v-text-field
          v-model="phone"
          label="Téléphone"
          placeholder="06 12 34 56 78"
          :rules="[rules.required, rules.phoneLength]"
          @input="formatPhone"
          prepend-inner-icon="mdi-phone"
          type="tel"
          persistent-hint
          hint="Format : XX XX XX XX XX"
          clearable
          required
        />

        <v-btn type="submit" color="primary" class="mt-4" :disabled="!formValid">
          Ajouter l'élève
        </v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useStudentsStore } from '@/stores/Students'

const studentStore = useStudentsStore()

// ── Champs du formulaire (cohérents DB)
const firstname = ref('')
const lastname = ref('')
const phone = ref('')
const class_id = ref(null)

// ── Liste des classes pour le v-select
// ⚠️ Dans le template : item-title="name" item-value="id"
const classes = ref([])
const classesLoading = ref(false)
const classesError = ref(null)

// ── Référence et validation du formulaire (Vuetify 3 retourne une Promise)
const formRef = ref(null)
const formValid = ref(false)

// ── Règles de validation
const rules = {
  required: (v) => !!v || 'Champ requis',
  onlyLetters: (v) => /^[a-zA-ZÀ-ÿ\s\-']+$/.test(v) || 'Lettres uniquement',
  phoneLength: (v) => {
    const digits = (v || '').toString().replace(/\D/g, '')
    return digits.length === 10 || '10 chiffres requis'
  },
}

// ── Formatage téléphone (XX XX XX XX XX)
function formatPhone(e) {
  let digits = e.target.value.replace(/\D/g, '').slice(0, 10)
  const parts = digits.match(/.{1,2}/g) || []
  phone.value = parts.join(' ')
}

// ── Base URL API (env ou fallback localhost)
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// ── Chargement des classes au montage (protégé par JWT)
onMounted(async () => {
  classesLoading.value = true
  classesError.value = null
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      classes.value = []
      classesError.value = 'Token manquant : connectez-vous.'
      return
    }

    // Route unique côté serveur (admin => toutes, prof => ses classes)
    const { data } = await axios.get(`${API}/api/classes`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    // Normalisation pour le v-select
    classes.value = (Array.isArray(data) ? data : []).map((c) => ({
      id: c.id,
      nom: c.nom ?? c.label ?? c.title ?? `Classe ${c.id}`,
    }))
  } catch (err) {
    console.error(
      'Erreur chargement classes :',
      err?.response?.status,
      err?.response?.data || err.message,
    )
    classes.value = []
    classesError.value = 'Impossible de charger les classes.'
  } finally {
    classesLoading.value = false
  }
})

// ── Soumission du formulaire
async function submitForm() {
  // Vuetify 3 : validate() => Promise<{ valid: boolean }>
  const result = await formRef.value?.validate()
  const valid = typeof result === 'object' ? result.valid : !!result
  if (!valid) return

  try {
    await studentStore.addStudent({
      firstname: firstname.value.trim(),
      lastname: lastname.value.trim(),
      phone: phone.value.trim(),
      class_id: class_id.value,
    })

    // Reset du formulaire
    firstname.value = ''
    lastname.value = ''
    phone.value = ''
    class_id.value = null
    formRef.value?.resetValidation?.()
  } catch (err) {
    console.error('Erreur ajout élève :', err)
  }
}
</script>
