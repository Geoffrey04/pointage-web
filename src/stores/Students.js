import { defineStore } from 'pinia'
import { api } from '@/stores/user'

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

    // Recharge les classes accessibles (si nécessaire en dehors du bootstrap)
    async fetchClasses() {
      const { data } = await api.get('/api/classes')
      this.setClasses(data || [])
    },

    async fetchStudents(classId) {
      const res = await api.get(`/api/students/${classId}`)
      this.students = Array.isArray(res.data) ? res.data : []
    },

    // Les erreurs remontent au composant appelant pour qu'il puisse
    // afficher un retour approprié à l'utilisateur.
    async addStudent(newStudent) {
      const res = await api.post('/api/students', newStudent)
      if (res?.data) this.students.push(res.data)
    },
  },
})
