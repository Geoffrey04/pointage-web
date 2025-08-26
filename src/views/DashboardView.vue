<template>
  <v-container>
    <!-- Boutons d'accès aux pop-ups -->
    <v-row class="mb-4" justify="center" align="center">
      <v-btn color="primary" class="ma-2" @click="dialogAddStudent = true">
        Ajouter un élève
      </v-btn>

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

    <!-- Tableau de présence -->
    <v-card class="rounded-xl elevation-2">
      <v-container>
        <h2 class="text-h6 mb-2">Tableau de présence</h2>
        <AttendanceMatrix ref="attendanceRef" :class-id="currentClassId" />
      </v-container>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AttendanceMatrix from '@/components/AttendanceMatrix.vue'
import AddStudentForm from '@/components/AddStudentForm.vue'
import StudentList from '@/components/StudentList.vue'

const route = useRoute()

// dialogs
const dialogAddStudent = ref(false)
const dialogStudentList = ref(false)

// ID de la classe depuis l’URL
const currentClassId = computed(() => Number(route.params.id))

// Ref vers la matrice pour déclencher reload()
const attendanceRef = ref(null)
function refreshMatrix() {
  attendanceRef.value?.reload()
}

// évènements du formulaire
function onStudentAdded() {
  refreshMatrix()
}
</script>
