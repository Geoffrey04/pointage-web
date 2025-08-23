<template>
  <v-container>
    <!-- Boutons d'accès aux pop-ups -->
    <v-row class="mb-4" justify="center" align="center">
      <v-btn color="primary" class="ma-2" @click="dialogAddStudent = true">
        Ajouter un élève
      </v-btn>

      <!-- Optionnel : si tu gardes le DateSelector -->
      <v-btn color="secondary" class="ma-2" @click="dialogAddDate = true"> Ajouter une date </v-btn>

      <v-btn color="info" class="ma-2" @click="dialogStudentList = true"> Liste des élèves </v-btn>
    </v-row>

    <!-- Pop-up Ajouter un élève -->
    <v-dialog v-model="dialogAddStudent" max-width="520px">
      <v-card>
        <v-card-title>Ajouter un élève</v-card-title>
        <v-card-text>
          <AddStudentForm @student-added="onStudentAdded" @sessions-changed="onSessionsChanged" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogAddStudent = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Pop-up Ajouter une date (optionnel si tu le conserves) -->
    <v-dialog v-model="dialogAddDate" max-width="520px">
      <v-card>
        <v-card-title>Ajouter une date</v-card-title>
        <v-card-text>
          <DateSelector @dates-generated="refreshMatrix" />
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AttendanceMatrix from '@/components/AttendanceMatrix.vue'
import AddStudentForm from '@/components/AddStudentForm.vue'
import DateSelector from '@/components/DateSelector.vue' // si tu l’utilises encore quelque part
import StudentList from '@/components/StudentList.vue'

const route = useRoute()

// dialogs
const dialogAddStudent = ref(false)
const dialogAddDate = ref(false)
const dialogStudentList = ref(false)

// ID de la classe depuis l’URL (fonctionne avec /presence/:id ou /dashboard/:id)
const currentClassId = computed(() => Number(route.params.id))

// Ref vers la matrice pour déclencher reload()
const attendanceRef = ref(null)
function refreshMatrix() {
  attendanceRef.value?.reload()
}

// évènements du formulaire
function onStudentAdded() {
  // si tu as un store des élèves, tu peux recharger ici aussi
  refreshMatrix()
}
function onSessionsChanged() {
  refreshMatrix()
}

onMounted(() => {
  // première charge assurée par AttendanceMatrix.onMounted(fetchAll)
})
</script>
