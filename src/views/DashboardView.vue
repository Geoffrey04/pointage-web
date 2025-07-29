<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12" md="4">
        <AddStudentForm />
        <StudentList />
      </v-col>

      <v-col cols="12" md="8">
        <DateSelector />
        <AttendanceTable />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import AddStudentForm from '@/components/AddStudentForm.vue'
import StudentList from '@/components/StudentList.vue'
import DateSelector from '@/components/DateSelector.vue'
import AttendanceTable from '@/components/AttendanceTable.vue'
</script>
