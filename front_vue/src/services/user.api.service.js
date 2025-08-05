import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/users';

class UserApiService {
  /**
   * Récupère tous les utilisateurs
   */
  async getAllUsers() {
    try {
      const response = await axios.get(API_BASE_URL);
      return response.data.data;
    } catch (error) {
      console.error('Erreur getAllUsers:', error);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur getUserById:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel utilisateur
   */
  async createUser(userData) {
    try {
      const response = await axios.post(API_BASE_URL, userData);
      return response.data;
    } catch (error) {
      console.error('Erreur createUser:', error);
      throw error;
    }
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(id, userData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Erreur updateUser:', error);
      throw error;
    }
  }

  /**
   * Supprime un utilisateur
   */
  async deleteUser(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur deleteUser:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des rôles disponibles
   */
  async getAvailableRoles() {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur getAvailableRoles:', error);
      throw error;
    }
  }

  /**
   * Vérifie la santé du service
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Erreur healthCheck:', error);
      throw error;
    }
  }
}

export const userApiService = new UserApiService();
