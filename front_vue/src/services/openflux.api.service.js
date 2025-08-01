import axios from "axios";

// Configuration de base pour l'API
const API_BASE_URL = process.env.VUE_APP_API_URL || "http://localhost:3001/api";

class OpenFluxApiService {
  constructor() {
    // Instance Axios avec configuration de base
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // 10 secondes
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Intercepteur pour les réponses (gestion d'erreurs globales)
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        // Pas de console.error ici pour éviter les doublons
        return Promise.reject(error);
      }
    );
  }

  /**
   * Récupère toutes les applications
   * @param {Object} params - Paramètres de requête
   * @param {string} params.q - Terme de recherche (optionnel)
   * @returns {Promise<Array>} Liste des applications
   */
  async getAllApplications(params = {}) {
    try {
      const response = await this.apiClient.get("/applications", { params });

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Format de réponse inattendu");
      }
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Recherche des applications pour l'autocomplete
   * @param {string} query - Terme de recherche
   * @returns {Promise<Array>} Applications enrichies avec environnements disponibles
   */
  async searchApplications(query) {
    try {
      const params = { q: query, enriched: true };
      const response = await this.apiClient.get("/applications/search", {
        params,
      });

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Format de réponse inattendu pour la recherche");
      }
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Récupère un environnement par son ID
   * @param {string} environnementId - ID de l'environnement (idOuvertureEnv)
   * @returns {Promise<Object>} Détails de l'environnement
   */
  async getEnvironnementById(environnementId) {
    try {
      const response = await this.apiClient.get(
        `/applications/demandes/${environnementId}`
      );

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Format de réponse inattendu");
      }
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Crée une nouvelle ouverture de flux
   * @param {Object} data - Données de l'ouverture de flux
   * @returns {Promise<Object>} Réponse de création
   */
  async createOuvertureFlux(data) {
    try {
      const response = await this.apiClient.post(
        "/applications/demandes",
        data
      );

      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error("Format de réponse inattendu pour la création");
      }
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Met à jour un environnement
   * @param {string} environnementId - ID de l'environnement (idOuvertureEnv)
   * @param {Object} data - Données de mise à jour
   * @returns {Promise<Object>} Réponse de mise à jour
   */
  async updateEnvironnement(environnementId, data) {
    try {
      const response = await this.apiClient.put(
        `/applications/demandes/${environnementId}`,
        data
      );

      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error("Format de réponse inattendu pour la mise à jour");
      }
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Vérifie la santé de l'API
   * @returns {Promise<Object>} État de santé de l'API
   */
  async healthCheck() {
    try {
      const response = await this.apiClient.get("/applications/health");
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Gestion centralisée des erreurs API
   * @param {Error} error - Erreur axios
   * @throws {Error} Erreur formatée
   */
  handleApiError(error) {
    if (error.response) {
      // Erreur avec réponse du serveur
      const { status, data } = error.response;
      
      if (status === 404) {
        throw new Error("Demande introuvable");
      }
      
      const message = data?.error || data?.message || `Erreur ${status}`;
      throw new Error(message);
    } else if (error.request) {
      // Erreur de réseau (pas de réponse)
      throw new Error("Serveur indisponible");
    } else {
      // Autre erreur
      throw new Error("Erreur inconnue");
    }
  }
}

// Export d'une instance unique (singleton)
export const apiService = new OpenFluxApiService();
