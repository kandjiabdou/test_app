const db = require("./db");
const fs = require('fs');
const path = require('path');

class UserService {
  constructor() {
    this.roles = {
      ARCHI: "Architecte/CP",
      ING_RES: "Ing Réseau", 
      SD_RES: "SD Réseau",
      ADMIN: "Admin",
    };
  }

  /**
   * Initialise la table des utilisateurs si elle n'existe pas
   */
  async initializeUsersTable() {
    try {
      const createTable = `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_name VARCHAR(30) UNIQUE NOT NULL,
        role VARCHAR(15) NOT NULL DEFAULT 'SD_RES',
        role_name VARCHAR(20) NOT NULL DEFAULT 'SD Réseau',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`;
      
      await db.query(createTable);
      console.log("Table users vérifiée/créée");
      
      // Ajouter des utilisateurs par défaut si la table est vide
      const users = await this.getAllUsers();
      if (users.length === 0) {
        await this.addDefaultUsers();
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la table users:", error);
      throw error;
    }
  }

  /**
   * Ajoute des utilisateurs par défaut depuis le fichier de configuration
   */
  async addDefaultUsers() {
    try {
      const jsonFilePath = path.join(__dirname, "..", "config", "users.json");
      
      if (!fs.existsSync(jsonFilePath)) {
        console.log("Fichier users.json non trouvé, pas d'utilisateurs par défaut ajoutés");
        return;
      }

      const data = fs.readFileSync(jsonFilePath, "utf8");
      const users = JSON.parse(data);
      
      for (const [userName, role] of Object.entries(users)) {
        try {
          await this.addUser(userName, role);
          console.log(`Utilisateur par défaut "${userName}" ajouté`);
        } catch (err) {
          if (err.code === "ER_DUP_ENTRY") {
            console.log(`Utilisateur "${userName}" existe déjà`);
          } else {
            console.error(`Erreur lors de l'ajout de "${userName}":`, err);
          }
        }
      }
    } catch (err) {
      console.error("Erreur lors de l'ajout des utilisateurs par défaut:", err);
    }
  }

  /**
   * Récupère tous les utilisateurs
   */
  async getAllUsers() {
    try {
      const query = "SELECT * FROM users ORDER BY user_name";
      const [rows] = await db.query(query);
      return rows;
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
      const query = "SELECT * FROM users WHERE user_name = ?";
      const [rows] = await db.query(query, [userName]);
      return rows[0] || null;
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
      const query = "SELECT * FROM users WHERE id = ?";
      const [rows] = await db.query(query, [id]);
      return rows[0] || null;
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

      const role_name = this.roles[role];
      const query = "INSERT INTO users (user_name, role, role_name) VALUES (?, ?, ?)";
      const [result] = await db.query(query, [userName, role, role_name]);
      
      return result.insertId;
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
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new Error("Utilisateur introuvable");
      }

      if (!this.roles[role]) {
        throw new Error(`Rôle invalide. Rôles autorisés: ${Object.keys(this.roles).join(', ')}`);
      }

      const role_name = this.roles[role];
      const query = "UPDATE users SET user_name = ?, role = ?, role_name = ? WHERE id = ?";
      const [result] = await db.query(query, [userName, role, role_name, id]);
      
      return result.affectedRows > 0;
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
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new Error("Utilisateur introuvable");
      }

      const query = "DELETE FROM users WHERE id = ?";
      const [result] = await db.query(query, [id]);
      
      return result.affectedRows > 0;
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
}

module.exports = new UserService();
