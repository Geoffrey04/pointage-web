<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12" class="d-flex justify-end mb-4" style="gap: 1rem">
        <v-btn color="primary" @click="showAddStudent = true">Ajouter un élève</v-btn>
        <v-btn color="primary" @click="showStudentList = true">Afficher la liste des élèves</v-btn>
        <v-btn color="primary" @click="showDateSelector = true">Configurer les dates</v-btn>
      </v-col>

      <v-col cols="12">
        <AttendanceTable />
      </v-col>
    </v-row>

    <!-- Pop-up Ajouter un élève -->
    <v-dialog v-model="showAddStudent" max-width="500px">
      <v-card>
        <v-card-title>Ajouter un élève</v-card-title>
        <v-card-text>
          <AddStudentForm />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" text @click="showAddStudent = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Pop-up Liste des élèves -->
    <v-dialog v-model="showStudentList" max-width="600px">
      <v-card>
        <v-card-title>Liste des élèves</v-card-title>
        <v-card-text>
          <StudentList />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" text @click="showStudentList = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Pop-up Configuration des dates -->
    <v-dialog v-model="showDateSelector" max-width="500px">
      <v-card>
        <v-card-title>Configurer les dates</v-card-title>
        <v-card-text>
          <DateSelector />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" text @click="showDateSelector = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import AddStudentForm from '@/components/AddStudentForm.vue'
import StudentList from '@/components/StudentList.vue'
import DateSelector from '@/components/DateSelector.vue'
import AttendanceTable from '@/components/AttendanceTable.vue'

const showAddStudent = ref(false)
const showStudentList = ref(false)
const showDateSelector = ref(false)
</script>
