<template>
  <v-container class="py-8">

    <v-card class="rounded-2xl elevation-1">
      <v-card-text class="pa-6 pa-md-8 content">
        <h1 class="text-h4 text-md-h3 mb-4">Mentions légales</h1>
        <p class="text-body-2 text-medium-emphasis mb-6">
          Conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique, il est
          précisé aux utilisateurs l’identité des différents intervenants dans le cadre de la réalisation et
          du suivi du présent site.
        </p>

        <v-divider class="my-4" />

        <section id="editeur" class="mb-6">
          <h2 class="text-h5 mb-3">Éditeur du site</h2>
          <ul class="list">
            <li><strong>Nom / Prénom</strong> : Dohen Geoffrey</li>
            <li><strong>Qualité</strong> : Professeur de musique, éditeur du site</li>
            <li><strong>Localisation</strong> : France</li>
            <li>
              <strong>E-mail</strong> :
              <a href="mailto:geoffrey.doh@gmail.com">geoffrey.doh@gmail.com</a>
            </li>
          </ul>
          <p class="mt-2"><strong>Directeur de la publication</strong> : Dohen Geoffrey</p>
        </section>

        <v-divider class="my-4" />

        <section id="hebergeur" class="mb-6">
          <h2 class="text-h5 mb-3">Hébergeur</h2>
          <ul class="list">
            <li><strong>Hébergeur</strong> : 1hebergement.com</li>
            <li><strong>Adresse</strong> : 10 rue Penthièvre, 75008 PARIS FRANCE</li>
            <li>
              <strong>Téléphone / site</strong> :
              <a href="https://www.1hebergement.com/" target="_blank" rel="noopener">https://www.1hebergement.com/</a>
            </li>
          </ul>
        </section>

        <v-divider class="my-4" />

        <section id="objet" class="mb-6">
          <h2 class="text-h5 mb-3">Objet du site</h2>
          <p>
            <strong>École de Musique de Marpent</strong> — Application interne de pointage, à usage non commercial,
            destinée à la gestion des classes et de la présence des élèves.
          </p>
        </section>

        <v-divider class="my-4" />

        <section id="pi" class="mb-6">
          <h2 class="text-h5 mb-3">Propriété intellectuelle</h2>
          <p>
            Sauf mention contraire, l’ensemble des contenus présents sur ce site (textes, logos, éléments graphiques
            et logiciels) sont la propriété de l’éditeur. Toute reproduction, représentation, modification, publication,
            adaptation de tout ou partie des éléments du site, sur quelque support que ce soit, est interdite sans
            autorisation écrite préalable, hors usages strictement privés et non commerciaux autorisés par la loi.
          </p>
          <p class="mt-3"><em>Crédits éventuels</em> :</p>
          <ul class="list">
            <li>Icônes : Material Design Icons</li>
            <li>Logos / photos : École de Musique de Marpent</li>
          </ul>
        </section>

        <v-divider class="my-4" />

        <section id="responsabilite" class="mb-6">
          <h2 class="text-h5 mb-3">Responsabilité</h2>
          <p>
            L’éditeur met tout en œuvre pour fournir des informations fiables mais ne saurait garantir l’exactitude,
            l’exhaustivité et l’actualité des contenus. L’utilisation du site se fait sous la seule responsabilité
            de l’utilisateur. Le site peut contenir des liens vers des sites tiers. L’éditeur n’exerce aucun contrôle
            sur ces sites et décline toute responsabilité quant à leurs contenus et pratiques.
          </p>
        </section>

        <v-divider class="my-4" />

        <section id="donnees" class="mb-6">
          <h2 class="text-h5 mb-3">Données personnelles &amp; cookies</h2>
          <p>Le traitement des données et l’usage des cookies sont détaillés dans :</p>
          <ul class="list">
            <li><RouterLink to="/privacy">Politique de confidentialité</RouterLink></li>
            <li><RouterLink to="/cookies">Politique cookies</RouterLink></li>
          </ul>
        </section>

        <v-divider class="my-4" />

        <section id="droit" class="mb-6">
          <h2 class="text-h5 mb-3">Droit applicable</h2>
          <p>
            Le présent site est régi par le droit français. En cas de litige et à défaut d’accord amiable, les tribunaux
            compétents seront ceux de <strong>Paris</strong>.
          </p>
        </section>

        <v-divider class="my-4" />

        <section id="contact" class="mb-6">
          <h2 class="text-h5 mb-3">Contact</h2>
          <p>
            Pour toute question ou notification légale, vous pouvez écrire à :
            <a href="mailto:geoffrey.doh@gmail.com">geoffrey.doh@gmail.com</a>
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
import { onMounted } from 'vue'

const dev = import.meta.env.DEV

onMounted(() => {
  document.title = 'Mentions légales — EMM Pointage'
})
</script>

<style scoped>
.content :where(h1, h2) {
  line-height: 1.25;
}
.content .list {
  margin: 0.25rem 0 0 0;
  padding-left: 1.25rem;
}
.content a {
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
