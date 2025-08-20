import { defineStore } from 'pinia'
import axios from 'axios'

export const useStudentsStore = defineStore('students', {
  state: () => ({
    students: [],
  }),
  actions: {
    // Récupérer tous les élèves d'une classe
    async fetchStudents(classId) {
      try {
        // L'URL correspond à : GET /api/students/:class_id
        const res = await axios.get(`/api/students/${classId}`)
        this.students = res.data
      } catch (err) {
        console.error('Erreur fetchStudents:', err)
      }
    },

    // Ajouter un nouvel élève
    async addStudent(newStudent) {
      try {
        // POST /api/students
        const res = await axios.post('/api/students', newStudent)
        this.students.push(res.data) // on ajoute direct à la liste
        console.log(newStudent)
      } catch (err) {
        console.error('Erreur addStudent:', err)
      }
    },
  },
})
