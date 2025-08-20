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
    <v-dialog v-model="dialogAddStudent" max-width="500px">
      <v-card>
        <v-card-title>Ajouter un élève</v-card-title>
        <v-card-text>
          <AddStudentForm @student-added="refreshStudents" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogAddStudent = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Pop-up Ajouter une date -->
    <v-dialog v-model="dialogAddDate" max-width="500px">
      <v-card>
        <v-card-title>Ajouter une date</v-card-title>
        <v-card-text>
          <DateSelector @dates-generated="refreshDates" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogAddDate = false">Fermer</v-btn>
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
        <v-toolbar dark color="primary">
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

    <!-- Tableau des élèves -->
    <v-card>
      <v-data-table
        v-if="Array.isArray(studentsStore.students)"
        :items="studentsStore.students"
        :headers="tableHeaders"
        item-key="id"
        class="elevation-1"
      >
        <template #item.actions="{ item }">
          <v-icon color="green">mdi-check-circle</v-icon>
          <v-icon color="orange">mdi-alert-circle</v-icon>
          <v-icon color="red">mdi-close-circle</v-icon>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AddStudentForm from '@/components/AddStudentForm.vue'
import DateSelector from '@/components/DateSelector.vue'
import StudentList from '@/components/StudentList.vue'
import { useStudentsStore } from '@/stores/Students'

const dialogAddStudent = ref(false)
const dialogAddDate = ref(false)
const dialogStudentList = ref(false)

const studentsStore = useStudentsStore()
const currentClassId = 1 // Remplacer par la vraie classe sélectionnée

// Headers du tableau
const tableHeaders = [
  { text: 'Prénom', value: 'firstname' },
  { text: 'Nom', value: 'lastname' },
  { text: 'Actions', value: 'actions', sortable: false },
]

// Fonction pour récupérer les élèves
const refreshStudents = async () => {
  await studentsStore.fetchStudents(currentClassId)
}

// Fonction pour récupérer les dates (à relier au store / tableau si nécessaire)
const refreshDates = (dates) => {
  // À implémenter selon le store des sessions
  console.log('Dates générées :', dates)
}

onMounted(() => {
  refreshStudents()
})
</script>
