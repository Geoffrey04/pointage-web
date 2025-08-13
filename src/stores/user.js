import { defineStore } from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.user && !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
  },
  actions: {
    async login(username, password) {
      try {
        const res = await axios.post('http://localhost:3000/login', { username, password })
        this.user = res.data.user
        this.token = res.data.token
        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('token', this.token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        return true
      } catch (err) {
        console.error('Login error:', err.response?.data || err.message)
        return false
      }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    },

    initialize() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token && user) {
        try {
          this.user = JSON.parse(user)
          this.token = token
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch (err) {
          console.error('Erreur parsing user depuis localStorage :', err)
          this.logout()
        }
      }
    },
  },
})
