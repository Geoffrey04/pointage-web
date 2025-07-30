<template>
  <v-container>
    <v-card class="pa-4" max-width="500px">
      <v-card-title>Ajouter un élève</v-card-title>
      <v-divider class="mb-4" />

      <v-form @submit.prevent="submitForm" ref="formRef" v-model="formValid">
        <v-text-field
          v-model="prenom"
          label="Prénom"
          :rules="[rules.required, rules.onlyLetters]"
          required
        />
        <v-text-field
          v-model="nom"
          label="Nom"
          :rules="[rules.required, rules.onlyLetters]"
          required
        />
        <v-select
          v-model="classe"
          :items="['flûte', 'initial', 'trompette']"
          label="Classe"
          required
        />
        <v-text-field
          v-model="telephone"
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
import { ref } from 'vue'
import { useStudentsStore } from '@/stores/Students'

const studentStore = useStudentsStore()

const prenom = ref('')
const nom = ref('')
const telephone = ref('')
const classe = ref('')
const formRef = ref(null)
const formValid = ref(false)

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 8)

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
  telephone.value = parts.join(' ')
}

function submitForm() {
  if (!formRef.value.validate()) return

  studentStore.addStudent({
    id: generateId(),
    prenom: prenom.value.trim(),
    nom: nom.value.trim(),
    telephone: telephone.value.trim(),
    classe: classe.value.trim(),
  })

  prenom.value = ''
  nom.value = ''
  telephone.value = ''
  classe.value = ''
}
</script>
