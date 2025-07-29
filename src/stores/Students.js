import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useStudentsStore = defineStore('students', () => {
  const students = reactive([])

  function addStudent(student) {
    students.push(student)
  }

  function removeStudent(id) {
    const index = students.findIndex((s) => s.id === id)
    if (index !== -1) {
      students.splice(index, 1)
    }
  }

  return {
    students,
    addStudent,
    removeStudent,
  }
})
