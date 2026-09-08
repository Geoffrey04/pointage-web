// src/plugins/vuetify.js
//
// Composants et directives ne sont volontairement PAS importés en bloc :
// vite-plugin-vuetify est configuré avec { autoImport: true } et les résout
// depuis les templates. Un `import * as components` annulerait cet élagage.
//
// 'vuetify/styles' est en revanche conservé : il apporte la base typographique
// et les classes utilitaires (pa-, text-, d-flex, rounded-, ga-…) très utilisées.
import 'vuetify/styles'
import { h } from 'vue'
import { createVuetify } from 'vuetify'
import { aliases, mdi as mdiSvgSet } from 'vuetify/iconsets/mdi-svg'
import { fr } from 'vuetify/locale'
import { APP_ICONS } from './icons'

// Jeu d'icônes sur mesure : les templates continuent d'écrire "mdi-pencil",
// et cette table le traduit en chemin SVG. On évite ainsi de charger la police
// Material Design complète (339 Ko de CSS + 394 Ko de woff2) pour 62 icônes.
//
// Les alias internes de Vuetify (flèches de listes, coches, navigation du
// calendrier) ne passent pas par ici : ils portent le préfixe "svg:" et sont
// routés par Vuetify vers son jeu "svg" intégré.
const appMdi = {
  component: (props) => {
    const raw = props.icon
    const resolved = APP_ICONS[raw] ?? raw

    if (import.meta.env.DEV && typeof raw === 'string' && raw.startsWith('mdi-') && !APP_ICONS[raw]) {
      console.warn(
        `[icons] "${raw}" est absent de APP_ICONS : l'icône ne s'affichera pas. ` +
        'Relancez `node gen-icons.mjs` pour régénérer la table.',
      )
    }

    return h(mdiSvgSet.component, { ...props, icon: resolved })
  },
}

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi: appMdi },
  },
  locale: {
    locale: 'fr',
    messages: { fr },
  },
  date: {
    locale: 'fr-FR',
  },
})
