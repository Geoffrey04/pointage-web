<template>
  <v-container class="py-8">
    <v-card class="rounded-2xl elevation-1">
      <v-card-text class="pa-6 pa-md-8 content">
        <h1 class="text-h4 text-md-h3 mb-4">Politique cookies</h1>
        <p class="text-body-2 text-medium-emphasis mb-6">
          L’application utilise exclusivement des traceurs <strong>techniquement nécessaires</strong> à son fonctionnement
          (aucun cookie publicitaire, social ou d’analytics tiers). Conformément au cadre ePrivacy/RGPD, ces traceurs
          nécessaires ne requièrent pas de consentement préalable.
        </p>

        <v-divider class="my-4" />

        <section id="definition" class="mb-6">
          <h2 class="text-h5 mb-3">Qu’entend-on par “cookies” ?</h2>
          <p>
            Le terme “cookies” désigne ici l’ensemble des <strong>traceurs</strong> utilisés par le navigateur :
            cookies, <code>localStorage</code>, <code>sessionStorage</code> et mécanismes équivalents.
          </p>
        </section>

        <v-divider class="my-4" />

        <section id="liste" class="mb-6">
          <h2 class="text-h5 mb-3">Traceurs utilisés par l’application</h2>
          <p class="mb-3">
            Liste actuelle des stockages locaux utilisés pour le bon fonctionnement de l’application :
          </p>

          <v-table class="mb-4">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Finalité</th>
                <th>Émetteur</th>
                <th>Durée</th>
                <th>Portée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>ui_prefs</code></td>
                <td>sessionStorage</td>
                <td>État UI (menu, filtres…) pour la session en cours (si utilisé).</td>
                <td>Application EMM Pointage</td>
                <td>Jusqu’à fermeture du navigateur</td>
                <td>Domaine de l’application</td>
              </tr>
            </tbody>
          </v-table>

          <p class="text-body-2 text-medium-emphasis">
            Aucun cookie tiers (publicité, réseaux sociaux, analytics) n’est déposé.
          </p>
        </section>

        <v-divider class="my-4" />

        <section id="gestion" class="mb-6">
          <h2 class="text-h5 mb-3">Gérer les cookies et stockages</h2>
          <p>
            Vous pouvez effacer ces données via les paramètres du navigateur ou en utilisant le bouton ci-dessous.
            Attention : supprimer ces éléments peut vous <strong>déconnecter</strong> de l’application.
          </p>
          <v-btn
            class="mt-3"
            prepend-icon="mdi-delete-forever"
            :loading="clearing"
            :disabled="clearing"
            @click="clearAppStorage"
          >
            Tout effacer sur cet appareil
          </v-btn>
          <v-alert
            v-if="cleared"
            type="success"
            variant="tonal"
            class="mt-3"
          >
            Données locales supprimées. Si vous étiez connecté, vous devrez vous reconnecter.
          </v-alert>
        </section>

        <v-divider class="my-4" />

        <section id="navigateurs" class="mb-6">
          <h2 class="text-h5 mb-3">Paramétrer votre navigateur</h2>
          <ul class="list">
            <li>Dans les réglages “Confidentialité / Cookies et données de sites”, vous pouvez bloquer les cookies tiers, effacer les données ou définir des exceptions.</li>
            <li>Le blocage total des cookies/stockages peut empêcher l’application de fonctionner correctement.</li>
          </ul>
        </section>

        <v-divider class="my-4" />

        <section id="lien" class="mb-2">
          <h2 class="text-h5 mb-3">Plus d’infos</h2>
          <p>
            Voir aussi la <RouterLink to="/privacy">Politique de confidentialité</RouterLink> et les
            <RouterLink to="/mentions-legales">Mentions légales</RouterLink>.
          </p>
          <p class="text-body-2 text-medium-emphasis mt-4">
            <em>Dernière mise à jour : 10/09/2025</em>
          </p>
        </section>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const dev = import.meta.env.DEV
const clearing = ref(false)
const cleared = ref(false)

function deleteCookie(name: string) {
  // Efface un cookie basique (adapter domaine/attributs si nécessaire)
  document.cookie = `${name}=; Max-Age=0; path=/;`
  document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}`
}

function clearAppStorage() {
  clearing.value = true
  try {
    // Ajuste la liste selon les clés réellement utilisées par ton app 🧩
    const keys = ['auth_token', 'user', 'ui_prefs']
    keys.forEach((k) => localStorage.removeItem(k))
    sessionStorage.clear()

    // Si un jour tu passes à une session par cookie, ajoute ici les noms réels 🧩
    ;['__Secure-session', '__Host-session', 'session'].forEach(deleteCookie)

    cleared.value = true
  } finally {
    clearing.value = false
  }
}

onMounted(() => {
  document.title = 'Politique cookies — EMM Pointage'
})
</script>

<style scoped>
.content :where(h1, h2) { line-height: 1.25; }
.content .list { margin: 0.25rem 0 0 0; padding-left: 1.25rem; }
.content a { text-decoration: underline; text-underline-offset: 2px; }
code { padding: 0.15rem 0.35rem; border-radius: 6px; background: rgba(0,0,0,.04); }
</style>
