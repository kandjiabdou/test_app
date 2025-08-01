<template>
    <v-container fluid>
        <!-- En-tête -->
        <v-card class="mb-4">
            <v-card-title class="d-flex align-center pa-4 bg-primary">
                <v-icon start>mdi-application-cog</v-icon>
                <span class="text-h5">Gestion des Applications</span>
                <v-spacer></v-spacer>
                <v-btn color="white" variant="outlined" prepend-icon="mdi-plus" @click="openCreateDialog">
                    Nouvelle Application
                </v-btn>
            </v-card-title>
        </v-card>

        <!-- Recherche -->
        <v-card class="mb-4">
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="searchText" prepend-icon="mdi-magnify" label="Rechercher..." clearable
                            variant="outlined" density="compact" />
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-btn @click="loadApplications" :loading="loading" variant="outlined"
                            prepend-icon="mdi-refresh">
                            Actualiser
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Liste des applications -->
        <v-card>
            <v-card-text>
                <v-data-table :headers="headers" :items="filteredApplications" :loading="loading" item-value="id"
                    class="elevation-1">
                    <template #[`item.hasSousApp`]="{ item }">
                        <v-chip :color="item.hasSousApp ? 'success' : 'default'" size="small" variant="outlined">
                            {{ item.hasSousApp ? 'Avec sous-apps' : 'Simple' }}
                        </v-chip>
                    </template>

                    <template #[`item.actions`]="{ item }">
                        <div class="d-flex ga-1">
                            <v-btn icon="mdi-eye" size="small" color="primary" variant="text"
                                @click="viewDetails(item)" />
                            <v-btn icon="mdi-pencil" size="small" color="primary" variant="text"
                                @click="editApplication(item)" />
                            <v-btn v-if="item.hasSousApp" icon="mdi-folder-plus" size="small" color="success"
                                variant="text" @click="addSousApp(item)" />
                            <v-btn icon="mdi-delete" size="small" color="error" variant="text"
                                @click="deleteApplication(item)" />
                        </div>
                    </template>
                </v-data-table>
            </v-card-text>
        </v-card>

        <!-- Dialog Application -->
        <v-dialog v-model="appDialog.show" max-width="600">
            <v-card>
                <v-card-title>
                    {{ appDialog.mode === 'create' ? 'Nouvelle Application' : 'Modifier Application' }}
                </v-card-title>
                <v-card-text>
                    <v-form ref="appForm" v-model="appDialog.valid">
                        <v-text-field v-model="appDialog.form.nomApplication" label="Nom Application" required
                            variant="outlined" class="mb-3" />
                        <v-text-field v-model="appDialog.form.nomRessourceCloud" label="Ressource Cloud (ID)" required
                            variant="outlined" class="mb-3" :disabled="appDialog.mode === 'edit'"
                            @input="formatRessourceCloud" />
                        <v-checkbox v-model="appDialog.form.hasSousApp" label="Supporte les sous-applications" />
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="appDialog.show = false">Annuler</v-btn>
                    <v-btn color="primary" @click="saveApplication" :loading="appDialog.loading">
                        Sauvegarder
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Dialog Sous-Application -->
        <v-dialog v-model="sousAppDialog.show" max-width="500">
            <v-card>
                <v-card-title>Ajouter Sous-Application</v-card-title>
                <v-card-text>
                    <v-form ref="sousAppForm" v-model="sousAppDialog.valid">
                        <v-text-field v-model="sousAppDialog.form.nomSousApplication" label="Nom Sous-Application"
                            required variant="outlined" @input="formatSousApplication" />
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="sousAppDialog.show = false">Annuler</v-btn>
                    <v-btn color="primary" @click="saveSousApplication" :loading="sousAppDialog.loading">
                        Ajouter
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Dialog Détails -->
        <v-dialog v-model="detailsDialog.show" max-width="800">
            <v-card v-if="detailsDialog.application">
                <v-card-title>
                    Détails - {{ detailsDialog.application.nomApplication }}
                </v-card-title>
                <v-card-text>
                    <v-row>
                        <v-col cols="6">
                            <h4>Informations générales</h4>
                            <p><strong>ID:</strong> {{ detailsDialog.application.id }}</p>
                            <p><strong>Nom:</strong> {{ detailsDialog.application.nomApplication }}</p>
                            <p><strong>Ressource Cloud:</strong> {{ detailsDialog.application.nomRessourceCloud }}</p>
                            <p><strong>Type:</strong> {{ detailsDialog.application.hasSousApp ? 'Avec sous-apps' :
                                'Simple' }}
                            </p>
                        </v-col>
                        <v-col cols="6">
                            <h4>Environnements ({{ getTotalEnvironnementsCount() }})</h4>
                            <div v-if="detailsDialog.application.hasSousApp">
                                <!-- Affichage pour applications avec sous-applications -->
                                <div v-for="sousApp in detailsDialog.sousApplications" :key="sousApp.id" class="mb-3">
                                    <v-divider class="mb-2" />
                                    <h5>{{ sousApp.nomSousApplication }} ({{ sousApp.environnements.length }})</h5>
                                    <v-list density="compact" v-if="sousApp.environnements.length > 0">
                                        <v-list-item v-for="env in sousApp.environnements"
                                            :key="`${sousApp.id}-${env.id}`" :title="env.id"
                                            :subtitle="env.proprietaire || 'Aucun propriétaire'" />
                                    </v-list>
                                    <p v-else class="text-grey">Aucun environnement</p>
                                </div>
                            </div>
                            <div v-else>
                                <!-- Affichage pour applications simples -->
                                <v-list density="compact" v-if="detailsDialog.environnements.length > 0">
                                    <v-list-item v-for="env in detailsDialog.environnements" :key="env.id"
                                        :title="env.id" :subtitle="env.proprietaire || 'Aucun propriétaire'" />
                                </v-list>
                                <p v-else class="text-grey">Aucun environnement</p>
                            </div>
                        </v-col>
                    </v-row>

                    <div v-if="detailsDialog.application.hasSousApp" class="mt-4">
                        <h4>Sous-Applications ({{ detailsDialog.sousApplications.length }})</h4>
                        <v-list>
                            <v-list-item v-for="sousApp in detailsDialog.sousApplications" :key="sousApp.id"
                                :title="sousApp.nomSousApplication"
                                :subtitle="`${sousApp.environnements.length} environnement(s)`">
                                <template #append>
                                    <v-btn icon="mdi-delete" size="small" color="error" variant="text"
                                        @click="deleteSousApp(detailsDialog.application.id, sousApp.id)" />
                                </template>
                            </v-list-item>
                        </v-list>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="detailsDialog.show = false">Fermer</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Snackbar -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout">
            {{ snackbar.text }}
        </v-snackbar>
    </v-container>
</template>

<script>
import { adminApiService } from '@/services/admin.api.service';

export default {
    name: 'AdminApplicationsSection',
    data() {
        return {
            loading: false,
            searchText: '',
            applications: [],

            headers: [
                { title: 'Ressource Cloud', key: 'id', width: '120px' },
                { title: 'Nom Application', key: 'nomApplication', sortable: true },
                { title: 'Type', key: 'hasSousApp', sortable: true },
                { title: 'Sous-Apps', key: 'sousApplicationsCount', width: '100px' },
                { title: 'Environnements', key: 'environnementsCount', width: '120px' },
                { title: 'Actions', key: 'actions', sortable: false, width: '200px' }
            ],

            // Dialog Application
            appDialog: {
                show: false,
                mode: 'create', // 'create' | 'edit'
                valid: false,
                loading: false,
                form: {
                    nomApplication: '',
                    nomRessourceCloud: '',
                    hasSousApp: false
                }
            },

            // Dialog Sous-Application
            sousAppDialog: {
                show: false,
                valid: false,
                loading: false,
                appId: '',
                form: {
                    nomSousApplication: ''
                }
            },

            // Dialog Détails
            detailsDialog: {
                show: false,
                application: null,
                environnements: [],
                sousApplications: []
            },

            // Snackbar
            snackbar: {
                show: false,
                text: '',
                color: 'success',
                timeout: 4000
            }
        };
    },

    computed: {
        filteredApplications() {
            if (!this.searchText) return this.applications;

            const search = this.searchText.toLowerCase();
            return this.applications.filter(app =>
                app.nomApplication.toLowerCase().includes(search) ||
                app.nomRessourceCloud.toLowerCase().includes(search) ||
                app.id.toLowerCase().includes(search)
            );
        }
    },

    async created() {
        await this.loadApplications();
    },

    methods: {
        async loadApplications() {
            try {
                this.loading = true;
                this.applications = await adminApiService.getAllApplications();
            } catch (error) {
                this.showSnackbar('Erreur lors du chargement des applications', 'error');
                console.error('Erreur:', error);
            } finally {
                this.loading = false;
            }
        },

        // Gestion des applications
        openCreateDialog() {
            this.appDialog = {
                show: true,
                mode: 'create',
                valid: false,
                loading: false,
                form: {
                    nomApplication: '',
                    nomRessourceCloud: '',
                    hasSousApp: false
                }
            };
        },

        editApplication(app) {
            this.appDialog = {
                show: true,
                mode: 'edit',
                valid: true,
                loading: false,
                form: { ...app }
            };
        },

        async saveApplication() {
            try {
                this.appDialog.loading = true;

                // Utiliser nomRessourceCloud comme ID
                const formData = {
                    ...this.appDialog.form,
                    id: this.appDialog.form.nomRessourceCloud
                };

                if (this.appDialog.mode === 'create') {
                    await adminApiService.createApplication(formData);
                    this.showSnackbar('Application créée avec succès');
                } else {
                    await adminApiService.updateApplication(formData.id, formData);
                    this.showSnackbar('Application modifiée avec succès');
                }

                this.appDialog.show = false;
                await this.loadApplications();
            } catch (error) {
                this.showSnackbar('Erreur lors de la sauvegarde', 'error');
                console.error('Erreur:', error);
            } finally {
                this.appDialog.loading = false;
            }
        },

        async deleteApplication(app) {
            if (!confirm(`Supprimer l'application ${app.nomApplication} ?`)) return;

            try {
                await adminApiService.deleteApplication(app.id);
                this.showSnackbar('Application supprimée avec succès');
                await this.loadApplications();
            } catch (error) {
                this.showSnackbar('Erreur lors de la suppression', 'error');
                console.error('Erreur:', error);
            }
        },

        // Gestion des sous-applications
        addSousApp(app) {
            this.sousAppDialog = {
                show: true,
                valid: false,
                loading: false,
                appId: app.id,
                form: {
                    nomSousApplication: ''
                }
            };
        },

        async saveSousApplication() {
            try {
                this.sousAppDialog.loading = true;
                await adminApiService.addSousApplication(this.sousAppDialog.appId, this.sousAppDialog.form);
                this.showSnackbar('Sous-application ajoutée avec succès');
                this.sousAppDialog.show = false;
                await this.loadApplications();

                // Rafraîchir les détails si ouverts
                if (this.detailsDialog.show && this.detailsDialog.application.id === this.sousAppDialog.appId) {
                    await this.loadApplicationDetails(this.detailsDialog.application);
                }
            } catch (error) {
                this.showSnackbar('Erreur lors de l\'ajout', 'error');
                console.error('Erreur:', error);
            } finally {
                this.sousAppDialog.loading = false;
            }
        },

        async deleteSousApp(appId, sousAppId) {
            if (!confirm(`Supprimer la sous-application ${sousAppId} ?`)) return;

            try {
                await adminApiService.deleteSousApplication(appId, sousAppId);
                this.showSnackbar('Sous-application supprimée avec succès');
                await this.loadApplications();

                // Rafraîchir les détails si ouverts
                if (this.detailsDialog.show && this.detailsDialog.application.id === appId) {
                    await this.loadApplicationDetails(this.detailsDialog.application);
                }
            } catch (error) {
                this.showSnackbar('Erreur lors de la suppression', 'error');
                console.error('Erreur:', error);
            }
        },

        // Gestion des détails
        async viewDetails(app) {
            try {
                await this.loadApplicationDetails(app);
                this.detailsDialog.show = true;
            } catch (error) {
                this.showSnackbar('Erreur lors du chargement des détails', 'error');
                console.error('Erreur:', error);
            }
        },

        async loadApplicationDetails(app) {
            const appDetails = await adminApiService.getApplicationById(app.id);
            this.detailsDialog.application = appDetails;

            if (appDetails.hasSousApp) {
                // Pour les applications avec sous-applications, charger les environnements de chaque sous-application
                this.detailsDialog.environnements = []; // Vide pour les apps avec sous-apps
                this.detailsDialog.sousApplications = await Promise.all(
                    Object.keys(appDetails.sousApplications || {}).map(async (id) => {
                        const sousAppEnvironnements = await adminApiService.getEnvironnements(app.id, id);
                        return {
                            id,
                            nomSousApplication: appDetails.sousApplications[id].nomSousApplication,
                            environnements: sousAppEnvironnements
                        };
                    })
                );
            } else {
                // Pour les applications simples, charger les environnements directs
                this.detailsDialog.environnements = await adminApiService.getEnvironnements(app.id);
                this.detailsDialog.sousApplications = [];
            }
        },

        // Utilitaires
        formatMajusculesSansEspaces(value) {
            return value ? value.replace(/\s+/g, '').toUpperCase() : '';
        },

        formatRessourceCloud() {
            this.appDialog.form.nomRessourceCloud = this.formatMajusculesSansEspaces(this.appDialog.form.nomRessourceCloud);
        },

        formatSousApplication() {
            this.sousAppDialog.form.nomSousApplication = this.formatMajusculesSansEspaces(this.sousAppDialog.form.nomSousApplication);
        },

        getTotalEnvironnementsCount() {
            if (this.detailsDialog.application?.hasSousApp) {
                return this.detailsDialog.sousApplications.reduce((total, sousApp) => {
                    return total + (sousApp.environnements?.length || 0);
                }, 0);
            } else {
                return this.detailsDialog.environnements?.length || 0;
            }
        },

        showSnackbar(text, color = 'success') {
            this.snackbar = {
                show: true,
                text,
                color,
                timeout: color === 'error' ? 6000 : 4000
            };
        }
    }
};
</script>

<style scoped>
.v-data-table {
    font-size: 0.875rem;
}

.v-expansion-panels {
    box-shadow: none;
}
</style>