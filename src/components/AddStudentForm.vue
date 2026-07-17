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
        <span>{{ item?.raw?.name ?? '—' }}</span>
      </template>
    </v-select>

    <!-- Jour de cours (obligatoire) -->
    <v-select
      v-model="studentWeekday"
      :items="weekdayItems"
      item-title="title"
      item-value="value"
      label="Jour de cours"
      :rules="[rules.required]"
      variant="outlined"
      density="comfortable"
      class="mb-4"
    />

    <v-alert v-if="submitError" type="error" variant="tonal" class="mb-3">
      {{ submitError }}
    </v-alert>

    <v-btn type="submit" color="primary" :disabled="!formValid" block> Ajouter l'élève </v-btn>
  </v-form>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/stores/user'
import { useStudentsStore } from '@/stores/Students'

const emit = defineEmits(['student-added'])

const route = useRoute()
const studentStore = useStudentsStore()

const firstname = ref('')
const lastname = ref('')
const phone = ref('')
const class_id = ref(null)
const studentWeekday = ref(null)
const submitError = ref(null)

const weekdayItems = [
  { title: 'Lundi', value: 1 },
  { title: 'Mardi', value: 2 },
  { title: 'Mercredi', value: 3 },
  { title: 'Jeudi', value: 4 },
  { title: 'Vendredi', value: 5 },
  { title: 'Samedi', value: 6 },
  { title: 'Dimanche', value: 7 },
]
const classes = ref([])

const formRef = ref(null)
const formValid = ref(false)
const rules = {
  required: (v) => !!(v && String(v).trim()) || 'Champ requis',
  onlyLetters: (v) =>
    /^[a-zA-ZÀ-ÿ\s\-']+$/.test(v || '') || 'Uniquement lettres, espaces, tirets et apostrophes',
  // Le téléphone est facultatif : valide si vide, ou exactement 10 chiffres
  phoneLength: (v) => {
    const digits = (v || '').replace(/\D/g, '')
    return digits.length === 0 || digits.length === 10 || '10 chiffres requis'
  },
}

function formatPhone(e) {
  const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 10)
  const parts = digits.match(/.{1,2}/g) || []
  phone.value = parts.join(' ')
}

const routeClassId = computed(() => Number(route.params.classId ?? route.params.id))
const lockClass = computed(() => !!routeClassId.value)

onMounted(async () => {
  try {
    const { data } = await api.get('/api/classes')
    classes.value = Array.isArray(data) ? data.map((c) => ({ id: Number(c.id), name: c.name })) : []

    // Pré-sélectionne la classe issue de l'URL si elle est dans la liste
    if (routeClassId.value) {
      const exists = classes.value.some((c) => c.id === routeClassId.value)
      if (exists) class_id.value = routeClassId.value
    }
  } catch (err) {
    console.error('Erreur chargement classes :', err)
  }
})

async function submitForm() {
  const res = await formRef.value?.validate()
  const valid = typeof res === 'object' ? res.valid : !!res
  if (!valid) return

  submitError.value = null

  try {
    await studentStore.addStudent({
      firstname: firstname.value.trim(),
      lastname: lastname.value.trim(),
      phone: phone.value.trim(),
      class_id: Number(class_id.value),
      weekday: studentWeekday.value ?? null,
    })

    emit('student-added')

    firstname.value = ''
    lastname.value = ''
    phone.value = ''
    studentWeekday.value = null
    if (!lockClass.value) class_id.value = null
  } catch (e) {
    console.error('Erreur ajout élève :', e)
    submitError.value = e?.response?.data?.message || "Erreur lors de l'ajout de l'élève."
  }
}
</script>
