import { defineStore } from 'pinia'
import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Instance axios sans Authorization — réservée à /login pour éviter tout pré-vol CORS
export const httpNoAuth = axios.create({
  baseURL: API_BASE,
  headers: { Accept: 'application/json' },
})

// Instance axios authentifiée — utilisée pour toutes les routes protégées
export const api = axios.create({
  baseURL: API_BASE,
  headers: { Accept: 'application/json' },
})

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
    bootstrapped: false,
  }),

  getters: {
    isLoggedIn: (s) => !!s.token || !!localStorage.getItem('token'),
    isAdmin: (s) => s.user?.role === 'admin',
  },

  actions: {
    // Applique ou retire le token Bearer sur l'instance axios authentifiée
    _applyToken(token) {
      this.token = token || null
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`
      } else {
        delete api.defaults.headers.common.Authorization
      }
    },

    // Restaure la session depuis le localStorage (appelé au démarrage de l'app)
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

    async login({ username, password }) {
      try {
        // Le login utilise application/x-www-form-urlencoded pour éviter le pré-vol CORS
        const body = new URLSearchParams({
          username: String(username ?? '').trim(),
          password: String(password ?? ''),
        })

        const { data } = await httpNoAuth.post('/login', body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })

        this.user = data.user
        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('token', data.token)
        this._applyToken(data.token)

        return true
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Erreur inconnue'
        console.error('Échec de la connexion :', msg)
        return { error: msg }
      }
    },

    logout() {
      this.user = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      this._applyToken(null)
      this.bootstrapped = false
    },

    // Charge le profil utilisateur et les classes autorisées une seule fois par session.
    // Appelé par le guard de navigation du router à chaque changement de route.
    async bootstrapOnce() {
      if (this.bootstrapped) return

      const token = localStorage.getItem('token')
      if (!token) {
        this.user = null
        this._applyToken(null)
        this.bootstrapped = true
        return
      }

      if (!this.token) this._applyToken(token)

      try {
        const [{ data: me }, { data: classes }] = await Promise.all([
          api.get('/api/me'),
          api.get('/api/classes'),
        ])

        this.user = me || null
        localStorage.setItem('user', JSON.stringify(this.user))

        const { useStudentsStore } = await import('@/stores/Students')
        const studentsStore = useStudentsStore()
        studentsStore.setClasses(classes || [])
      } catch (e) {
        console.error('Échec du bootstrap de session :', e?.response?.data || e?.message)
        this.logout()
      } finally {
        this.bootstrapped = true
      }
    },
  },
})
