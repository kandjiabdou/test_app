const userService = require('../services/userService');

class UserController {
  /**
   * GET /api/users
   * Récupère tous les utilisateurs
   */
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      
      res.status(200).json({
        success: true,
        data: users,
        total: users.length
      });
    } catch (error) {
      console.error('Erreur dans getAllUsers:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des utilisateurs',
        message: error.message
      });
    }
  }

  /**
   * GET /api/users/:id
   * Récupère un utilisateur par son ID
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'ID utilisateur invalide',
          message: 'L\'ID doit être un nombre'
        });
      }

      const user = await userService.getUserById(parseInt(id));
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur introuvable',
          message: `Aucun utilisateur trouvé avec l'ID ${id}`
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Erreur dans getUserById:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'utilisateur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/users
   * Crée un nouvel utilisateur
   */
  async createUser(req, res) {
    try {
      const { user_name, role } = req.body;

      if (!user_name || !role) {
        return res.status(400).json({
          success: false,
          error: 'Données manquantes',
          message: 'Le nom d\'utilisateur et le rôle sont requis'
        });
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await userService.getUserByName(user_name);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Utilisateur existant',
          message: `L'utilisateur "${user_name}" existe déjà`
        });
      }

      const userId = await userService.addUser(user_name, role);
      const newUser = await userService.getUserById(userId);

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: newUser
      });
    } catch (error) {
      console.error('Erreur dans createUser:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          error: 'Utilisateur existant',
          message: 'Cet utilisateur existe déjà'
        });
      }

      res.status(400).json({
        success: false,
        error: 'Erreur lors de la création de l\'utilisateur',
        message: error.message
      });
    }
  }

  /**
   * PUT /api/users/:id
   * Met à jour un utilisateur
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { user_name, role } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'ID utilisateur invalide',
          message: 'L\'ID doit être un nombre'
        });
      }

      if (!user_name || !role) {
        return res.status(400).json({
          success: false,
          error: 'Données manquantes',
          message: 'Le nom d\'utilisateur et le rôle sont requis'
        });
      }

      const updated = await userService.updateUser(parseInt(id), user_name, role);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur introuvable',
          message: `Aucun utilisateur trouvé avec l'ID ${id}`
        });
      }

      const updatedUser = await userService.getUserById(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        data: updatedUser
      });
    } catch (error) {
      console.error('Erreur dans updateUser:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          error: 'Nom d\'utilisateur déjà utilisé',
          message: 'Ce nom d\'utilisateur est déjà utilisé par un autre utilisateur'
        });
      }

      res.status(400).json({
        success: false,
        error: 'Erreur lors de la mise à jour de l\'utilisateur',
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/users/:id
   * Supprime un utilisateur
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'ID utilisateur invalide',
          message: 'L\'ID doit être un nombre'
        });
      }

      const deleted = await userService.deleteUser(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur introuvable',
          message: `Aucun utilisateur trouvé avec l'ID ${id}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Utilisateur supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur dans deleteUser:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression de l\'utilisateur',
        message: error.message
      });
    }
  }

  /**
   * GET /api/users/roles
   * Récupère la liste des rôles disponibles
   */
  async getAvailableRoles(req, res) {
    try {
      const roles = userService.getAvailableRoles();
      
      res.status(200).json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Erreur dans getAvailableRoles:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des rôles',
        message: error.message
      });
    }
  }

  /**
   * GET /api/users/health
   * Vérifie la santé du service utilisateurs
   */
  async healthCheck(req, res) {
    try {
      const users = await userService.getAllUsers();
      
      res.status(200).json({
        success: true,
        message: 'Service utilisateurs opérationnel',
        totalUsers: users.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Service utilisateurs indisponible',
        message: error.message
      });
    }
  }
}

module.exports = new UserController();
