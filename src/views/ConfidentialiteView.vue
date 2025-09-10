<template>
  <v-container class="py-8">

    <v-card class="rounded-2xl elevation-1">
      <v-card-text class="pa-6 pa-md-8 content">
        <h1 class="text-h4 text-md-h3 mb-4">Politique de confidentialité</h1>
        <p class="text-body-2 text-medium-emphasis mb-6">
          Cette politique décrit la manière dont l’<strong>École de Musique de Marpent</strong> traite les données personnelles
          dans le cadre de l’application interne de pointage (non commerciale).
        </p>

        <v-divider class="my-4" />

        <section id="responsable" class="mb-6">
          <h2 class="text-h5 mb-3">Responsable de traitement</h2>
          <ul class="list">
            <li><strong>Éditeur</strong> : Dohen Geoffrey</li>
            <li><strong>Contact</strong> : <a href="mailto:geoffrey.doh@gmail.com">geoffrey.doh@gmail.com</a></li>
            <li><strong>Localisation</strong> : France</li>
          </ul>
        </section>

        <v-divider class="my-4" />

        <section id="donnees" class="mb-6">
          <h2 class="text-h5 mb-3">Catégories de données traitées</h2>
          <ul class="list">
            <li><strong>Comptes utilisateurs (profs / admin)</strong> : nom, prénom, identifiants.</li>
            <li><strong>Élèves</strong> : prénom, nom, classe(s), commentaires d’assiduité.</li>
            <li><strong>Présences</strong> : dates de séance, statut (présent/absent/excusé), commentaire associé.</li>
            <li><strong>Aucun suivi marketing</strong> : pas d’analytics tiers, pas de prospection.</li>
          </ul>
        </section>

        <v-divider class="my-4" />

        <section id="finalites" class="mb-6">
          <h2 class="text-h5 mb-3">Finalités</h2>
          <ul class="list">
            <li>Gestion des classes, séances et pointage de présence.</li>
            <li>Administration des accès (professeur / administrateur) et sécurité.</li>
            <li>Production de vues de synthèse (taux de présence par classe, historique).</li>
            <li>Maintenance applicative et amélioration continue (logs techniques).</li>
          </ul>
        </section>

        <v-divider class="my-4" />

        <section id="base-legale" class="mb-6">
          <h2 class="text-h5 mb-3">Base légale (RGPD art. 6)</h2>
          <ul class="list">
            <li><strong>Exécution d’un contrat</strong> ou mesures précontractuelles (organisation pédagogique).</li>
            <li><strong>Intérêt légitime</strong> de l’école : gestion interne de l’assiduité et de l’organisation des cours.</li>
            <li><strong>Obligations légales</strong> éventuelles (justificatifs internes, conformité associative/éducative).</li>
          </ul>
        </section>

        <v-divider class="my-4" />

        <section id="destinataires" class="mb-6">
          <h2 class="text-h5 mb-3">Destinataires</h2>
          <ul class="list">
            <li>Accès restreint aux <strong>administrateurs</strong> et <strong>professeurs</strong> concernés.</li>
            <li><strong>Hébergeur</strong> (sous-traitant technique) : 1hebergement.com — accès limité et encadré.</li>
            <li>Pas de cession de données à des tiers à des fins commerciales.</li>
          </ul>
        </section>

        <v-divider class="my-4" />

        <section id="hebergement" class="mb-6">
          <h2 class="text-h5 mb-3">Hébergement &amp; transferts</h2>
          <ul class="list">
            <li><strong>Serveur applicatif</strong> : 1hebergement.com (France).</li>
            <li><strong>Base de données</strong> : UE</li>
            <li>Aucun transfert hors UE en l’état. Si nécessaire, des garanties appropriées seront mises en place.</li>
          </ul>
        </section>

        <v-divider class="my-4" />

        <section id="durees" class="mb-6">
          <h2 class="text-h5 mb-3">Durées de conservation</h2>
          <ul class="list">
            <li><strong>Élèves &amp; classes</strong> : durée de l’année scolaire + <strong>3 ans</strong> d’archives pédagogiques .</li>
            <li><strong>Présences</strong> : <strong>3 ans</strong> (historique pédagogique interne) .</li>
            <li><strong>Logs techniques</strong> : jusqu’à <strong>12 mois</strong> maximum .</li>
          </ul>
          <p class="text-body-2 text-medium-emphasis mt-2">
            Au-delà, les données sont supprimées ou anonymisées lorsque cela est possible.
          </p>
        </section>

        <v-divider class="my-4" />

        <section id="securite" class="mb-6">
          <h2 class="text-h5 mb-3">Sécurité</h2>
          <ul class="list">
            <li>Mots de passe stockés de façon sécurisée.</li>
            <li>Contrôles d’accès par rôles (professeur / administrateur).</li>
            <li>Chiffrement des communications (<strong>HTTPS/TLS</strong>).</li>
            <li>Journalisation et supervision technique.</li>
          </ul>
        </section>

        <v-divider class="my-4" />

        <section id="droits" class="mb-6">
          <h2 class="text-h5 mb-3">Vos droits</h2>
          <p>
            Conformément au RGPD et à la loi “Informatique et Libertés”, vous disposez des droits d’<strong>accès</strong>,
            <strong>rectification</strong>, <strong>effacement</strong>, <strong>limitation</strong>, <strong>opposition</strong>
            et <strong>portabilité</strong> (si applicable).
          </p>
          <p class="mt-2">
            Pour les exercer, contactez : <a href="mailto:geoffrey.doh@gmail.com">geoffrey.doh@gmail.com</a>, en précisant
            votre identité et l’objet de votre demande. Une réponse vous sera apportée sous un mois (prolongeable selon complexité).
          </p>
          <p class="mt-2">
            En cas de difficulté, vous pouvez saisir la <strong>CNIL</strong> (<a
              href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a>).
          </p>
        </section>

        <v-divider class="my-4" />

        <section id="cookies" class="mb-6">
          <h2 class="text-h5 mb-3">Cookies &amp; traceurs</h2>
          <p>
            L’application n’utilise que des mécanismes techniques indispensables au fonctionnement (p. ex. jeton d’authentification).
            Aucun cookie de publicité ou d’analytics tiers n’est déposé.
          </p>
          <p class="mt-2">
            Détails dans la <RouterLink to="/cookies">Politique cookies</RouterLink>. Voir aussi les
            <RouterLink to="/mentions-legales">Mentions légales</RouterLink>.
          </p>
        </section>

        <section id="maj" class="mb-2">
          <h2 class="text-h5 mb-3">Mises à jour</h2>
          <p>
            La présente politique peut évoluer. Toute modification substantielle sera signalée dans l’application.
          </p>
          <p class="text-body-2 text-medium-emphasis mt-4">
            <em>Dernière mise à jour : 10/09/2025 — Version 1.0</em>
          </p>
        </section>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
const dev = import.meta.env.DEV

onMounted(() => {
  document.title = 'Politique de confidentialité — EMM Pointage'
})
</script>

<style scoped>
.content :where(h1, h2) { line-height: 1.25; }
.content .list { margin: 0.25rem 0 0 0; padding-left: 1.25rem; }
.content a { text-decoration: underline; text-underline-offset: 2px; }
</style>
