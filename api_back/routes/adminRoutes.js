const express = require('express');
const adminApplicationController = require('../controlers/adminApplicationController');

const router = express.Router();

// Routes pour les applications
router.get('/applications', adminApplicationController.getAllApplications);
router.get('/applications/:id', adminApplicationController.getApplicationById);
router.post('/applications', adminApplicationController.createApplication);
router.put('/applications/:id', adminApplicationController.updateApplication);
router.delete('/applications/:id', adminApplicationController.deleteApplication);

// Routes pour les sous-applications
router.post('/applications/:id/sous-applications', adminApplicationController.addSousApplication);
router.delete('/applications/:id/sous-applications/:sousAppId', adminApplicationController.deleteSousApplication);

// Routes pour les environnements
router.get('/applications/:id/environnements', adminApplicationController.getEnvironnements);

module.exports = router;
