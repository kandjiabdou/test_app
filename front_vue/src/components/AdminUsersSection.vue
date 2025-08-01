<template>
    <v-container fluid>
        <!-- En-tête -->
        <v-card class="mb-4">
            <v-card-title class="d-flex align-center pa-4 bg-primary">
                <v-icon start>mdi-account-group</v-icon>
                <span class="text-h5">Gestion des Utilisateurs</span>
                <v-spacer></v-spacer>
                <v-btn 
                    color="white" 
                    variant="outlined" 
                    prepend-icon="mdi-plus" 
                    @click="openCreateDialog"
                >
                    Nouvel utilisateur
                </v-btn>
            </v-card-title>
        </v-card>

        <!-- Recherche -->
        <v-card class="mb-4">
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-text-field
                            v-model="searchText"
                            label="Rechercher un utilisateur"
                            prepend-inner-icon="mdi-magnify"
                            variant="outlined"
                            clearable
                            density="compact"
                        ></v-text-field>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Liste des utilisateurs -->
        <v-card>
            <v-card-text>
                <v-data-table
                    :headers="headers"
                    :items="filteredUsers"
                    :loading="loading"
                    item-value="id"
                    class="elevation-1"
                >
                    <template #[`item.role_name`]="{ item }">
                        <v-chip
                            :color="getRoleColor(item.role)"
                            size="small"
                            variant="flat"
                        >
                            {{ item.role_name }}
                        </v-chip>
                    </template>

                    <template #[`item.created_at`]="{ item }">
                        {{ formatDate(item.created_at) }}
                    </template>

                    <template #[`item.actions`]="{ item }">
                        <v-btn
                            icon="mdi-pencil"
                            size="small"
                            variant="text"
                            color="primary"
                            @click="editUser(item)"
                        ></v-btn>
                        <v-btn
                            icon="mdi-delete"
                            size="small"
                            variant="text"
                            color="error"
                            @click="deleteUser(item)"
                        ></v-btn>
                    </template>
                </v-data-table>
            </v-card-text>
        </v-card>

        <!-- Dialog Utilisateur -->
        <v-dialog v-model="userDialog.show" max-width="500">
            <v-card>
                <v-card-title class="text-h6">
                    {{ userDialog.mode === 'create' ? 'Créer un utilisateur' : 'Modifier l\'utilisateur' }}
                </v-card-title>
                
                <v-card-text>
                    <v-form ref="userForm" v-model="userDialog.valid">
                        <v-text-field
                            v-model="userDialog.form.user_name"
                            label="Nom d'utilisateur"
                            :rules="userNameRules"
                            variant="outlined"
                            required
                        ></v-text-field>

                        <v-select
                            v-model="userDialog.form.role"
                            :items="availableRoles"
                            item-title="name"
                            item-value="key"
                            label="Rôle"
                            :rules="roleRules"
                            variant="outlined"
                            required
                        ></v-select>
                    </v-form>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn 
                        text 
                        @click="userDialog.show = false"
                        :disabled="userDialog.loading"
                    >
                        Annuler
                    </v-btn>
                    <v-btn
                        color="primary"
                        :loading="userDialog.loading"
                        :disabled="!userDialog.valid"
                        @click="saveUser"
                    >
                        {{ userDialog.mode === 'create' ? 'Créer' : 'Modifier' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Snackbar -->
        <v-snackbar 
            v-model="snackbar.show" 
            :color="snackbar.color" 
            :timeout="snackbar.timeout"
        >
            {{ snackbar.text }}
        </v-snackbar>
    </v-container>
</template>

<script>
import { userApiService } from '@/services/user.api.service';

export default {
    name: 'AdminUsersSection',
    
    data() {
        return {
            loading: false,
            searchText: '',
            users: [],
            availableRoles: [],

            headers: [
                { title: 'ID', key: 'id', width: '80px' },
                { title: 'Nom d\'utilisateur', key: 'user_name', sortable: true },
                { title: 'Rôle', key: 'role_name', sortable: true, width: '150px' },
                { title: 'Date de création', key: 'created_at', sortable: true, width: '150px' },
                { title: 'Actions', key: 'actions', sortable: false, width: '120px' }
            ],

            // Dialog Utilisateur
            userDialog: {
                show: false,
                mode: 'create', // 'create' | 'edit'
                valid: false,
                loading: false,
                form: {
                    user_name: '',
                    role: ''
                }
            },

            // Snackbar
            snackbar: {
                show: false,
                text: '',
                color: 'success',
                timeout: 4000
            },

            // Règles de validation
            userNameRules: [
                v => !!v || 'Le nom d\'utilisateur est requis',
                v => (v && v.length >= 3) || 'Le nom doit contenir au moins 3 caractères',
                v => (v && v.length <= 30) || 'Le nom ne peut pas dépasser 30 caractères'
            ],
            roleRules: [
                v => !!v || 'Le rôle est requis'
            ]
        };
    },

    computed: {
        filteredUsers() {
            if (!this.searchText) return this.users;

            const search = this.searchText.toLowerCase();
            return this.users.filter(user =>
                user.user_name.toLowerCase().includes(search) ||
                user.role_name.toLowerCase().includes(search)
            );
        }
    },

    async created() {
        await this.loadUsers();
        await this.loadAvailableRoles();
    },

    methods: {
        async loadUsers() {
            try {
                this.loading = true;
                this.users = await userApiService.getAllUsers();
            } catch (error) {
                this.showSnackbar('Erreur lors du chargement des utilisateurs', 'error');
                console.error('Erreur:', error);
            } finally {
                this.loading = false;
            }
        },

        async loadAvailableRoles() {
            try {
                this.availableRoles = await userApiService.getAvailableRoles();
            } catch (error) {
                this.showSnackbar('Erreur lors du chargement des rôles', 'error');
                console.error('Erreur:', error);
            }
        },

        openCreateDialog() {
            this.userDialog = {
                show: true,
                mode: 'create',
                valid: false,
                loading: false,
                form: {
                    user_name: '',
                    role: ''
                }
            };
        },

        editUser(user) {
            this.userDialog = {
                show: true,
                mode: 'edit',
                valid: true,
                loading: false,
                form: {
                    id: user.id,
                    user_name: user.user_name,
                    role: user.role
                }
            };
        },

        async saveUser() {
            if (!this.userDialog.valid) return;

            try {
                this.userDialog.loading = true;

                if (this.userDialog.mode === 'create') {
                    await userApiService.createUser(this.userDialog.form);
                    this.showSnackbar('Utilisateur créé avec succès');
                } else {
                    await userApiService.updateUser(this.userDialog.form.id, this.userDialog.form);
                    this.showSnackbar('Utilisateur modifié avec succès');
                }

                await this.loadUsers();
                this.userDialog.show = false;
            } catch (error) {
                const message = error.response?.data?.message || 'Erreur lors de la sauvegarde';
                this.showSnackbar(message, 'error');
                console.error('Erreur:', error);
            } finally {
                this.userDialog.loading = false;
            }
        },

        async deleteUser(user) {
            if (!confirm(`Supprimer l'utilisateur "${user.user_name}" ?`)) return;

            try {
                await userApiService.deleteUser(user.id);
                this.showSnackbar('Utilisateur supprimé avec succès');
                await this.loadUsers();
            } catch (error) {
                const message = error.response?.data?.message || 'Erreur lors de la suppression';
                this.showSnackbar(message, 'error');
                console.error('Erreur:', error);
            }
        },

        getRoleColor(role) {
            const colors = {
                'ADMIN': 'red',
                'ARCHI': 'purple',
                'ING_RES': 'blue',
                'SD_RES': 'green'
            };
            return colors[role] || 'grey';
        },

        formatDate(dateString) {
            if (!dateString) return '';
            return new Date(dateString).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        },

        showSnackbar(text, color = 'success') {
            this.snackbar = {
                show: true,
                text,
                color,
                timeout: 4000
            };
        }
    }
};
</script>

<style scoped>
.v-data-table {
    font-size: 0.875rem;
}
</style>