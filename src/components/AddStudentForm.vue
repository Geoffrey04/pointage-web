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
          label="Classe"
          required
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
import { useStudentsStore } from '@/stores/Students'
import axios from 'axios'

const studentStore = useStudentsStore()

// Champs cohérents avec la DB
const firstname = ref('')
const lastname = ref('')
const phone = ref('')
const class_id = ref(null)

const classes = ref([])
/*[
  { id: 5, label: 'Flûte' },
  { id: 6, label: 'Initial' },
  { id: 7, label: 'Eveil 1' },
  { id: 8, label: 'Eveil 2' },
  { id: 10, label: 'Cuivre' },
  { id: 11, label: 'Trompette' },
  { id: 12, label: 'Saxophone' },
  { id: 13, label: 'Percussions' },
  { id: 14, label: 'Orchestre des jeunes EMM' },
] */

const formRef = ref(null)
const formValid = ref(false)

const rules = {
  required: (v) => !!v || 'Champ requis',
  onlyLetters: (v) => /^[a-zA-ZÀ-ÿ\s\-']+$/.test(v) || 'Lettres uniquement',
  phoneLength: (v) => {
    const digits = v.replace(/\D/g, '')
    return digits.length === 10 || '10 chiffres requis'
  },
}

function formatPhone(e) {
  let digits = e.target.value.replace(/\D/g, '').slice(0, 10)
  const parts = digits.match(/.{1,2}/g) || []
  phone.value = parts.join(' ')
}

// Charger les classes au montage
onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/classes')
    classes.value = response.data
  } catch (err) {
    console.error('Erreur chargement classes :', err)
  }
})

async function submitForm() {
  if (!formRef.value.validate()) return

  await studentStore.addStudent({
    firstname: firstname.value.trim(),
    lastname: lastname.value.trim(),
    phone: phone.value.trim(),
    class_id: class_id.value,
  })

  // reset form
  firstname.value = ''
  lastname.value = ''
  phone.value = ''
  class_id.value = null
}
</script>
