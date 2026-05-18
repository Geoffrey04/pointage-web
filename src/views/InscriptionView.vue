<template>

  <!-- ══════════════════════════════════════════════
       Phase 0 — Page d'accueil (cotisation)
  ══════════════════════════════════════════════ -->
  <div v-if="phase === 'landing'" class="landing">
    <div class="landing-btn-bar">
      <v-btn
        color="#C41E3A"
        block
        size="x-large"
        class="landing-btn"
        append-icon="mdi-arrow-right"
        @click="phase = 'choice'"
      >
        S'inscrire&nbsp;/&nbsp;Se réinscrire
      </v-btn>
    </div>
    <img src="/cotisation.png" class="cotisation-img" alt="Informations sur les cours et cotisations" />
  </div>

  <!-- ══════════════════════════════════════════════
       Phase 1 — Choix du dossier
  ══════════════════════════════════════════════ -->
  <div v-else-if="phase === 'choice'" class="choice-wrap">

    <div class="text-center mb-8">
      <div class="choice-header-title">École de Musique de Marpent</div>
      <div class="text-body-2 text-medium-emphasis mt-1">Choisissez votre dossier</div>
    </div>

    <div class="choice-card" @click="startForm('inscription')">
      <div class="choice-title">Inscription</div>
      <div class="choice-sub">Première inscription à l'école de musique</div>
    </div>

    <div class="choice-card mt-5" @click="startForm('reinscription')">
      <div class="choice-title">Réinscription</div>
      <div class="choice-sub">Renouveler l'inscription d'un élève déjà inscrit</div>
    </div>

  </div>

  <!-- ══════════════════════════════════════════════
       Phase 2 — Formulaire multi-étapes
  ══════════════════════════════════════════════ -->
  <v-container v-else class="inscription-wrap pa-3" max-width="680">

    <!-- En-tête -->
    <div class="text-center mb-4">
      <div class="text-h5 font-weight-bold" style="color:#C41E3A; font-family:'Poppins',sans-serif">
        École de Musique de Marpent
      </div>
      <div class="text-body-2 text-medium-emphasis mt-1">
        Dossier de {{ type === 'inscription' ? 'première inscription' : 'réinscription' }}
      </div>
    </div>

    <!-- Indicateur d'étapes -->
    <div class="step-indicator mb-5">
      <div
        v-for="s in STEPS"
        :key="s.n"
        class="step-item"
        :class="{ active: step === s.n, done: step > s.n }"
      >
        <div class="step-circle">
          <v-icon v-if="step > s.n" size="14">mdi-check</v-icon>
          <span v-else>{{ s.n }}</span>
        </div>
        <div class="step-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- Formulaire par étapes -->
    <v-window v-model="step" class="step-window" :touch="false">

      <!-- ── Étape 1 : Fiche de renseignements ── -->
      <v-window-item :value="1">
        <v-form ref="form1Ref" v-model="form1Valid">

          <!-- État civil -->
          <v-card class="rounded-xl mb-4" elevation="2">
            <v-card-title class="section-title">État civil de l'élève</v-card-title>
            <v-card-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="eleve.nom" label="Nom *" :rules="[req]" variant="outlined" density="comfortable" autocomplete="off" maxlength="60" @input="eleve.nom = sanitizeName(eleve.nom, 60)" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="eleve.prenom" label="Prénom *" :rules="[req]" variant="outlined" density="comfortable" autocomplete="off" maxlength="60" @input="eleve.prenom = sanitizeName(eleve.prenom, 60)" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="eleve.dateNaissance"
                    label="Date de naissance *"
                    :rules="[req, reqDate]"
                    variant="outlined"
                    density="comfortable"
                    placeholder="JJ/MM/AAAA"
                    maxlength="10"
                    autocomplete="off"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="eleve.lieuNaissance" label="Lieu de naissance *" :rules="[req]" variant="outlined" density="comfortable" autocomplete="off" maxlength="80" @input="eleve.lieuNaissance = sanitizeName(eleve.lieuNaissance, 80)" />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Coordonnées -->
          <v-card class="rounded-xl mb-4" elevation="2">
            <v-card-title class="section-title">Coordonnées</v-card-title>
            <v-card-text>
              <v-text-field v-model="parents.pere" label="Nom et prénom du père / tuteur légal *" :rules="[req]" variant="outlined" density="comfortable" class="mb-2" autocomplete="off" maxlength="80" @input="parents.pere = sanitizeName(parents.pere, 80)" />
              <v-text-field v-model="parents.mere" label="Nom et prénom de la mère / tutrice légale *" :rules="[req]" variant="outlined" density="comfortable" class="mb-2" autocomplete="off" maxlength="80" @input="parents.mere = sanitizeName(parents.mere, 80)" />
              <v-row dense>
                <v-col cols="3" sm="2">
                  <v-text-field v-model="parents.adresseNumero" label="N° *" :rules="[req]" variant="outlined" density="comfortable" autocomplete="off" maxlength="10" @input="parents.adresseNumero = formatNumero(parents.adresseNumero)" />
                </v-col>
                <v-col cols="9" sm="10">
                  <v-text-field v-model="parents.adresseRue" label="Rue *" :rules="[req]" variant="outlined" density="comfortable" autocomplete="street-address" maxlength="150" />
                </v-col>
                <v-col cols="5" sm="4">
                  <v-text-field v-model="parents.codePostal" label="Code postal *" :rules="[req]" variant="outlined" density="comfortable" autocomplete="postal-code" maxlength="5" @input="parents.codePostal = formatPostal(parents.codePostal)" />
                </v-col>
                <v-col cols="7" sm="8">
                  <v-text-field v-model="parents.ville" label="Ville *" :rules="[req]" variant="outlined" density="comfortable" autocomplete="address-level2" maxlength="80" @input="parents.ville = sanitizeName(parents.ville, 80)" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="parents.telephone" label="Téléphone *" :rules="[req, reqPhone]" variant="outlined" density="comfortable" autocomplete="tel" type="tel" hint="0X XX XX XX XX ou +33 X XX XX XX XX" @input="parents.telephone = formatPhone(parents.telephone)" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="parents.email" label="Email *" :rules="[req, reqEmail]" variant="outlined" density="comfortable" autocomplete="email" type="email" maxlength="150" />
                </v-col>
              </v-row>

              <!-- 2ème adresse optionnelle -->
              <div class="mt-3">
                <v-btn
                  variant="text"
                  color="#C41E3A"
                  size="small"
                  :prepend-icon="adresse2Visible ? 'mdi-minus' : 'mdi-plus'"
                  @click="adresse2Visible = !adresse2Visible"
                >
                  {{ adresse2Visible ? 'Supprimer la 2ème adresse' : 'Ajouter une 2ème adresse' }}
                </v-btn>
              </div>
              <v-expand-transition>
                <div v-if="adresse2Visible" class="mt-3">
                  <v-divider class="mb-3" />
                  <div class="text-caption text-medium-emphasis mb-2">Cette adresse correspond à :</div>
                  <v-btn-toggle v-model="parents2Referent" mandatory color="#C41E3A" variant="outlined" rounded="lg" density="comfortable" class="mb-3">
                    <v-btn value="pere">Père / Tuteur légal</v-btn>
                    <v-btn value="mere">Mère / Tutrice légale</v-btn>
                  </v-btn-toggle>
                  <v-row dense>
                    <v-col cols="3" sm="2">
                      <v-text-field v-model="parents2.adresseNumero" label="N°" variant="outlined" density="comfortable" autocomplete="off" maxlength="10" @input="parents2.adresseNumero = formatNumero(parents2.adresseNumero)" />
                    </v-col>
                    <v-col cols="9" sm="10">
                      <v-text-field v-model="parents2.adresseRue" label="Rue" variant="outlined" density="comfortable" maxlength="150" />
                    </v-col>
                    <v-col cols="5" sm="4">
                      <v-text-field v-model="parents2.codePostal" label="Code postal" variant="outlined" density="comfortable" maxlength="5" @input="parents2.codePostal = formatPostal(parents2.codePostal)" />
                    </v-col>
                    <v-col cols="7" sm="8">
                      <v-text-field v-model="parents2.ville" label="Ville" variant="outlined" density="comfortable" maxlength="80" @input="parents2.ville = sanitizeName(parents2.ville, 80)" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="parents2.telephone" label="Téléphone" :rules="[reqPhone]" variant="outlined" density="comfortable" type="tel" @input="parents2.telephone = formatPhone(parents2.telephone)" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="parents2.email" label="Email" variant="outlined" density="comfortable" type="email" maxlength="150" />
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>
            </v-card-text>
          </v-card>

          <!-- Antécédents musicaux (inscription uniquement) -->
          <template v-if="type === 'inscription'">
            <v-card class="rounded-xl mb-4" elevation="2">
              <v-card-title class="section-title">Antécédents musicaux</v-card-title>
              <v-card-text>
                <div class="text-body-2 mb-2">A déjà suivi une formation musicale :</div>
                <v-btn-toggle v-model="antecedents.formationOui" mandatory color="#C41E3A" variant="outlined" rounded="lg" density="comfortable" class="mb-3">
                  <v-btn :value="true">Oui</v-btn>
                  <v-btn :value="false">Non</v-btn>
                </v-btn-toggle>
                <v-row v-if="antecedents.formationOui" dense>
                  <v-col cols="6">
                    <v-select v-model="antecedents.formationDuree" :items="DUREES" label="Durée" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model="antecedents.formationEndroit" label="Endroit" variant="outlined" density="comfortable" />
                  </v-col>
                </v-row>

                <v-divider class="my-3" />

                <div class="text-body-2 mb-2">A déjà pratiqué un instrument :</div>
                <v-btn-toggle v-model="antecedents.instrumentOui" mandatory color="#C41E3A" variant="outlined" rounded="lg" density="comfortable" class="mb-3">
                  <v-btn :value="true">Oui</v-btn>
                  <v-btn :value="false">Non</v-btn>
                </v-btn-toggle>
                <v-row v-if="antecedents.instrumentOui" dense>
                  <v-col cols="12" sm="4">
                    <v-select v-model="antecedents.instrumentNom" :items="INSTRUMENTS" label="Instrument" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="6" sm="4">
                    <v-select v-model="antecedents.instrumentDuree" :items="DUREES" label="Durée" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="6" sm="4">
                    <v-text-field v-model="antecedents.instrumentEndroit" label="Endroit" variant="outlined" density="comfortable" />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Instruments par ordre de préférence -->
            <v-card class="rounded-xl mb-4" elevation="2">
              <v-card-title class="section-title">Instrument(s) souhaité(s) *</v-card-title>
              <v-card-text>
                <div class="text-caption text-medium-emphasis mb-3">
                  Indiquez vos préférences par ordre de priorité.
                </div>
                <div
                  v-for="(_, idx) in instrumentPrefs"
                  :key="idx"
                  class="d-flex align-center ga-2 mb-2"
                >
                  <v-select
                    v-model="instrumentPrefs[idx]"
                    :items="availableInstruments(idx)"
                    :label="`Choix ${idx + 1}`"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    style="flex:1"
                  />
                  <v-btn
                    v-if="instrumentPrefs.length > 1"
                    icon
                    variant="text"
                    color="red"
                    size="small"
                    @click="removeInstrumentPref(idx)"
                  >
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
                <v-btn
                  v-if="instrumentPrefs.length < INSTRUMENTS.length"
                  variant="text"
                  color="#C41E3A"
                  size="small"
                  prepend-icon="mdi-plus"
                  class="mt-1"
                  @click="addInstrumentPref"
                >
                  Ajouter un choix
                </v-btn>
                <div v-if="showInstrumentError" class="text-caption text-red mt-2">
                  Veuillez choisir au moins un instrument.
                </div>
              </v-card-text>
            </v-card>

            <!-- Observations -->
            <v-card class="rounded-xl mb-4" elevation="2">
              <v-card-title class="section-title">Observations diverses</v-card-title>
              <v-card-text>
                <div class="text-body-2 mb-2">Inscrit à d'autres activités :</div>
                <v-btn-toggle v-model="observations.autresActivitesOui" mandatory color="#C41E3A" variant="outlined" rounded="lg" density="comfortable" class="mb-3">
                  <v-btn :value="true">Oui</v-btn>
                  <v-btn :value="false">Non</v-btn>
                </v-btn-toggle>
                <div v-if="observations.autresActivitesOui">
                  <div
                    v-for="(act, idx) in observations.autresActivites"
                    :key="idx"
                    class="d-flex align-center ga-2 mb-2"
                  >
                    <v-text-field v-model="act.activite" label="Activité" variant="outlined" density="comfortable" style="flex:1" />
                    <v-text-field v-model="act.endroit" label="Endroit" variant="outlined" density="comfortable" style="flex:1" />
                    <v-btn
                      v-if="observations.autresActivites.length > 1"
                      icon variant="text" color="red" size="small"
                      @click="removeActivite(idx)"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                  <v-btn
                    variant="text" color="#C41E3A" size="small"
                    prepend-icon="mdi-plus" class="mt-1"
                    @click="addActivite"
                  >
                    Ajouter une activité
                  </v-btn>
                </div>
                <v-textarea v-model="observations.complement" label="Informations complémentaires" variant="outlined" density="comfortable" rows="2" auto-grow class="mt-2" />
              </v-card-text>
            </v-card>
          </template>

          <!-- Avis (réinscription uniquement) -->
          <template v-else>
            <v-card class="rounded-xl mb-4" elevation="2">
              <v-card-title class="section-title">Votre avis nous intéresse !</v-card-title>
              <v-card-text>
                <div class="text-body-2 text-medium-emphasis mb-2">
                  Commentaires sur l'année écoulée, attentes pour l'année à venir et nouvelles idées (cours, activités...) :
                </div>
                <v-textarea v-model="avis" variant="outlined" density="comfortable" rows="5" auto-grow />
              </v-card-text>
            </v-card>
          </template>

        </v-form>
      </v-window-item>

      <!-- ── Étape 2 : Règlement intérieur ── -->
      <v-window-item :value="2">
        <v-card class="rounded-xl mb-4" elevation="2">
          <v-card-title class="section-title">Règlement Intérieur de l'Ecole de Musique de MARPENT</v-card-title>
          <v-card-text class="reglement-text">
            <ol>
              <li>
                Les cours de l'école de musique sont <strong>GRATUITS</strong>. Néanmoins, les élèves doivent s'acquitter d'une participation annuelle aux frais de l'école de musique suivant l'âge et le niveau musical suivi :
                <table class="cotis-table my-2">
                  <tr><td>Eveil Musical</td><td>0 €</td></tr>
                  <tr><td>Niveau Initial</td><td>20 €</td></tr>
                  <tr><td>Niveau 1<sup>er</sup> cycle et 2<sup>ème</sup> cycle</td><td>30 €</td></tr>
                  <tr><td>Adultes</td><td>20 €</td></tr>
                </table>
                <em>Cette somme doit être versée lors de l'inscription à l'ordre de l'Harmonie Communale de MARPENT (un reçu est établi, l'élève est tenu de le présenter en cas de litige). En aucun cas, la somme versée ne pourra être restituée.</em>
              </li>
              <li>
                Tous les élèves inscrits sont tenus, à la demande des professeurs, :
                <ul class="mt-1">
                  <li>De se présenter aux examens,</li>
                  <li>De participer aux auditions de l'école de musique</li>
                  <li>D'assister aux répétitions et prestations de l'orchestre de l'école de musique,</li>
                  <li>D'assister aux répétitions et prestations de l'harmonie.</li>
                  <li>De participer aux activités (spectacle, danses, chants...) de l'école de musique ou de l'harmonie.</li>
                </ul>
              </li>
              <li>A chaque cours (formation musicale et instrumentale), lors des répétitions/prestations de l'orchestre et lors des répétitions/prestations de l'harmonie, un pointage des élèves est effectué. Trois absences consécutives ou trop d'absences en cours d'année entraînent le retrait de l'instrument ou l'exclusion de l'école de musique.</li>
              <li>Si les professeurs constatent un manque de travail de l'élève ou des oublis répétitifs de matériel, un avertissement écrit sera envoyé. Les professeurs décideront de suspendre les cours pour l'année ou de reprendre l'instrument si les lacunes persistent.</li>
              <li>En cas d'absence en cours de formation instrumentale, <strong><u>il est indispensable de prévenir le professeur d'instrument 48h à l'avance</u></strong> pour lui permettre de réorganiser l'horaire des cours et lui éviter une attente de 30 minutes. Le non-respect à cette règle pourra entraîner la suspension des cours pendant l'année.</li>
              <li>Les horaires des cours pourront être modifiés suivant l'horaire de travail du professeur</li>
              <li>Le diplôme de musique sera remis lors d'une manifestation musicale ; l'élève absent devra se présenter à l'école de musique pour le recevoir (aucun diplôme ne sera envoyé par courrier).</li>
              <li>L'élève est tenu d'entretenir son instrument, d'acheter des anches (pour clarinettes et saxos) et de posséder une méthode. Les dégâts occasionnés par un manque d'entretien ou par une détérioration volontaire sont à la charge de l'élève</li>
              <li>L'orchestre de l'école de musique est composé des élèves de l'école de musique, de leurs professeurs, des jeunes de l'harmonie dont l'âge ne dépasse pas 25 ans et des musicien(ne)s confirmés désirant apprendre un nouvel instrument. Exceptionnellement, les chefs de l'orchestre, en accord avec le responsable de l'école de musique, pourront faire appel à des renforts issus de l'harmonie uniquement pour compenser des absences lors des prestations.</li>
              <li>Tout membre de l'orchestre est tenu à la ponctualité, de prendre soin des partitions qui lui sont confiées et de porter le polo de l'orchestre lors des prestations.</li>
              <li>En cas d'absence à l'orchestre, <strong><u>il est indispensable de prévenir les chefs de l'orchestre 48h à l'avance</u></strong> pour leur permettre de réorganiser leur effectif afin d'assurer la répétition ou la prestation dans de bonnes conditions. Le non-respect à cette règle pourra entraîner la suspension des cours pendant l'année.</li>
              <li>Tout manque de respect envers un professeur de l'école de Musique ou lors des répétitions de l'orchestre entraînera systématiquement l'exclusion.</li>
              <li>Tout courrier doit être adressé à « Ecole de Musique, Mairie de et à MARPENT – 59164 »</li>
            </ol>
          </v-card-text>
        </v-card>

        <v-card class="rounded-xl mb-4" elevation="2">
          <v-card-text>
            <v-checkbox v-model="reglementAccepte" color="#C41E3A" hide-details>
              <template #label>
                <span class="text-body-2 font-weight-medium">
                  J'ai lu et j'accepte le règlement intérieur de l'École de Musique de Marpent
                </span>
              </template>
            </v-checkbox>
            <div v-if="showReglementError" class="text-caption text-red mt-2 ml-10">
              Vous devez accepter le règlement pour continuer.
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- ── Étape 3 : Droit à l'image ── -->
      <v-window-item :value="3">
        <v-card class="rounded-xl mb-4" elevation="2">
          <v-card-title class="section-title">Autorisation de prises de vues et de diffusion d'images</v-card-title>
          <v-card-text class="reglement-text">
            <p class="mb-3">Madame, Monsieur,</p>
            <p class="mb-3">
              De nombreuses activités conduisent notre établissement à réaliser des photographies ou des vidéos sur
              lesquelles apparaissent les élèves (journal, concerts, spectacles, cours, activités et sorties
              pédagogiques, etc ...).
            </p>
            <p class="mb-3">L'école de musique peut également être sollicitée par la presse.</p>
            <p class="mb-3">
              Il ne s'agit pas de photographies individuelles d'identité mais de photos de groupe ou bien de vues
              montrant votre enfant en activité.
            </p>
            <p class="mb-3">
              La loi relative au droit à l'image oblige l'établissement à demander une autorisation écrite au
              responsable légal de l'enfant pour la prise de vue et la diffusion de ces prises de vue.
            </p>
            <p class="mb-4">
              Un refus de votre part aura pour conséquence, soit d'éloigner votre enfant lors des prises de vue,
              soit de masquer son visage.
            </p>
            <p>Merci de compléter l'autorisation suivante :</p>
          </v-card-text>
        </v-card>

        <div class="auth-choices mb-2">
          <div
            class="auth-card"
            :class="{ 'auth-card--active-yes': autorisationImage === true }"
            @click="autorisationImage = true"
          >
            <v-icon size="28" :color="autorisationImage === true ? '#fff' : '#2e7d32'" class="mb-1">mdi-check-circle-outline</v-icon>
            <div class="auth-card-title">Je donne mon accord</div>
            <div class="auth-card-sub">J'autorise la prise de vues et la diffusion des images</div>
          </div>
          <div
            class="auth-card"
            :class="{ 'auth-card--active-no': autorisationImage === false }"
            @click="autorisationImage = false"
          >
            <v-icon size="28" :color="autorisationImage === false ? '#fff' : '#C41E3A'" class="mb-1">mdi-close-circle-outline</v-icon>
            <div class="auth-card-title">Je ne donne pas mon accord</div>
            <div class="auth-card-sub">Je refuse l'utilisation de photos ou vidéos</div>
          </div>
        </div>
        <div v-if="showImageError" class="text-caption text-red mb-3 ml-1">
          Veuillez indiquer votre choix.
        </div>
      </v-window-item>

      <!-- ── Étape 4 : Récapitulatif & Signature ── -->
      <v-window-item :value="4">
        <v-card class="rounded-xl mb-4" elevation="2">
          <v-card-title class="section-title">Récapitulatif</v-card-title>
          <v-card-text>
            <div class="recap-row"><span>Type</span><strong>{{ type === 'inscription' ? 'Inscription' : 'Réinscription' }}</strong></div>
            <div class="recap-row"><span>Élève</span><strong>{{ eleve.prenom }} {{ eleve.nom }}</strong></div>
            <div class="recap-row"><span>Naissance</span><strong>{{ eleve.dateNaissance }}{{ eleve.lieuNaissance ? ' — ' + eleve.lieuNaissance : '' }}</strong></div>
            <div class="recap-row"><span>Téléphone</span><strong>{{ parents.telephone || '—' }}</strong></div>
            <div class="recap-row"><span>Email</span><strong>{{ parents.email || '—' }}</strong></div>
            <div v-if="type === 'inscription' && instruments.length" class="recap-row">
              <span>Instruments</span>
              <strong>{{ instruments.map((v, i) => (i + 1) + '. ' + v).join(' — ') }}</strong>
            </div>
            <div class="recap-row"><span>Règlement</span><strong style="color:#2e7d32">☑ Lu et approuvé</strong></div>
            <div class="recap-row">
              <span>Droit à l'image</span>
              <strong :style="{ color: autorisationImage ? '#2e7d32' : '#C41E3A' }">
                {{ autorisationImage ? '☑ Autorisé(e)' : '☐ Refusé(e)' }}
              </strong>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="rounded-xl mb-4" elevation="2">
          <v-card-title class="section-title">Signature</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12" sm="7">
                <v-text-field
                  v-model="signataire"
                  label="Nom du signataire *"
                  :rules="[req]"
                  variant="outlined"
                  density="comfortable"
                  hint="Nom et prénom du parent ou tuteur légal"
                  persistent-hint
                  autocomplete="off"
                  maxlength="80"
                  @input="signataire = sanitizeName(signataire, 80)"
                />
              </v-col>
              <v-col cols="12" sm="5">
                <v-text-field
                  v-model="faita"
                  label="Fait à (ville) *"
                  :rules="[req]"
                  variant="outlined"
                  density="comfortable"
                  autocomplete="off"
                  maxlength="80"
                  @input="faita = sanitizeName(faita, 80)"
                />
              </v-col>
            </v-row>
            <!-- Signature manuscrite -->
            <div class="mt-4">
              <div class="text-body-2 font-weight-medium mb-2">Votre signature *</div>
              <div class="signature-pad-wrap">
                <canvas ref="signaturePadRef" class="signature-canvas"></canvas>
              </div>
              <div class="d-flex justify-end mt-1">
                <v-btn variant="text" size="small" color="grey" prepend-icon="mdi-eraser" @click="clearSignature">
                  Effacer
                </v-btn>
              </div>
              <div v-if="showSignatureError" class="text-caption text-red mt-1">
                Veuillez signer avant d'envoyer.
              </div>
            </div>

            <div class="text-caption text-medium-emphasis mt-3">
              Date : {{ todayLabel }}
            </div>
          </v-card-text>
        </v-card>

        <v-alert v-if="submitError" type="error" variant="tonal" class="mb-3">{{ submitError }}</v-alert>
      </v-window-item>

    </v-window>

    <!-- Boutons de navigation -->
    <div class="nav-btns mt-2">
      <v-btn
        variant="outlined"
        color="#C41E3A"
        :disabled="submitting"
        prepend-icon="mdi-chevron-left"
        @click="step > 1 ? prev() : phase = 'choice'"
      >
        Précédent
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="step < 4"
        color="#C41E3A"
        variant="flat"
        append-icon="mdi-chevron-right"
        @click="next"
      >
        Suivant
      </v-btn>
      <v-btn
        v-else
        color="#C41E3A"
        variant="flat"
        :loading="submitting"
        prepend-icon="mdi-send"
        @click="submit"
      >
        Envoyer le dossier
      </v-btn>
    </div>

  </v-container>

  <!-- Snackbar erreurs de validation -->
  <v-snackbar
    v-model="snackbarVisible"
    location="top"
    color="error"
    :timeout="5000"
    multi-line
  >
    <div class="text-body-2 font-weight-bold mb-1">Champs à corriger :</div>
    <ul class="snack-list">
      <li v-for="msg in snackbarMessages" :key="msg">{{ msg }}</li>
    </ul>
    <template #actions>
      <v-btn variant="text" color="white" size="small" @click="snackbarVisible = false">Fermer</v-btn>
    </template>
  </v-snackbar>

  <!-- Confirmation -->
  <v-overlay v-model="submitted" persistent class="align-center justify-center">
    <v-card class="rounded-xl pa-6 text-center confirmation-card" max-width="420" elevation="8">
      <v-icon size="64" color="#2e7d32" class="mb-4">mdi-check-circle</v-icon>
      <div class="text-h6 font-weight-bold mb-2" style="font-family:'Poppins',sans-serif">
        Dossier envoyé !
      </div>
      <div class="text-body-2 text-medium-emphasis mb-4">
        Votre dossier de {{ type === 'inscription' ? 'inscription' : 'réinscription' }} pour
        <strong>{{ eleve.prenom }} {{ eleve.nom }}</strong> a bien été transmis.
      </div>
      <v-btn
        variant="outlined"
        color="#C41E3A"
        class="mt-3"
        @click="submitted = false; phase = 'landing'"
      >
        Fermer
      </v-btn>
    </v-card>
  </v-overlay>

</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { api } from '@/stores/user'
import SignaturePad from 'signature_pad'

const STEPS = [
  { n: 1, label: 'Renseignements' },
  { n: 2, label: 'Règlement' },
  { n: 3, label: 'Image' },
  { n: 4, label: 'Signature' },
]

const INSTRUMENTS = [
  'Hautbois', 'Flûte traversière', 'Clarinette',
  'Saxophone', 'Trompette', "Cor d'harmonie",
  'Trombone', 'Euphonium/Basse', 'Percussion',
]

const DUREES = [
  "Moins d'1 an", '1 an', '2 ans', '3 à 5 ans', 'Plus de 5 ans',
]

// ─── Navigation globale ──────────────────────────────────────
const phase = ref('landing')

function startForm(selectedType) {
  type.value = selectedType
  step.value = 1
  phase.value = 'form'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ─── État du formulaire ──────────────────────────────────────
const type = ref('inscription')
const step = ref(1)

const eleve = ref({ nom: '', prenom: '', dateNaissance: '', lieuNaissance: '' })
const parents = ref({ pere: '', mere: '', adresseNumero: '', adresseRue: '', codePostal: '', ville: '', telephone: '', email: '' })
const parents2 = ref({ adresseNumero: '', adresseRue: '', codePostal: '', ville: '', telephone: '', email: '' })
const adresse2Visible = ref(false)
const parents2Referent = ref('pere')
const antecedents = ref({ formationOui: false, formationDuree: '', formationEndroit: '', instrumentOui: false, instrumentNom: '', instrumentDuree: '', instrumentEndroit: '' })
const instrumentPrefs = ref([''])
const observations = ref({ autresActivitesOui: false, autresActivites: [{ activite: '', endroit: '' }], complement: '' })
const avis = ref('')
const reglementAccepte = ref(false)
const autorisationImage = ref(null)
const signataire = ref('')
const faita = ref('')

const form1Ref = ref(null)
const form1Valid = ref(false)
const submitting = ref(false)
const submitted = ref(false)
const submitError = ref(null)

const showInstrumentError = ref(false)
const showReglementError = ref(false)
const showImageError = ref(false)
const showSignatureError = ref(false)

const snackbarVisible = ref(false)
const snackbarMessages = ref([])

function showSnackbar(msgs) {
  snackbarMessages.value = msgs
  snackbarVisible.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const signaturePadRef = ref(null)
let signaturePadInstance = null

watch(step, async (val) => {
  if (val === 4) {
    await nextTick()
    const canvas = signaturePadRef.value
    if (!canvas) return
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    canvas.getContext('2d').scale(ratio, ratio)
    if (signaturePadInstance) signaturePadInstance.off()
    signaturePadInstance = new SignaturePad(canvas, { backgroundColor: 'rgb(255,255,255)' })
  }
})

onBeforeUnmount(() => { signaturePadInstance?.off() })

function clearSignature() {
  signaturePadInstance?.clear()
  showSignatureError.value = false
}

const todayLabel = computed(() => new Date().toLocaleDateString('fr-FR'))
const instruments = computed(() => instrumentPrefs.value.filter(v => v))

// ─── Date auto-slash ─────────────────────────────────────────
watch(() => eleve.value.dateNaissance, (val) => {
  if (!val) return
  const digits = val.replace(/\D/g, '').slice(0, 8)
  let out = digits
  if (digits.length > 4) out = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
  else if (digits.length > 2) out = digits.slice(0, 2) + '/' + digits.slice(2)
  if (out !== val) eleve.value.dateNaissance = out
})

// ─── Règles de validation ─────────────────────────────────────
const req      = (v) => !!(v && String(v).trim()) || 'Champ requis'
const reqEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) || 'Email invalide'
const reqDate  = (v) => !v || /^\d{2}\/\d{2}\/\d{4}$/.test(v) || 'Format JJ/MM/AAAA'
const reqPhone = (v) => {
  if (!v || !String(v).trim()) return true
  const digits = String(v).replace(/[\s.\-]/g, '').replace(/^\+33/, '0')
  return /^0[1-9]\d{8}$/.test(digits) || 'Format : 0X XX XX XX XX ou +33 X XX XX XX XX'
}

function formatPhone(raw) {
  const v = String(raw || '').trimStart()
  if (v.startsWith('+')) {
    if (!v.startsWith('+33')) return v
    const d = v.slice(3).replace(/\D/g, '').slice(0, 9)
    if (!d.length) return '+33'
    const g = [d.slice(0, 1)]
    if (d.length > 1) g.push(d.slice(1, 3))
    if (d.length > 3) g.push(d.slice(3, 5))
    if (d.length > 5) g.push(d.slice(5, 7))
    if (d.length > 7) g.push(d.slice(7, 9))
    return '+33 ' + g.join(' ')
  }
  const d = v.replace(/\D/g, '').slice(0, 10)
  const g = []
  for (let i = 0; i < d.length; i += 2) g.push(d.slice(i, i + 2))
  return g.join(' ')
}

function formatPostal(raw) {
  return String(raw || '').replace(/\D/g, '').slice(0, 5)
}

function sanitizeName(raw, max) {
  return String(raw || '').replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '').slice(0, max || 80)
}

function formatNumero(raw) {
  return String(raw || '').replace(/[^0-9a-zA-Z\s]/g, '').slice(0, 10)
}

// ─── Instruments par préférence ──────────────────────────────
function availableInstruments(idx) {
  const picked = instrumentPrefs.value.filter((v, i) => i !== idx && v)
  return INSTRUMENTS.filter(i => !picked.includes(i))
}
function addInstrumentPref() {
  if (instrumentPrefs.value.length < INSTRUMENTS.length) instrumentPrefs.value.push('')
}
function removeInstrumentPref(idx) {
  instrumentPrefs.value.splice(idx, 1)
}

function addActivite() {
  observations.value.autresActivites.push({ activite: '', endroit: '' })
}
function removeActivite(idx) {
  observations.value.autresActivites.splice(idx, 1)
}

// ─── Navigation formulaire ───────────────────────────────────
async function next() {
  if (step.value === 1) {
    const res = await form1Ref.value?.validate()
    const valid = typeof res === 'object' ? res.valid : !!res
    const noInstr = type.value === 'inscription' && !instruments.value.length
    if (!valid || noInstr) {
      const s = (v) => !!(v && String(v).trim())
      const msgs = []
      if (!s(eleve.value.nom))             msgs.push("Nom de l'eleve")
      if (!s(eleve.value.prenom))          msgs.push("Prenom de l'eleve")
      if (!s(eleve.value.dateNaissance))   msgs.push('Date de naissance')
      else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(eleve.value.dateNaissance))
                                           msgs.push('Date de naissance — format JJ/MM/AAAA')
      if (!s(eleve.value.lieuNaissance))   msgs.push('Lieu de naissance')
      if (!s(parents.value.pere))          msgs.push('Pere / Tuteur legal')
      if (!s(parents.value.mere))          msgs.push('Mere / Tutrice legale')
      if (!s(parents.value.adresseNumero)) msgs.push('Numero de rue')
      if (!s(parents.value.adresseRue))    msgs.push('Rue')
      if (!s(parents.value.codePostal))    msgs.push('Code postal')
      if (!s(parents.value.ville))         msgs.push('Ville')
      if (!s(parents.value.telephone))     msgs.push('Telephone')
      else {
        const d = String(parents.value.telephone).replace(/[\s.\-]/g, '').replace(/^\+33/, '0')
        if (!/^0[1-9]\d{8}$/.test(d))     msgs.push('Telephone — format invalide')
      }
      if (!s(parents.value.email))         msgs.push('Email')
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(parents.value.email)))
                                           msgs.push('Email — format invalide')
      if (noInstr) {
        showInstrumentError.value = true
        msgs.push('Instrument(s) souhaite(s)')
      }
      if (!msgs.length) msgs.push('Certains champs sont incorrects ou manquants')
      showSnackbar(msgs)
      return
    }
    showInstrumentError.value = false
  }
  if (step.value === 2) {
    if (!reglementAccepte.value) {
      showReglementError.value = true
      showSnackbar(["Acceptation du reglement interieur"])
      return
    }
    showReglementError.value = false
  }
  if (step.value === 3) {
    if (autorisationImage.value === null) {
      showImageError.value = true
      showSnackbar(["Choix relatif au droit a l'image"])
      return
    }
    showImageError.value = false
    if (!signataire.value) signataire.value = parents.value.pere
  }
  step.value++
  window.umami?.track('inscription-etape', { etape: step.value, type: type.value })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function prev() {
  step.value--
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ─── Soumission ──────────────────────────────────────────────
async function submit() {
  const msgs = []
  if (!signataire.value.trim()) msgs.push('Nom du signataire')
  if (!faita.value.trim())      msgs.push('Ville (Fait a)')
  if (!signaturePadInstance || signaturePadInstance.isEmpty()) {
    showSignatureError.value = true
    msgs.push('Signature manuscrite')
  }
  if (msgs.length) { showSnackbar(msgs); return }
  showSignatureError.value = false
  const signature = signaturePadInstance.toDataURL('image/png')
  submitting.value = true
  submitError.value = null
  try {
    await api.post('/api/public/inscription', {
      type: type.value,
      eleve: eleve.value,
      parents: parents.value,
      parents2: adresse2Visible.value ? { ...parents2.value, referent: parents2Referent.value } : null,
      antecedents: antecedents.value,
      instruments: instruments.value,
      observations: observations.value,
      avis: avis.value,
      autorisationImage: autorisationImage.value,
      faita: faita.value,
      signataire: signataire.value,
      signature,
    })
    submitted.value = true
    window.umami?.track('inscription-soumise', { type: type.value })
  } catch (e) {
    submitError.value = e?.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>

/* ── Landing ─────────────────────────────────────────────── */
.landing {
  display: flex;
  flex-direction: column;
}
.cotisation-img {
  width: 100%;
  display: block;
}
.landing-btn-bar {
  padding: 16px;
  background: #fff;
}
.landing-btn {
  font-family: 'Poppins', sans-serif !important;
  font-weight: 700 !important;
  text-transform: none !important;
  font-size: 1.05rem !important;
  letter-spacing: 0.3px;
  height: 54px !important;
  border-radius: 12px !important;
}

/* ── Choix du dossier ────────────────────────────────────── */
.choice-wrap {
  padding: 40px 20px 32px;
  max-width: 500px;
  margin: 0 auto;
}
.choice-header-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 1.3rem;
  color: #C41E3A;
}
.choice-card {
  background: #C41E3A;
  border-radius: 12px;
  padding: 22px 20px;
  cursor: pointer;
  text-align: center;
  box-shadow: 0 4px 14px rgba(196, 30, 58, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.choice-card:hover {
  box-shadow: 0 6px 20px rgba(196, 30, 58, 0.45);
}
.choice-card:active {
  transform: scale(0.97);
  box-shadow: 0 2px 6px rgba(196, 30, 58, 0.25);
}
.choice-title {
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  margin-bottom: 5px;
}
.choice-sub {
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.88rem;
}

/* ── Formulaire ──────────────────────────────────────────── */
.inscription-wrap {
  padding-bottom: 40px;
}
.step-indicator {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
}
.step-indicator::before {
  content: '';
  position: absolute;
  top: 14px;
  left: 10%;
  right: 10%;
  height: 2px;
  background: #e0e0e0;
  z-index: 0;
}
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  z-index: 1;
}
.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  transition: background 0.25s, color 0.25s;
  margin-bottom: 4px;
}
.step-item.active .step-circle { background: #C41E3A; color: #fff; }
.step-item.done .step-circle   { background: #2e7d32; color: #fff; }
.step-label {
  font-size: 10px;
  color: #888;
  text-align: center;
}
.step-item.active .step-label { color: #C41E3A; font-weight: 600; }
.step-item.done .step-label   { color: #2e7d32; }

.section-title {
  font-size: 0.95rem !important;
  font-weight: 700;
  color: #C41E3A;
  padding-bottom: 4px;
  font-family: 'Poppins', sans-serif;
}

.reglement-text {
  font-size: 0.82rem;
  line-height: 1.55;
  max-height: 400px;
  overflow-y: auto;
}
.reglement-text ol { padding-left: 18px; }
.reglement-text li { margin-bottom: 10px; }
.reglement-text p  { margin-bottom: 0; }

.cotis-table {
  border-collapse: collapse;
  font-size: 0.82rem;
  margin-left: 8px;
}
.cotis-table td {
  padding: 2px 12px;
  border: 1px solid #ddd;
}

.recap-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 8px;
  font-size: 0.88rem;
}
.recap-row span   { color: #666; min-width: 100px; }
.recap-row strong { text-align: right; flex: 1; }

.nav-btns {
  display: flex;
  align-items: center;
  gap: 12px;
}

.confirmation-card { background: #fff; }

/* ── Choix autorisation image ────────────────────────────── */
.auth-choices {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.auth-card {
  border: 2px solid #ddd;
  border-radius: 12px;
  padding: 18px 16px;
  text-align: center;
  cursor: pointer;
  background: #fff;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.auth-card:active { transform: scale(0.98); }
.auth-card--active-yes {
  border-color: #2e7d32;
  background: #2e7d32;
  color: #fff;
}
.auth-card--active-no {
  border-color: #C41E3A;
  background: #C41E3A;
  color: #fff;
}
.auth-card-title {
  font-weight: 700;
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  margin-bottom: 3px;
}
.auth-card-sub {
  font-size: 0.82rem;
  opacity: 0.75;
}
.auth-card--active-yes .auth-card-sub,
.auth-card--active-no  .auth-card-sub { opacity: 0.88; }

/* ── Snackbar liste ─────────────────────────────────────── */
.snack-list {
  margin: 0;
  padding-left: 18px;
}
.snack-list li {
  font-size: 0.82rem;
  line-height: 1.6;
}

/* ── Signature pad ───────────────────────────────────────── */
.signature-pad-wrap {
  border: 1.5px solid #bbb;
  border-radius: 8px;
  background: #fafafa;
  overflow: hidden;
}
.signature-canvas {
  width: 100%;
  height: 160px;
  display: block;
  touch-action: none;
}
</style>