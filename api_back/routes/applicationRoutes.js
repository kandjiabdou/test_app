const express = require('express');
const applicationController = require('../controlers/applicationController');

const router = express.Router();

/**
 * GET /api/applications
 * Récupère toutes les applications
 * Query params:
 *   - q: string (optionnel) - Terme de recherche
 */
router.get('/', applicationController.getAllApplications);

/**
 * GET /api/applications/search
 * Recherche des applications avec enrichissement pour l'autocomplete
 * Query params:
 *   - q: string (requis) - Terme de recherche
 */
router.get('/search', applicationController.searchApplications);

/**
 * GET /api/applications/demandes/:id
 * Récupère une demande par son ID (idOuvertureEnv)
 */
router.get('/demandes/:id', applicationController.getEnvironnementById);

/**
 * POST /api/applications/demandes
 * Crée une nouvelle demande d'ouverture de flux
 */
router.post('/demandes', applicationController.createOuvertureFlux);

/**
 * PUT /api/applications/demandes/:id
 * Met à jour une demande existante par son ID (idOuvertureEnv)
 */
router.put('/demandes/:id', applicationController.updateEnvironnement);

/**
 * GET /api/applications/health
 * Vérifie la santé du service applications
 */
router.get('/health', applicationController.healthCheck);

module.exports = router;
