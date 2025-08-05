const fs = require('fs');
const path = require('path');

class UserServiceJson {
  constructor() {
    this.roles = {
      ARCHI: "Architecte/CP",
      ING_RES: "Ing Réseau", 
      SD_RES: "SD Réseau",
      ADMIN: "Admin",
    };
    this.usersFilePath = path.join(__dirname, "..", "config", "users_data.json");
    this.initializeUsersFile();
  }

  /**
   * Initialise le fichier des utilisateurs s'il n'existe pas
   */
  initializeUsersFile() {
    try {
      if (!fs.existsSync(this.usersFilePath)) {
        // Créer le fichier avec des utilisateurs par défaut
        const defaultUsers = [
          { id: 1, user_name: "user-admin", role: "ADMIN", role_name: "Admin", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 2, user_name: "user-archi", role: "ARCHI", role_name: "Architecte/CP", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 3, user_name: "user-sd", role: "SD_RES", role_name: "SD Réseau", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 4, user_name: "user-ing", role: "ING_RES", role_name: "Ing Réseau", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ];
        
        this.saveUsers(defaultUsers);
        console.log("Fichier users_data.json créé avec les utilisateurs par défaut");
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du fichier users:", error);
    }
  }

  /**
   * Lit les utilisateurs depuis le fichier JSON
   */
  readUsers() {
    try {
      if (!fs.existsSync(this.usersFilePath)) {
        return [];
      }
      const data = fs.readFileSync(this.usersFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier users:", error);
      return [];
    }
  }

  /**
   * Sauvegarde les utilisateurs dans le fichier JSON
   */
  saveUsers(users) {
    try {
      // Créer le répertoire config s'il n'existe pas
      const configDir = path.dirname(this.usersFilePath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(this.usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du fichier users:", error);
      throw error;
    }
  }

  /**
   * Génère un nouvel ID unique
   */
  generateNewId(users) {
    if (users.length === 0) return 1;
    return Math.max(...users.map(user => user.id)) + 1;
  }

  /**
   * Initialise la table des utilisateurs (pour compatibilité avec l'interface)
   */
  async initializeUsersTable() {
    // Cette méthode existe pour maintenir la compatibilité avec l'interface
    // En mode JSON, l'initialisation se fait dans le constructeur
    console.log("Service JSON: utilisateurs initialisés");
    return Promise.resolve();
  }

  /**
   * Récupère tous les utilisateurs
   */
  async getAllUsers() {
    try {
      const users = this.readUsers();
      return users.sort((a, b) => a.user_name.localeCompare(b.user_name));
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par son nom
   */
  async getUserByName(userName) {
    try {
      const users = this.readUsers();
      return users.find(user => user.user_name === userName) || null;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(id) {
    try {
      const users = this.readUsers();
      return users.find(user => user.id === parseInt(id)) || null;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      throw error;
    }
  }

  /**
   * Ajoute un nouvel utilisateur
   */
  async addUser(userName, role) {
    try {
      if (!userName || !role) {
        throw new Error("Le nom d'utilisateur et le rôle sont requis");
      }

      if (!this.roles[role]) {
        throw new Error(`Rôle invalide. Rôles autorisés: ${Object.keys(this.roles).join(', ')}`);
      }

      const users = this.readUsers();
      
      // Vérifier si l'utilisateur existe déjà
      const existingUser = users.find(user => user.user_name === userName);
      if (existingUser) {
        const error = new Error("Utilisateur déjà existant");
        error.code = "ER_DUP_ENTRY";
        throw error;
      }

      const newUser = {
        id: this.generateNewId(users),
        user_name: userName,
        role: role,
        role_name: this.roles[role],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      users.push(newUser);
      this.saveUsers(users);
      
      return newUser.id;
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'utilisateur:", error);
      throw error;
    }
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(id, userName, role) {
    try {
      const users = this.readUsers();
      const userIndex = users.findIndex(user => user.id === parseInt(id));
      
      if (userIndex === -1) {
        throw new Error("Utilisateur introuvable");
      }

      if (!this.roles[role]) {
        throw new Error(`Rôle invalide. Rôles autorisés: ${Object.keys(this.roles).join(', ')}`);
      }

      // Vérifier si le nouveau nom d'utilisateur existe déjà (sauf pour l'utilisateur actuel)
      const existingUser = users.find(user => user.user_name === userName && user.id !== parseInt(id));
      if (existingUser) {
        throw new Error("Ce nom d'utilisateur est déjà utilisé");
      }

      users[userIndex] = {
        ...users[userIndex],
        user_name: userName,
        role: role,
        role_name: this.roles[role],
        updated_at: new Date().toISOString()
      };

      this.saveUsers(users);
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      throw error;
    }
  }

  /**
   * Supprime un utilisateur par son ID
   */
  async deleteUser(id) {
    try {
      const users = this.readUsers();
      const userIndex = users.findIndex(user => user.id === parseInt(id));
      
      if (userIndex === -1) {
        throw new Error("Utilisateur introuvable");
      }

      users.splice(userIndex, 1);
      this.saveUsers(users);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur a le rôle admin
   */
  async isAdmin(userName) {
    try {
      const user = await this.getUserByName(userName);
      return user && user.role === 'ADMIN';
    } catch (error) {
      console.error("Erreur lors de la vérification du rôle admin:", error);
      return false;
    }
  }

  /**
   * Récupère la liste des rôles disponibles
   */
  getAvailableRoles() {
    return Object.keys(this.roles).map(key => ({
      key,
      name: this.roles[key]
    }));
  }

  /**
   * Ajoute des utilisateurs par défaut (pour compatibilité avec l'interface)
   */
  async addDefaultUsers() {
    // Cette méthode existe pour maintenir la compatibilité
    // Les utilisateurs par défaut sont créés dans initializeUsersFile()
    console.log("Service JSON: utilisateurs par défaut déjà initialisés");
    return Promise.resolve();
  }
}

module.exports = new UserServiceJson();
