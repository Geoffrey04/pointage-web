<template>
  <v-container>
    <v-card class="pa-4" max-width="500px">
      <v-card-title>Ajouter un élève</v-card-title>
      <v-divider class="mb-4" />

      <v-form @submit.prevent="submitForm" ref="formRef">
        <v-text-field
          v-model="prenom"
          label="Prénom"
          :rules="[(v) => !!v || 'Prénom requis']"
          required
        />
        <v-text-field v-model="nom" label="Nom" :rules="[(v) => !!v || 'Nom requis']" required />
        <v-text-field v-model="telephone" label="Téléphone" hint="Format libre" persistent-hint />

        <v-btn type="submit" color="primary" class="mt-4">Ajouter l'élève</v-btn>
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
const formRef = ref(null)

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 8)

function submitForm() {
  if (!formRef.value.validate()) return

  studentStore.addStudent({
    id: generateId(),
    prenom: prenom.value.trim(),
    nom: nom.value.trim(),
    telephone: telephone.value.trim(),
  })

  prenom.value = ''
  nom.value = ''
  telephone.value = ''
}
</script>
