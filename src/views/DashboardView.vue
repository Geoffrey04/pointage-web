<template>
  <v-container>
    <!-- Boutons d'accès aux pop-ups -->
    <v-row class="mb-4" justify="center" align="center">
      <v-btn color="primary" class="ma-2" @click="dialogAddStudent = true">
        Ajouter un élève
      </v-btn>

      <v-btn color="secondary" class="ma-2" @click="dialogAddDate = true"> Ajouter une date </v-btn>

      <v-btn color="info" class="ma-2" @click="dialogStudentList = true"> Liste des élèves </v-btn>
    </v-row>

    <!-- Pop-up Ajouter un élève -->
    <v-dialog v-model="dialogAddStudent" max-width="520px">
      <v-card>
        <v-card-title>Ajouter un élève</v-card-title>
        <v-card-text>
          <AddStudentForm @student-added="onStudentAdded" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogAddStudent = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Pop-up Ajouter une date -->
    <v-dialog v-model="dialogAddDate" max-width="560px">
      <v-card>
        <v-card-title>Ajouter une date</v-card-title>
        <v-card-text>
          <!-- DateSelector utilise l'id de classe via la route en interne -->
          <DateSelector @dates-generated="onDatesGenerated" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogAddDate = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Pop-up Liste des élèves -->
    <v-dialog
      v-model="dialogStudentList"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <v-card>
        <v-toolbar color="primary" dark>
          <v-toolbar-title>Liste des élèves</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="dialogStudentList = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text>
          <StudentList />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Tableau de présence -->
    <v-card class="mt-4 rounded-xl elevation-2">
      <v-card-title class="text-h6">Tableau de présence</v-card-title>
      <v-divider />
      <v-card-text>
        <AttendanceMatrix :class-id="currentClassId" />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AddStudentForm from '@/components/AddStudentForm.vue'
import DateSelector from '@/components/DateSelector.vue'
import StudentList from '@/components/StudentList.vue'
import AttendanceMatrix from '@/components/AttendanceMatrix.vue'
import { useStudentsStore } from '@/stores/Students'

// Dialogs
const dialogAddStudent = ref(false)
const dialogAddDate = ref(false)
const dialogStudentList = ref(false)

// Route & classId (accepte :id ou :classId selon ta config de routes)
const route = useRoute()
const currentClassId = ref(Number(route.params.classId ?? route.params.id))

// Store (si tu veux rafraîchir la liste locale après ajout)
const studentsStore = useStudentsStore()

// Rafraîchir les élèves de la classe courante (si nécessaire pour ton store)
const refreshStudents = async () => {
  if (!currentClassId.value) return
  if (studentsStore?.fetchStudents) {
    await studentsStore.fetchStudents(currentClassId.value)
  }
}

// Événements enfants
const onStudentAdded = async () => {
  await refreshStudents()
  dialogAddStudent.value = false
}

const onDatesGenerated = async () => {
  // Si tu as un store de sessions, déclenche un refresh ici
  dialogAddDate.value = false
}

// Lifecycle
onMounted(refreshStudents)

// Recharger si la route change (navigation entre classes)
watch(
  () => route.params,
  (p) => {
    currentClassId.value = Number(p.classId ?? p.id)
    refreshStudents()
  },
)
</script>

<style scoped>
/* Optionnel : petits ajustements UI si besoin */
</style>
