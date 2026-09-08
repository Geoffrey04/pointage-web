<template>
  <v-container class="py-8">
    <v-card class="rounded-xl elevation-1">
      <v-card-text class="pa-6 pa-md-8 content">
        <h1 class="text-h4 text-md-h3 mb-4">Politique cookies</h1>
        <p class="text-body-2 text-medium-emphasis mb-6">
          L’application utilise des traceurs <strong>techniquement nécessaires</strong> à son fonctionnement,
          ainsi qu’un outil de <strong>mesure d’audience sans cookie</strong> décrit plus bas. Aucun cookie
          publicitaire ni bouton de réseau social n’est déposé, et aucune donnée n’est revendue. Conformément
          au cadre ePrivacy/RGPD, les traceurs strictement nécessaires ne requièrent pas de consentement préalable.
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
                <td><code>token</code></td>
                <td>localStorage</td>
                <td>Jeton d’authentification (JWT) : maintient votre session ouverte entre deux pages.</td>
                <td>Application EMM Pointage</td>
                <td>Jusqu’à déconnexion ou effacement — le jeton lui-même expire après 8 h</td>
                <td>Domaine de l’application</td>
              </tr>
              <tr>
                <td><code>user</code></td>
                <td>localStorage</td>
                <td>Identifiant, nom d’utilisateur et rôle du compte connecté, pour l’affichage de l’interface.</td>
                <td>Application EMM Pointage</td>
                <td>Jusqu’à déconnexion ou effacement</td>
                <td>Domaine de l’application</td>
              </tr>
              <tr>
                <td><code>sw.js</code></td>
                <td>Service worker + abonnement Push</td>
                <td>
                  Réception des notifications, <strong>uniquement si vous les avez autorisées</strong>.
                  L’abonnement transite par le service de notification de votre navigateur.
                </td>
                <td>Application EMM Pointage</td>
                <td>Jusqu’au retrait de l’autorisation ou effacement</td>
                <td>Domaine de l’application</td>
              </tr>
            </tbody>
          </v-table>

          <p class="text-body-2 text-medium-emphasis">
            Aucun cookie publicitaire ni bouton de réseau social n’est déposé.
          </p>
        </section>

        <v-divider class="my-4" />

        <section id="audience" class="mb-6">
          <h2 class="text-h5 mb-3">Mesure d’audience</h2>
          <p class="mb-3">
            L’application utilise <strong>Umami</strong> (service <code>cloud.umami.is</code>) pour mesurer
            la fréquentation, principalement afin de suivre l’usage du formulaire d’inscription.
            Umami fonctionne <strong>sans cookie</strong> et ne dépose rien sur votre appareil :
            il n’apparaît donc pas dans le tableau ci-dessus.
          </p>
          <p class="mb-2">Les informations transmises sont :</p>
          <ul class="list mb-3">
            <li>L’adresse des pages consultées, à chaque navigation.</li>
            <li>Le franchissement des étapes du formulaire d’inscription et sa soumission (avec le type : inscription ou réinscription).</li>
            <li>Les connexions réussies ou échouées à l’espace professeur, avec le rôle du compte pour les connexions réussies.</li>
            <li>L’enregistrement d’un pointage de présence, avec son statut.</li>
          </ul>
          <p class="text-body-2 text-medium-emphasis">
            Ces mesures sont agrégées et ne servent qu’au suivi interne de l’activité du site.
            Aucune donnée nominative d’élève ou de responsable légal n’y est transmise.
          </p>
        </section>

        <v-divider class="my-4" />

        <section id="ressources-tierces" class="mb-6">
          <h2 class="text-h5 mb-3">Ressources chargées depuis un tiers</h2>
          <p>
            La police de caractères de l’interface (<strong>Outfit</strong>) est chargée depuis
            <strong>Google Fonts</strong> (<code>fonts.googleapis.com</code> et
            <code>fonts.gstatic.com</code>). Ce chargement ne dépose aucun cookie, mais il transmet
            à Google l’adresse IP de votre navigateur, comme tout téléchargement de fichier depuis
            un serveur tiers.
          </p>
        </section>

        <v-divider class="my-4" />

        <section id="gestion" class="mb-6">
          <h2 class="text-h5 mb-3">Gérer les cookies et stockages</h2>
          <p>
            Vous pouvez effacer ces données via les paramètres du navigateur ou en utilisant le bouton ci-dessous.
            Celui-ci supprime le jeton de session, les informations de votre compte et, le cas échéant,
            votre abonnement aux notifications. Il vous <strong>déconnectera</strong> de l’application.
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
            <em>Dernière mise à jour : 08/09/2026</em>
          </p>
        </section>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const clearing = ref(false)
const cleared = ref(false)

async function clearAppStorage() {
  clearing.value = true
  try {
    // Clés réellement écrites par l'application (voir stores/user.js)
    ;['token', 'user'].forEach((k) => localStorage.removeItem(k))
    sessionStorage.clear()

    // Retire l'abonnement aux notifications et le service worker (best-effort)
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const reg of regs) {
        const sub = await reg.pushManager?.getSubscription?.()
        if (sub) await sub.unsubscribe()
        await reg.unregister()
      }
    }

    cleared.value = true
  } catch (e) {
    console.warn('[cookies] effacement partiel :', e)
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
