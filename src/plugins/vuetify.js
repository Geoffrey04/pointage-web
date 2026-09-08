// src/plugins/vuetify.js
//
// Les composants et directives ne sont volontairement PAS importés en bloc :
// vite-plugin-vuetify est configuré avec { autoImport: true } et les résout
// un par un d'après les templates. Un `import * as components` annulerait cet
// élagage et embarquerait toute la bibliothèque.
//
// L'import de 'vuetify/styles' est en revanche conservé : il apporte la base
// typographique et les classes utilitaires (pa-, text-, d-flex, rounded-, ga-…)
// massivement utilisées dans l'app. S'en passer demanderait la configuration
// Sass par composant, nettement plus intrusive.
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { fr } from 'vuetify/locale'

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  locale: {
    locale: 'fr',
    messages: { fr },
  },
  date: {
    locale: 'fr-FR',
  },
})
