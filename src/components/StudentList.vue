<template>
  <v-container>
    <v-card class="pa-4">
      <v-card-title>Liste des élèves</v-card-title>
      <v-divider></v-divider>

      <v-list>
        <v-list-item v-for="student in students" :key="student.id" @click="selectStudent(student)">
          <v-list-item-content>
            <v-list-item-title>{{ student.prenom }} {{ student.nom }}</v-list-item-title>
            <v-list-item-subtitle>
              📞 {{ student.telephone || 'Non renseigné' }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn icon @click.stop="deleteStudent(student.id)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup>
import { useStudentsStore } from '@/stores/Students'

const studentStore = useStudentsStore()
const students = studentStore.students

function selectStudent(student) {
  console.log('Élève sélectionné :', student)
}

function deleteStudent(id) {
  studentStore.removeStudent(id)
}
</script>
