const express = require('express');
const userController = require('../controlers/userController');

const router = express.Router();

/**
 * GET /api/users
 * Récupère tous les utilisateurs
 */
router.get('/', userController.getAllUsers);

/**
 * GET /api/users/roles
 * Récupère la liste des rôles disponibles
 */
router.get('/roles', userController.getAvailableRoles);

/**
 * GET /api/users/health
 * Vérifie la santé du service utilisateurs
 */
router.get('/health', userController.healthCheck);

/**
 * GET /api/users/:id
 * Récupère un utilisateur par son ID
 */
router.get('/:id', userController.getUserById);

/**
 * POST /api/users
 * Crée un nouvel utilisateur
 * Body: { user_name: string, role: string }
 */
router.post('/', userController.createUser);

/**
 * PUT /api/users/:id
 * Met à jour un utilisateur
 * Body: { user_name: string, role: string }
 */
router.put('/:id', userController.updateUser);

/**
 * DELETE /api/users/:id
 * Supprime un utilisateur par son ID
 */
router.delete('/:id', userController.deleteUser);

module.exports = router;
