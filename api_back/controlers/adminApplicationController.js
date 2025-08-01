const adminApplicationService = require('../services/adminApplicationService');

class AdminApplicationController {
  // GET /api/admin/applications
  async getAllApplications(req, res) {
    try {
      const applications = adminApplicationService.getAllApplications();
      res.json({
        success: true,
        data: applications,
        total: applications.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des applications',
        message: error.message
      });
    }
  }

  // GET /api/admin/applications/:id
  async getApplicationById(req, res) {
    try {
      const { id } = req.params;
      const application = adminApplicationService.getApplicationById(id);
      res.json({
        success: true,
        data: application
      });
    } catch (error) {
      const statusCode = error.message.includes('non trouvée') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'application',
        message: error.message
      });
    }
  }

  // POST /api/admin/applications
  async createApplication(req, res) {
    try {
      const result = adminApplicationService.createApplication(req.body);
      res.status(201).json({
        success: true,
        message: result.message,
        data: { id: result.id }
      });
    } catch (error) {
      const statusCode = error.message.includes('existe déjà') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        error: 'Erreur lors de la création de l\'application',
        message: error.message
      });
    }
  }

  // PUT /api/admin/applications/:id
  async updateApplication(req, res) {
    try {
      const { id } = req.params;
      const result = adminApplicationService.updateApplication(id, req.body);
      res.json({
        success: true,
        message: result.message,
        data: { id: result.id }
      });
    } catch (error) {
      const statusCode = error.message.includes('non trouvée') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: 'Erreur lors de la mise à jour de l\'application',
        message: error.message
      });
    }
  }

  // DELETE /api/admin/applications/:id
  async deleteApplication(req, res) {
    try {
      const { id } = req.params;
      const result = adminApplicationService.deleteApplication(id);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('non trouvée') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: 'Erreur lors de la suppression de l\'application',
        message: error.message
      });
    }
  }

  // POST /api/admin/applications/:id/sous-applications
  async addSousApplication(req, res) {
    try {
      const { id } = req.params;
      const result = adminApplicationService.addSousApplication(id, req.body);
      res.status(201).json({
        success: true,
        message: result.message,
        data: { id: result.id }
      });
    } catch (error) {
      const statusCode = error.message.includes('non trouvée') ? 404 : 
                        error.message.includes('existe déjà') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        error: 'Erreur lors de la création de la sous-application',
        message: error.message
      });
    }
  }

  // DELETE /api/admin/applications/:id/sous-applications/:sousAppId
  async deleteSousApplication(req, res) {
    try {
      const { id, sousAppId } = req.params;
      const result = adminApplicationService.deleteSousApplication(id, sousAppId);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('non trouvée') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: 'Erreur lors de la suppression de la sous-application',
        message: error.message
      });
    }
  }

  // GET /api/admin/applications/:id/environnements
  async getEnvironnements(req, res) {
    try {
      const { id } = req.params;
      const { sousAppId } = req.query;
      const environnements = adminApplicationService.getEnvironnements(id, sousAppId);
      res.json({
        success: true,
        data: environnements,
        total: environnements.length
      });
    } catch (error) {
      const statusCode = error.message.includes('non trouvée') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: 'Erreur lors de la récupération des environnements',
        message: error.message
      });
    }
  }
}

module.exports = new AdminApplicationController();
