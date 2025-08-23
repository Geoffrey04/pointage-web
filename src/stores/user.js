import { defineStore } from 'pinia'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token, // suffit pour protéger les routes
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    initialize() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token) {
        this.token = token
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      if (user) {
        try {
          this.user = JSON.parse(user)
        } catch {
          this.logout()
        }
      }
    },

    // ⬇️ accepte un objet { username, password } (comme envoyé par ta LoginView)
    async login({ username, password }) {
      try {
        const { data } = await axios.post(
          `${API}/login`,
          {
            username: String(username ?? '').trim(),
            password: String(password ?? ''),
          },
          { headers: { 'Content-Type': 'application/json' } },
        )

        this.user = data.user
        this.token = data.token

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
  },
})
