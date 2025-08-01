<template>
  <div>
    <!-- Informations Générales -->
    <v-card class="pa-2 mb-3" outlined>
      <v-card-title class="text-h6">Informations Générales</v-card-title>
      <v-row dense>
        <v-col cols="12" md="8">
          <v-text-field
            v-model="localData.nomDemandeOuverture"
            label="Nom de la demande"
            dense
            hide-details="auto"
            rounded
            variant="outlined"
            :readonly="isViewMode"
            :bg-color="isViewMode ? 'grey-lighten-4' : (isCreationMode ? 'orange' : 'white')"
            :disabled="isViewMode || isCreationMode"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="localData.proprietaire"
            label="Propriétaire"
            dense
            hide-details="auto"
            rounded
            variant="outlined"
            :readonly="isViewMode"
            :bg-color="isViewMode ? 'grey-lighten-4' : (isCreationMode ? 'orange' : 'white')"
            :disabled="isViewMode || isCreationMode"
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Application -->
    <v-card class="pa-2 mb-3" outlined>
      <v-card-title class="text-h6">Application</v-card-title>
     
      <!-- Mode Création - Autocomplete pour rechercher une application -->
      <template v-if="isCreationMode">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="selectedApplication"
              :items="applicationsSearch"
              @update:search="onSearchUpdate"
              :loading="searchLoading"
              item-title="nomApplication"
              item-value="id"
              label="Rechercher et sélectionner une application *"
              :rules="requiredRules"
              dense
              hide-details="auto"
              rounded
              variant="outlined"
              clearable
              @update:model-value="onApplicationSelected"
              no-filter
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-subtitle>{{ item.raw.nomRessourceCloud }}</v-list-item-subtitle>
                  <v-list-item-title>{{ item.raw.nomApplication }}</v-list-item-title>
                  <template v-if="item.raw.sousApplications?.length">
                    <v-list-item-subtitle v-for="sousApp in item.raw.sousApplications" :key="sousApp.id" class="text-caption">
                      • {{ sousApp.nomSousApplication }}
                    </v-list-item-subtitle>
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="localData.nomRessourceCloud"
              label="Nom Ressource Cloud VISTA"
              dense
              hide-details="auto"
              rounded
              variant="outlined"
              disabled
              bg-color="grey-lighten-3"
            />
          </v-col>
        </v-row>
        <v-row dense v-if="selectedApplicationData">
          <v-col cols="12" md="6" v-if="selectedApplicationData.hasSousApp && selectedApplicationData.sousApplications?.length > 0">
            <v-select
              v-model="selectedSousApplication"
              :items="selectedApplicationData.sousApplications"
              item-title="nomSousApplication"
              item-value="id"
              label="Sous-application"
              dense
              hide-details="auto"
              rounded
              variant="outlined"
              clearable
              @update:model-value="onSousApplicationSelected"
            />
          </v-col>
          <v-col cols="12" :md="selectedApplicationData.hasSousApp ? 6 : 12">
            <v-select
              v-model="localData.environnement"
              :items="availableEnvironnements"
              label="Environnement à créer *"
              :rules="requiredRules"
              dense
              hide-details="auto"
              rounded
              variant="outlined"
              :disabled="!availableEnvironnements.length"
              :hint="!availableEnvironnements.length ? 'Tous les environnements existent déjà' : `${availableEnvironnements.length} environnement(s) disponible(s)`"
              persistent-hint
              @update:model-value="updateData"
            />
          </v-col>
        </v-row>
      </template>

      <!-- Mode Visualisation - Champs en lecture seule -->
      <template v-else>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="localData.nomApplication"
              label="Nom de l'application"
              dense
              hide-details="auto"
              rounded
              variant="outlined"
              readonly
              bg-color="grey-lighten-4"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="localData.nomRessourceCloud"
              label="Nom Ressource Cloud VISTA"
              dense
              hide-details="auto"
              rounded
              variant="outlined"
              readonly
              bg-color="grey-lighten-4"
            />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col cols="12" md="6" v-if="localData.nomSousApplication">
            <v-text-field
              v-model="localData.nomSousApplication"
              label="Sous-application"
              dense
              hide-details="auto"
              rounded
              variant="outlined"
              readonly
              bg-color="grey-lighten-4"
            />
          </v-col>
          <v-col cols="12" :md="localData.nomSousApplication ? 6 : 12">
            <v-text-field
              v-model="localData.environnement"
              label="Environnement"
              dense
              hide-details="auto"
              rounded
              variant="outlined"
              readonly
              bg-color="grey-lighten-4"
            />
          </v-col>
        </v-row>
      </template>
    </v-card>
  </div>
</template>

<script>
import { apiService } from '@/services/openflux.api.service';

export default {
  name: 'SelectionApplication',
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        nomDemandeOuverture: '',
        proprietaire: '',
        nomApplication: '',
        nomRessourceCloud: '',
        nomSousApplication: '',
        environnement: '',
        applicationId: null,
        sousApplicationId: null
      })
    },
    mode: {
      type: String,
      default: 'view', // 'view', 'edit', 'create'
      validator: (value) => ['view', 'edit', 'create'].includes(value)
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      localData: { ...this.modelValue },
      // Variables pour le mode création
      selectedApplication: null,
      selectedApplicationData: null,
      searchLoading: false,
      applicationsSearch: [],
      selectedSousApplication: null,
      availableEnvironnements: [],
      searchTimeout: null,
      requiredRules: [v => !!v || 'Ce champ est obligatoire']
    };
  },
  computed: {
    isCreationMode() {
      return this.mode === 'create';
    },
    isViewMode() {
      return this.mode === 'view';
    },
    isEditMode() {
      return this.mode === 'edit';
    }
  },
  watch: {
    modelValue: {
      handler(newVal) {
        this.localData = { ...newVal };
      },
      deep: true
    },
    // Watchers pour le mode création
    'localData.nomApplication'(val) {
      if (this.isCreationMode) {
        this.localData.nomApplication = val ? val.trim().toUpperCase() : '';
        this.updateNomDemande();
        this.updateData();
      }
    },
    'localData.nomRessourceCloud'(val) {
      if (this.isCreationMode) {
        this.localData.nomRessourceCloud = this.formatMajusculesSansEspaces(val);
        this.updateNomDemande();
        this.updateData();
      }
    },
    'localData.nomSousApplication'(val) {
      if (this.isCreationMode) {
        this.localData.nomSousApplication = this.formatMajusculesSansEspaces(val);
        this.updateNomDemande();
        this.updateData();
      }
    },
    'localData.environnement'() {
      if (this.isCreationMode) {
        this.updateNomDemande();
        this.updateData();
      }
    }
  },
  methods: {
    updateData() {
      this.$emit('update:modelValue', { ...this.localData });
    },
   
    // Méthodes pour le mode création
    updateNomDemande() {
      if (!this.isCreationMode) return;
     
      const parts = [
        "DOF",
        this.localData.nomRessourceCloud,
        this.localData.nomSousApplication,
        this.localData.environnement
      ].filter(Boolean);
     
      this.localData.nomDemandeOuverture = parts.join('-');
    },
   
    formatMajusculesSansEspaces(value) {
      return value ? value.replace(/\s+/g, '').toUpperCase() : '';
    },

    onSearchUpdate(search) {
      if (!this.isCreationMode) return;
     
      // Debounce la recherche
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
     
      this.searchTimeout = setTimeout(() => {
        if (search && search.trim() !== '') {
          this.fetchApplications(search.trim());
        } else {
          this.applicationsSearch = [];
        }
      }, 300);
    },

    async fetchApplications(searchTerm) {
      if (!searchTerm || searchTerm.trim() === '') {
        this.applicationsSearch = [];
        return;
      }
      try {
        this.searchLoading = true;
        const applications = await apiService.searchApplications(searchTerm);
        this.applicationsSearch = applications;
      } catch (error) {
        console.error('Erreur lors de la recherche d\'applications:', error);
        this.applicationsSearch = [];
      } finally {
        this.searchLoading = false;
      }
    },
    onApplicationSelected(applicationId) {
      if (!this.isCreationMode) return;
     
      this.selectedApplication = applicationId;
      this.selectedSousApplication = null;
      this.localData.environnement = '';
      this.availableEnvironnements = [];
     
      if (applicationId) {
        // Trouver l'application sélectionnée dans les résultats
        this.selectedApplicationData = this.applicationsSearch.find(app => app.id === applicationId);
       
        if (this.selectedApplicationData) {
          // Remplir automatiquement les champs
          this.localData.nomApplication = this.selectedApplicationData.nomApplication;
          this.localData.nomRessourceCloud = this.selectedApplicationData.nomRessourceCloud;
          this.localData.nomSousApplication = '';
          this.localData.applicationId = applicationId;
          this.localData.sousApplicationId = null;
         
          // Mettre à jour les environnements disponibles
          this.updateAvailableEnvironnements();
        }
      } else {
        this.selectedApplicationData = null;
        this.localData.nomApplication = '';
        this.localData.nomRessourceCloud = '';
        this.localData.nomSousApplication = '';
        this.localData.applicationId = null;
        this.localData.sousApplicationId = null;
      }
     
      this.updateData();
    },

    onSousApplicationSelected(sousAppId) {
      if (!this.isCreationMode) return;
     
      this.selectedSousApplication = sousAppId;
      this.localData.environnement = '';
     
      if (sousAppId && this.selectedApplicationData) {
        const sousApp = this.selectedApplicationData.sousApplications.find(sa => sa.id === sousAppId);
        if (sousApp) {
          this.localData.nomSousApplication = sousApp.nomSousApplication;
          this.localData.sousApplicationId = sousAppId;
          this.availableEnvironnements = sousApp.environnementsDisponibles;
        }
      } else {
        this.localData.nomSousApplication = '';
        this.localData.sousApplicationId = null;
        this.updateAvailableEnvironnements();
      }
     
      this.updateData();
    },

    updateAvailableEnvironnements() {
      if (!this.isCreationMode || !this.selectedApplicationData) {
        this.availableEnvironnements = [];
        return;
      }
     
      if (this.selectedApplicationData.hasSousApp) {
        // Si l'application a des sous-applications, on attend la sélection d'une sous-app
        if (this.selectedSousApplication) {
          const sousApp = this.selectedApplicationData.sousApplications.find(sa => sa.id === this.selectedSousApplication);
          this.availableEnvironnements = sousApp ? sousApp.environnementsDisponibles : [];
        } else {
          this.availableEnvironnements = [];
        }
      } else {
        // Application sans sous-applications
        this.availableEnvironnements = this.selectedApplicationData.environnementsDisponibles || [];
      }
    }
  },
 
  beforeUnmount() {
    // Nettoyer les timeouts
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
};
</script>
