<template>
  <v-dialog v-model="dialog" persistent>
    <v-card>
      <v-card-title class="text-h5 pa-4 bg-primary">
        <v-icon start>{{ isCreationMode ? 'mdi-plus' : 'mdi-pencil' }}</v-icon>
        {{ isCreationMode ? 'Création d\'un nouvel environnement' : 'Édition de l\'environnement' }}
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog" variant="text" color="white">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-container fluid>
          <v-form ref="form">
            <!-- Informations générales et Application -->
            <SelectionApplication
              v-model="formData.application"
              :mode="isCreationMode ? 'create' : 'view'"
            />

            <!-- Composants (éditables) -->
            <ComposantsSection
              v-model="formData.composants"
              :application-data="formData.application"
              :affectation-groups-auto="formData.affectationGroupsAuto"
              @update:affectationGroupsAuto="updateAffectationGroupsAuto"
            />

            <!-- Affectation de groupes (éditable) -->
            <AffectationGroupsManuel
              v-model="formData.affectationGroupsInputs"
            />

            <!-- Matrice de flux (éditable) -->
            <v-card class="pa-2 mb-3" outlined>
              <v-card-title class="text-h6">Matrice de Flux</v-card-title>
              <MatriceFlux ref="matriceFluxRef" :initial-data="formData.matriceFlux" />
            </v-card>
          </v-form>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          variant="outlined"
          @click="closeDialog"
        >
          Annuler
        </v-btn>
        <v-btn
          color="primary"
          @click="saveChanges"
          :loading="saving"
        >
          {{ isCreationMode ? 'Créer l\'environnement' : 'Sauvegarder les modifications' }}
        </v-btn>
      </v-card-actions>

      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="snackbar.timeout"
        location="top"
      >
        {{ snackbar.text }}
        <template v-slot:actions>
          <v-btn variant="text" @click="snackbar.show = false">Fermer</v-btn>
        </template>
      </v-snackbar>
    </v-card>
  </v-dialog>
</template>

<script>
import SelectionApplication from './formsOpenFlux/SelectionApplication.vue';
import ComposantsSection from './formsOpenFlux/ComposantsSection.vue';
import AffectationGroupsManuel from './formsOpenFlux/AffectationGroupsManuel.vue';
import MatriceFlux from './formsOpenFlux/MatriceFlux.vue';
import { apiService } from '@/services/openflux.api.service';

export default {
  name: 'EnvironnementDialog',
  components: {
    SelectionApplication,
    ComposantsSection,
    AffectationGroupsManuel,
    MatriceFlux
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      default: 'edit', // 'edit' ou 'create'
      validator: (value) => ['edit', 'create'].includes(value)
    },
    environnementData: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue', 'environment-updated', 'environment-created'],
  data() {
    return {
      dialog: false,
      saving: false,
      formData: {
        applicationInfo: {
          nomDemandeOuverture: '',
          proprietaire: 'Moi',
          nomApplication: '',
          nomRessourceCloud: '',
          nomSousApplication: '',
          environnement: '',
          applicationId: null,
          sousApplicationId: null
        },
        composants: [],
        matriceFlux: [],
        affectationGroupsInputs: {},
        affectationGroupsAuto: {}
      },
      snackbar: {
        show: false,
        text: '',
        color: 'success',
        timeout: 6000
      }
    };
  },
  computed: {
    isCreationMode() {
      return this.mode === 'create';
    }
  },
  watch: {
    modelValue(val) {
      this.dialog = val;
      if (val) {
        if (this.isCreationMode) {
          this.initializeForCreation();
        } else if (this.environnementData) {
          this.loadEnvironnementData();
        }
      }
    },
    dialog(val) {
      this.$emit('update:modelValue', val);
      if (!val) {
        this.resetForm();
      }
    }
  },
  methods: {
    initializeForCreation() {
      // Initialiser le formulaire pour une création
      this.formData = {
        application: {
          nomDemandeOuverture: '',
          proprietaire: 'Moi',
          nomApplication: '',
          nomRessourceCloud: '',
          nomSousApplication: '',
          environnement: '',
          applicationId: null,
          sousApplicationId: null
        },
        composants: [],
        matriceFlux: [],
        affectationGroupsInputs: {},
        affectationGroupsAuto: {}
      };
    },

    async loadEnvironnementData() {
      try {
        const env = this.environnementData;
        console.log('Données de l\'environnement à charger:', env);
       
        this.formData.application = {
          nomDemandeOuverture: env.application?.nomDemandeOuverture || '',
          proprietaire: env.application?.proprietaire || 'N/A',
          nomApplication: env.application?.nomApplication || '',
          nomRessourceCloud: env.application?.nomRessourceCloud || '',
          nomSousApplication: env.application?.nomSousApplication || '',
          environnement: env.application?.environnement || '',
          applicationId: env.application?.applicationId || null,
          sousApplicationId: env.application?.sousApplicationId || null
        };

        this.formData.composants = env.composants || [];

        this.formData.matriceFlux = env.matriceFlux || [];

        this.formData.affectationGroupsInputs = env.affectationGroupsInputs || {};

        this.formData.affectationGroupsAuto = {};

        // Passer les données initiales à la matrice de flux
        this.$nextTick(() => {
          if (this.$refs.matriceFluxRef && this.formData.matriceFlux.length > 0) {
            this.$refs.matriceFluxRef.rows = [...this.formData.matriceFlux];
          }
        });

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        alert('Erreur lors du chargement des données de l\'environnement');
        this.showSnackbar('Demande introuvable', 'error');
      }
    },
    updateAffectationGroupsAuto(newAffectations) {
      this.formData.affectationGroupsAuto = newAffectations;
      console.log("Affectations mises à jour:", newAffectations);
    },
    async saveChanges() {
      try {
        this.saving = true;

        // Validation
        const isValid = await this.$refs.form.validate();
        if (!isValid.valid) {
          this.showSnackbar('Formulaire invalide, corrigez les erreurs !', 'error');
          return;
        }

        // Récupérer les données de la matrice de flux
        this.formData.matriceFlux = this.$refs.matriceFluxRef.getMaticeFlux();

        if (this.isCreationMode) {

          console.log("Data DOF : ", this.formData);
          // Appeler l'API de création
          const nouvelDemandeOuverture = await apiService.createOuvertureFlux(this.formData);

          this.showSnackbar('Nouvelle demande d\'ouverture de flux créée avec succès !', 'success');
          this.$emit('environment-created', nouvelDemandeOuverture);
          
          // Fermer le dialog après un délai pour permettre de voir le message
          setTimeout(() => {
            this.closeDialog();
          }, 2000);

        } else { // Mode édition
         
          // Utiliser l'idOuvertureEnv pour la mise à jour
          const idOuvertureEnv = this.environnementData.application?.nomDemandeOuverture;
          if (!idOuvertureEnv) {
            this.showSnackbar('Impossible de déterminer l\'ID de la demande pour la mise à jour', 'error');
            return;
          }

          // Appeler l'API de mise à jour
          const updatedEnvironnement = await apiService.updateEnvironnement(
            idOuvertureEnv,
            this.formData
          );

          this.showSnackbar('Environnement mis à jour avec succès !', 'success');
          this.$emit('environment-updated', updatedEnvironnement);
          
          // Fermer le dialog après un délai pour permettre de voir le message
          setTimeout(() => {
            this.closeDialog();
          }, 2000);
        }
        // this.closeDialog();

      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        this.showSnackbar(
          error.message || 'Erreur de sauvegarde',
          'error'
        );
      } finally {
        this.saving = false;
      }
    },

    closeDialog() {
      this.dialog = false;
    },

    resetForm() {
      this.formData = {
        application: {
          nomDemandeOuverture: '',
          proprietaire: '',
          nomApplication: '',
          nomRessourceCloud: '',
          nomSousApplication: '',
          environnement: '',
          applicationId: null,
          sousApplicationId: null
        },
        composants: [],
        matriceFlux: [],
        affectationGroups: {},
        affectationGroupsAuto: {}
      };
    },

    showSnackbar(text, color = 'success') {
      this.snackbar = {
        show: true,
        text,
        color,
        timeout: color === 'error' ? 8000 : 6000
      };
    }
  }
};
</script>

<style scoped>
.v-dialog .v-card {
  overflow-y: auto;
  max-height: 90vh;
}
</style>
