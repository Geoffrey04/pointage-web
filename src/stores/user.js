import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null, // Ex : { username: 'jean', role: 'admin' }
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
  },
  actions: {
    login(username, password) {
      // Simuler des comptes
      const fakeUsers = [
        { username: 'prof1', password: 'test123', role: 'prof' },
        { username: 'admin', password: 'admin123', role: 'admin' },
      ]

      const found = fakeUsers.find((u) => u.username === username && u.password === password)

      if (found) {
        this.user = { username: found.username, role: found.role }
        return true
      } else {
        return false
      }
    },
    logout() {
      this.user = null
    },
  },
})
