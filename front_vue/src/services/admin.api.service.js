import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/admin';

class AdminApiService {
  // Applications
  async getAllApplications() {
    try {
      const response = await axios.get(`${API_BASE_URL}/applications`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur getAllApplications:', error);
      throw error;
    }
  }

  async getApplicationById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/applications/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur getApplicationById:', error);
      throw error;
    }
  }

  async createApplication(applicationData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/applications`, applicationData);
      return response.data;
    } catch (error) {
      console.error('Erreur createApplication:', error);
      throw error;
    }
  }

  async updateApplication(id, applicationData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/applications/${id}`, applicationData);
      return response.data;
    } catch (error) {
      console.error('Erreur updateApplication:', error);
      throw error;
    }
  }

  async deleteApplication(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/applications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur deleteApplication:', error);
      throw error;
    }
  }

  // Sous-applications
  async addSousApplication(appId, sousApplicationData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/applications/${appId}/sous-applications`, sousApplicationData);
      return response.data;
    } catch (error) {
      console.error('Erreur addSousApplication:', error);
      throw error;
    }
  }

  async deleteSousApplication(appId, sousAppId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/applications/${appId}/sous-applications/${sousAppId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur deleteSousApplication:', error);
      throw error;
    }
  }

  // Environnements
  async getEnvironnements(appId, sousAppId = null) {
    try {
      const url = sousAppId ? 
        `${API_BASE_URL}/applications/${appId}/environnements?sousAppId=${sousAppId}` :
        `${API_BASE_URL}/applications/${appId}/environnements`;
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      console.error('Erreur getEnvironnements:', error);
      throw error;
    }
  }
}

export const adminApiService = new AdminApiService();
