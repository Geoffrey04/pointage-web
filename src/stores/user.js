// stores/user.js
import { defineStore } from 'pinia'
import axios from 'axios'

export const API_BASE =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// ── Axios sans auth (uniquement pour /login)
export const httpNoAuth = axios.create({
  baseURL: API_BASE,
  headers: { Accept: 'application/json' },
})

// ── Axios avec auth (pour tout le reste)
export const api = axios.create({
  baseURL: API_BASE,
  headers: { Accept: 'application/json' },
})

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
  }),

  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin: (s) => s.user?.role === 'admin',
  },

  actions: {
    // Applique / retire le token sur l'instance "api"
    _applyToken(token) {
      this.token = token || null
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`
      } else {
        delete api.defaults.headers.common.Authorization
      }
    },

    initialize() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')

      if (token) this._applyToken(token)
      if (user) {
        try {
          this.user = JSON.parse(user)
        } catch {
          this.logout()
        }
      }
    },

    /**
     * Login sans pré-vol CORS :
     * - aucun header Authorization
     * - Content-Type: application/x-www-form-urlencoded
     */
    async login({ username, password }) {
      try {
        // S'assurer qu'un éventuel Authorization global ne fuit pas
        delete axios.defaults.headers.common?.Authorization

        const body = new URLSearchParams({
          username: String(username ?? '').trim(),
          password: String(password ?? ''),
        })

        const { data } = await httpNoAuth.post('/login', body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })

        // Stockage + activation de l'axios authentifié
        this.user = data.user
        localStorage.setItem('user', JSON.stringify(this.user))

        localStorage.setItem('token', data.token)
        this._applyToken(data.token)

        return true
      } catch (err) {
        console.error('Login error:', err?.response?.data || err?.message)
        return false
      }
    },

    logout() {
      this.user = null
      localStorage.removeItem('user')

      localStorage.removeItem('token')
      this._applyToken(null)
    },
  },
})
