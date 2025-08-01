<template>
  <v-container class="text-center" style="max-width: 90%; width: 90%">
    <v-sheet :elevation="12">
      <v-card>
        <!-- En-tête -->
        <v-sheet :elevation="6" justify="center" class="d-flex align-center justify-center">
          <v-row justify="center" align="center">
            <v-col cols="12" sm="2">
              <v-img src="vra_dep.png" contain justify="center" height="50" width="50"></v-img>
            </v-col>
            <v-col cols="12" sm="10">
              <v-card-title class="justify-center">
                Ouverture de flux
              </v-card-title>
            </v-col>
          </v-row>
        </v-sheet>

        <v-card-title bg-color="primary">Liste des applications :</v-card-title>

        <!-- Bouton Nouvelle demande -->
        <v-row class="mb-4">
          <v-col cols="12">
            <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="creerNouvelleDemande" class="mr-3">
              Nouvelle demande
            </v-btn>
            <span class="text-body-2 text-medium-emphasis">
              Créer une nouvelle demande d'ouverture de flux
            </span>
          </v-col>
        </v-row>

        <v-divider class="mb-4"></v-divider>

        <v-row class="text-left">
          <!-- Treeview Section -->
          <v-col cols="4">
            <v-text-field v-model="search" label="Rechercher" prepend-icon="mdi-magnify" clearable
              placeholder="Rechercher une application ou sous-application..."></v-text-field>
            <v-progress-circular v-if="loading" indeterminate color="primary"></v-progress-circular>
            <v-treeview v-else :selected="selection" @update:selected="updateSelection" :items="applicationsTreeview"
              item-value="id" color="info" selectable selection-type="leaf" dense></v-treeview>
          </v-col>
          <!-- Details Section -->
          <v-col cols="8">
            <v-card v-if="selectedItem" class="pa-5">
              <v-card-title>Détails de l'Environnement</v-card-title>
              <v-card-text>
                <p>
                  <strong>Nom de l'Application : </strong>
                  {{ selectedItem.nomApplication }}
                </p>
                <p v-if="selectedItem.nomSousApplication">
                  <strong>Sous-application : </strong>
                  {{ selectedItem.nomSousApplication }}
                </p>
                <p>
                  <strong>Nom Ressource Cloud : </strong>
                  {{ selectedItem.nomRessourceCloud }}
                </p>
                <p>
                  <strong>Environnement : </strong>
                  {{ selectedItem.typeEnvironnement }}
                </p>
                <p>
                  <strong>Nom de la demande : </strong>
                  {{ selectedItem.nomDemande }}
                </p>
                <p>
                  <strong>Propriétaire : </strong>
                  {{ selectedItem.proprietaire }}
                </p>
                <p>
                  <strong>Date de création : </strong>
                  {{ formatDate(selectedItem.dateCreation) }}
                </p>
                <p>
                  <strong>Version : </strong>
                  {{ selectedItem.numeroVersion ? `v${selectedItem.numeroVersion}` : '-' }}
                </p>
              </v-card-text>
              <v-row>
                <v-col cols="auto">
                  <v-btn color="info" @click="editEnvironnement"> Voir les détails </v-btn>
                </v-col>
              </v-row>
            </v-card>
            <v-card v-else>
              <v-card-text> Sélectionner un environnement </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Dialog d'édition/création d'environnement -->
        <EnvironnementDialog v-model="dialog.show" :mode="dialog.mode" :environnement-data="dialog.environnementData"
          @environment-updated="onEnvironmentUpdated" @environment-created="onEnvironmentCreated" />

        <!-- Snackbar pour les messages -->
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
    </v-sheet>
  </v-container>
</template>
<script>
import { apiService } from '@/services/openflux.api.service';
import EnvironnementDialog from '../components/EnvironnementDialog.vue';

export default {
  name: "OpenFluxListApp",
  components: {
    EnvironnementDialog
  },
  data() {
    return {
      applicationsTreeview: [],
      selection: [],
      search: '',
      loading: false,
      environmentsMap: new Map(), // Pour stocker les détails des environnements
      searchTimeout: null, // Pour le debounce de la recherche
      dialog: {
        show: false,
        mode: 'edit', // 'edit' ou 'create'
        environnementData: null
      },
      snackbar: {
        show: false,
        text: '',
        color: 'success',
        timeout: 6000
      },
    };
  },

  computed: {
    selectedItem() {
      if (this.selection.length === 0) return null;
      const selectedId = this.selection[0];
      console.log('Environment details:', this.environmentsMap.get(selectedId));
      return this.environmentsMap.get(selectedId) || null;
    },
  },

  watch: {
    selection: {
      handler() { },
      deep: true
    },
    search: {
      handler(newValue) {
        // Debounce la recherche pour éviter trop d'appels API
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(() => {
          this.fetchApplications(newValue);
        }, 300); // Attendre 300ms après la dernière frappe
      }
    }
  },

  methods: {
    updateSelection(newSelection) {
      this.selection = newSelection;
    },

    creerNouvelleDemande() {
      // Ouvrir le dialog en mode création
      this.dialog = {
        show: true,
        mode: 'create',
        environnementData: null
      };
    },

    async fetchApplications(searchTerm = '') {
      try {
        this.loading = true;

        // Construire les paramètres de l'API
        const params = {};
        if (searchTerm && searchTerm.trim() !== '') {
          params.q = searchTerm.trim();
        }

        const apiData = await apiService.getAllApplications(params);
        this.applicationsTreeview = this.transformDataForTreeview(apiData);

        // Réinitialiser la sélection si la recherche a changé
        if (searchTerm !== this.lastSearchTerm) {
          this.selection = [];
          this.lastSearchTerm = searchTerm;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des applications:', error);
        this.applicationsTreeview = [];
      } finally {
        this.loading = false;
      }
    },

    transformDataForTreeview(apiData) {
      const treeData = [];

      // Réinitialiser la map des environnements
      this.environmentsMap.clear();

      apiData.forEach(app => {
        const appNode = {
          id: `app_${app.id}`,
          title: app.nomApplication,
          children: []
        };

        if (app.hasSousApp && app.SousApplications && app.SousApplications.length > 0) {
          // Application avec sous-applications
          app.SousApplications.forEach(sousApp => {
            const sousAppNode = {
              id: `sousapp_${sousApp.id}`,
              title: sousApp.nomSousApplication,
              children: []
            };

            // Ajouter les environnements de la sous-application
            if (sousApp.Environnements && sousApp.Environnements.length > 0) {
              sousApp.Environnements.forEach(env => {
                const envId = `env_${env.id}`;
                const envNode = {
                  id: envId,
                  title: env.typeEnvironnement
                };

                // Stocker les détails de l'environnement avec toutes les données brutes
                const envDetails = {
                  id: env.id,
                  nomApplication: app.nomApplication,
                  nomSousApplication: sousApp.nomSousApplication,
                  nomRessourceCloud: app.nomRessourceCloud,
                  typeEnvironnement: env.typeEnvironnement,
                  nomDemande: env.idOuvertureEnv,
                  proprietaire: env.proprietaire || 'N/A',
                  dateCreation: env.dateCreation,
                  numeroVersion: env.VersionEnvironnements && env.VersionEnvironnements.length > 0 ? env.VersionEnvironnements[0].numeroVersion : null,
                  applicationId: env.applicationId,
                  sousApplicationId: env.sousApplicationId,
                  // Données brutes complètes pour debug/utilisation future
                  _rawData: env
                };

                this.environmentsMap.set(envId, envDetails);
                sousAppNode.children.push(envNode);
              });
            }

            appNode.children.push(sousAppNode);
          });
        } else if (app.Environnements && app.Environnements.length > 0) {
          // Application sans sous-applications mais avec environnements
          app.Environnements.forEach(env => {
            const envId = `env_${env.id}`;
            const envNode = {
              id: envId,
              title: env.typeEnvironnement
            };

            // Stocker les détails de l'environnement avec toutes les données brutes
            const envDetails = {
              id: env.id,
              nomApplication: app.nomApplication,
              nomSousApplication: null,
              nomRessourceCloud: app.nomRessourceCloud,
              typeEnvironnement: env.typeEnvironnement,
              nomDemande: env.idOuvertureEnv,
              proprietaire: env.proprietaire || 'N/A',
              dateCreation: env.dateCreation,
              numeroVersion: env.VersionEnvironnements && env.VersionEnvironnements.length > 0 ? env.VersionEnvironnements[0].numeroVersion : null,
              applicationId: env.applicationId,
              sousApplicationId: env.sousApplicationId,
              // Données brutes complètes pour debug/utilisation future
              _rawData: env
            };

            this.environmentsMap.set(envId, envDetails);
            appNode.children.push(envNode);
          });
        }

        // Ajouter l'application seulement si elle a des enfants (environnements)
        if (appNode.children.length > 0) {
          treeData.push(appNode);
        }
      });

      return treeData;
    },

    formatDate(dateString) {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch (error) {
        console.error('Erreur lors du formatage de la date:', error);
        return '-';
      }
    },

    async editEnvironnement() {
      if (!this.selection.length) {
        this.showSnackbar('Aucun environnement sélectionné pour l\'édition', 'warning');
        return;
      }

      if (this.selection.length > 1) {
        this.showSnackbar('Veuillez sélectionner un seul environnement pour l\'édition', 'warning');
        return;
      }

      // Vérifier que c'est bien un environnement qui est sélectionné
      const selectedId = this.selection[0];
      if (!selectedId.startsWith('env_')) {
        this.showSnackbar('Veuillez sélectionner un environnement (pas une application ou sous-application)', 'warning');
        return;
      }

      try {
        this.loading = true;

        // Récupérer les détails de l'environnement sélectionné
        const selectedItem = this.environmentsMap.get(selectedId);
        if (!selectedItem || !selectedItem.nomDemande) {
          this.showSnackbar('Demande introuvable', 'error');
          return;
        }

        // Utiliser l'idOuvertureEnv (nomDemande) pour charger la demande
        const idOuvertureEnv = selectedItem.nomDemande;
        const environnementComplet = await apiService.getEnvironnementById(idOuvertureEnv);
        
        // Ouvrir le dialogue d'édition
        this.dialog = {
          show: true,
          mode: 'edit',
          environnementData: environnementComplet
        };

      } catch (error) {
        this.showSnackbar(error.message || 'Erreur de chargement', 'error');
      } finally {
        this.loading = false;
      }
    },

    onEnvironmentUpdated() {
      // Mettre à jour la liste des applications
      this.fetchApplications();
      this.selection = [];
      this.showSnackbar('Environnement mis à jour avec succès !', 'success');
    },

    onEnvironmentCreated() {
      // Mettre à jour la liste des applications
      this.fetchApplications();
      this.selection = [];
      this.showSnackbar('Nouvel environnement créé avec succès !', 'success');
    },

    showSnackbar(text, color = 'success') {
      this.snackbar = {
        show: true,
        text,
        color,
        timeout: color === 'error' ? 8000 : 6000
      };
    }
  },

  async created() {
    await this.fetchApplications();
  },

  beforeUnmount() {
    // Nettoyer le timeout si le composant est détruit
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
};
</script>
