import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import { useUserStore, api } from './stores/user'

// Instance Vuetify centralisée dans plugins/vuetify.js : elle porte la locale
// française, le jeu d'icônes mdi et le format de date fr-FR. Ce fichier existait
// déjà mais n'était importé nulle part — d'où le contournement par
// <v-locale-provider locale="fr"> dans la matrice pour le calendrier.
import vuetify from './plugins/vuetify'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

// Restaure le token JWT et l'utilisateur depuis le localStorage avant le montage
const userStore = useUserStore()
userStore.initialize()

// Session expirée : le JWT vit 8 h, après quoi chaque appel échoue en silence.
// On distingue l'expiration d'un simple refus d'accès : le serveur renvoie un
// 403 nu (sendStatus, sans corps JSON) quand le jeton est invalide, alors qu'un
// refus métier porte toujours un { message }. Sans ça, un prof sans accès à une
// classe serait déconnecté à tort.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const hasMessage = !!error?.response?.data?.message
    const sessionLost = status === 401 || (status === 403 && !hasMessage)

    if (sessionLost && userStore.isLoggedIn) {
      userStore.logout()
      const current = router.currentRoute.value
      if (current.path !== '/login') {
        router.push({ path: '/login', query: { expired: '1' } })
      }
    }
    return Promise.reject(error)
  },
)

app.mount('#app')
