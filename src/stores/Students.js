// stores/Students.js
import { defineStore } from 'pinia'
import { api } from '@/stores/user' // ← utilise l'instance axios authentifiée

export const useStudentsStore = defineStore('students', {
  state: () => ({
    students: [],
    classes: [],
    classesLoaded: false,
  }),

  actions: {
    setClasses(list) {
      this.classes = Array.isArray(list) ? list : []
      this.classesLoaded = true
    },
    clearClasses() {
      this.classes = []
      this.classesLoaded = false
    },

    // Récupérer toutes les classes (si besoin hors bootstrap)
    async fetchClasses() {
      try {
        const { data } = await api.get('/api/classes')
        this.setClasses(data || [])
      } catch (err) {
        console.error('Erreur fetchClasses:', err)
      }
    },

    // Récupérer tous les élèves d'une classe
    async fetchStudents(classId) {
      try {
        // GET /api/students/:class_id
        const res = await api.get(`/api/students/${classId}`)
        this.students = Array.isArray(res.data) ? res.data : []
      } catch (err) {
        console.error('Erreur fetchStudents:', err)
      }
    },

    // Ajouter un nouvel élève
    async addStudent(newStudent) {
      try {
        // POST /api/students
        const res = await api.post('/api/students', newStudent)
        if (res?.data) this.students.push(res.data)
      } catch (err) {
        console.error('Erreur addStudent:', err)
      }
    },
  },
})
