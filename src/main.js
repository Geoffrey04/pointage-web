import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import { useUserStore } from './stores/user'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const app = createApp(App)
const pinia = createPinia()
const vuetify = createVuetify({ components, directives })

app.use(pinia)
app.use(router)
app.use(createPinia())
app.use(router)
app.use(vuetify)

const userStore = useUserStore()
userStore.initialize() // ← Initialisation avant le montage

app.mount('#app')
