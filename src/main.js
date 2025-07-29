import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

const app = createApp(App)
const pinia = createPinia()

app.use(createPinia())
app.use(router)
app.use(pinia)
app.use(vuetify)

pinia.use(piniaPluginPersistedstate)

app.mount('#app')

createApp(App).use(router).use(vuetify).mount('#app')
