const applicationService = require("../services/applicationService");

class ApplicationController {
  /**
   * GET /api/applications
   * Récupère toutes les applications avec filtrage optionnel
   */
  async getAllApplications(req, res) {
    try {
      const { q } = req.query; // Paramètre de recherche

      const applications = applicationService.getAllApplications(q);

      res.status(200).json({
        success: true,
        data: applications,
        total: applications.length,
        query: q || null,
      });
    } catch (error) {
      console.error("Erreur dans getAllApplications:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la récupération des applications",
        message: error.message,
      });
    }
  }

  /**
   * GET /api/applications/demandes/:id
   * Récupère une demande par son ID
   */
  async getEnvironnementById(req, res) {
    try {
      const { id } = req.params;

      if (!id || id.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "ID de demande manquant",
          message: "L'ID de la demande est obligatoire",
        });
      }

      const result = applicationService.getEnvironnementById(id);

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      if (error.message.includes("Aucune demande trouvée")) {
        console.log(`Demande non trouvée: ${req.params.id}`);
        return res.status(404).json({
          success: false,
          error: "Demande introuvable",
          message: `La demande "${req.params.id}" n'existe pas`,
        });
      }

      console.error("Erreur dans getEnvironnementById:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur interne s'est produite",
      });
    }
  }

  /**
   * PUT /api/applications/demandes/:id
   * Met à jour une demande existante
   */
  async updateEnvironnement(req, res) {
    try {
      const { id } = req.params;
      const demandeData = req.body;

      if (!id || id.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "ID de demande manquant",
          message: "L'ID de la demande est obligatoire",
        });
      }

      if (!demandeData || Object.keys(demandeData).length === 0) {
        return res.status(400).json({
          success: false,
          error: "Données de demande manquantes",
          message: "Le corps de la requête ne peut pas être vide",
        });
      }

      const result = applicationService.updateEnvironnement(id, demandeData);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          fileName: result.fileName,
          demande: result.data,
        },
      });
    } catch (error) {
      console.error("Erreur dans updateEnvironnement:", error);

      const statusCode = error.message.includes("Aucune demande trouvée")
        ? 404
        : 400;

      res.status(statusCode).json({
        success: false,
        error: "Erreur lors de la mise à jour de la demande",
        message: error.message,
      });
    }
  }

  /**
   * POST /api/applications/demandes
   * Crée une nouvelle demande d'ouverture de flux
   */
  async createOuvertureFlux(req, res) {
    try {
      const demandeData = req.body;

      if (!demandeData || Object.keys(demandeData).length === 0) {
        return res.status(400).json({
          success: false,
          error: "Données de demande manquantes",
          message: "Le corps de la requête ne peut pas être vide",
        });
      }

      const result = applicationService.createOuvertureFlux(demandeData);

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          fileName: result.fileName,
          demande: result.data,
        },
      });
    } catch (error) {
      console.error("Erreur dans createOuvertureFlux:", error);

      const statusCode = error.message.includes("existe déjà") ? 409 : 400;

      res.status(statusCode).json({
        success: false,
        error: "Erreur lors de la création de la demande",
        message: error.message,
      });
    }
  }

  /**
   * GET /api/applications/search
   * Recherche des applications avec enrichissement pour l'autocomplete
   */
  async searchApplications(req, res) {
    try {
      const { q } = req.query; // Paramètre de recherche

      if (!q || q.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "Paramètre de recherche requis",
          message: 'Le paramètre "q" est obligatoire pour la recherche',
        });
      }

      const applications = applicationService.searchApplications(q);

      res.status(200).json({
        success: true,
        data: applications,
        total: applications.length,
        query: q,
      });
    } catch (error) {
      console.error("Erreur dans searchApplications:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la recherche des applications",
        message: error.message,
      });
    }
  }

  /**
   * GET /api/applications/health
   * Vérifie la santé du service applications
   */
  async healthCheck(req, res) {
    try {
      const applications = applicationService.getAllApplications();

      res.status(200).json({
        success: true,
        message: "Service applications opérationnel",
        totalApplications: applications.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Service applications indisponible",
        message: error.message,
      });
    }
  }
}

module.exports = new ApplicationController();
