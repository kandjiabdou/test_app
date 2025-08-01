const fs = require('fs');
const path = require('path');

class AdminApplicationService {
  constructor() {
    this.dataPath = path.join(__dirname, '../open_flux_data/appplications.json');
  }

  // Charger les données du fichier JSON
  loadData() {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      return {};
    }
  }

  // Sauvegarder les données dans le fichier JSON
  saveData(data) {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 4), 'utf8');
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw new Error('Erreur lors de la sauvegarde des données');
    }
  }

  // Obtenir toutes les applications avec transformation pour l'affichage
  getAllApplications() {
    const data = this.loadData();
    const applications = [];

    Object.keys(data).forEach(id => {
      const app = data[id];
      const sousApps = app.hasSousApp && app.sousApplications ? Object.keys(app.sousApplications) : [];
      
      let environnementsCount = 0;
      
      if (app.hasSousApp && app.sousApplications) {
        // Pour les applications avec sous-applications, compter les environnements de toutes les sous-applications
        Object.values(app.sousApplications).forEach(sousApp => {
          if (sousApp.environnements) {
            environnementsCount += Object.keys(sousApp.environnements).length;
          }
        });
      } else {
        // Pour les applications simples, compter les environnements de l'application
        const envs = app.environnements ? Object.keys(app.environnements) : [];
        environnementsCount = envs.length;
      }

      applications.push({
        id, // La clé du JSON (qui est le nomRessourceCloud)
        nomApplication: app.nomApplication,
        nomRessourceCloud: id, // ID et nomRessourceCloud sont identiques
        hasSousApp: app.hasSousApp,
        sousApplicationsCount: sousApps.length,
        environnementsCount: environnementsCount,
        sousApplications: sousApps,
        environnements: app.environnements ? Object.keys(app.environnements) : []
      });
    });

    return applications;
  }

  // Obtenir une application par ID
  getApplicationById(id) {
    const data = this.loadData();
    if (!data[id]) {
      throw new Error(`Application ${id} non trouvée`);
    }
    
    const app = data[id];
    const sousApps = app.hasSousApp && app.sousApplications ? app.sousApplications : {};
    const envs = app.environnements || {};

    return {
      id, // La clé du JSON (qui est le nomRessourceCloud)
      nomApplication: app.nomApplication,
      nomRessourceCloud: id, // ID et nomRessourceCloud sont identiques
      hasSousApp: app.hasSousApp,
      sousApplications: sousApps,
      environnements: envs
    };
  }

  // Créer une nouvelle application
  createApplication(appData) {
    const data = this.loadData();
    const { nomApplication, nomRessourceCloud, hasSousApp } = appData;
    
    // Utiliser nomRessourceCloud comme clé
    const id = nomRessourceCloud;

    if (data[id]) {
      throw new Error(`Application ${id} existe déjà`);
    }

    data[id] = {
      nomApplication,
      hasSousApp: hasSousApp || false,
      sousApplications: hasSousApp ? {} : [],
      environnements: {}
    };

    this.saveData(data);
    return { id, message: 'Application créée avec succès' };
  }

  // Mettre à jour une application
  updateApplication(id, appData) {
    const data = this.loadData();
    if (!data[id]) {
      throw new Error(`Application ${id} non trouvée`);
    }

    const { nomApplication, hasSousApp } = appData;
    
    data[id].nomApplication = nomApplication || data[id].nomApplication;
    data[id].hasSousApp = hasSousApp !== undefined ? hasSousApp : data[id].hasSousApp;

    this.saveData(data);
    return { id, message: 'Application mise à jour avec succès' };
  }

  // Supprimer une application
  deleteApplication(id) {
    const data = this.loadData();
    if (!data[id]) {
      throw new Error(`Application ${id} non trouvée`);
    }

    delete data[id];
    this.saveData(data);
    return { message: 'Application supprimée avec succès' };
  }

  // Ajouter une sous-application
  addSousApplication(appId, sousAppData) {
    const data = this.loadData();
    if (!data[appId]) {
      throw new Error(`Application ${appId} non trouvée`);
    }

    if (!data[appId].hasSousApp) {
      throw new Error(`L'application ${appId} ne supporte pas les sous-applications`);
    }

    const { nomSousApplication } = sousAppData;
    
    // Utiliser nomSousApplication comme clé
    const id = nomSousApplication;
    
    if (!data[appId].sousApplications) {
      data[appId].sousApplications = {};
    }

    if (data[appId].sousApplications[id]) {
      throw new Error(`Sous-application ${id} existe déjà`);
    }

    data[appId].sousApplications[id] = {
      nomSousApplication,
      environnements: {}
    };

    this.saveData(data);
    return { id, message: 'Sous-application créée avec succès' };
  }

  // Supprimer une sous-application
  deleteSousApplication(appId, sousAppId) {
    const data = this.loadData();
    if (!data[appId]) {
      throw new Error(`Application ${appId} non trouvée`);
    }

    if (!data[appId].sousApplications || !data[appId].sousApplications[sousAppId]) {
      throw new Error(`Sous-application ${sousAppId} non trouvée`);
    }

    delete data[appId].sousApplications[sousAppId];
    this.saveData(data);
    return { message: 'Sous-application supprimée avec succès' };
  }

  // Obtenir les environnements d'une application
  getEnvironnements(appId, sousAppId = null) {
    const data = this.loadData();
    if (!data[appId]) {
      throw new Error(`Application ${appId} non trouvée`);
    }

    let environnements = {};

    if (sousAppId) {
      if (!data[appId].sousApplications || !data[appId].sousApplications[sousAppId]) {
        throw new Error(`Sous-application ${sousAppId} non trouvée`);
      }
      environnements = data[appId].sousApplications[sousAppId].environnements || {};
    } else {
      environnements = data[appId].environnements || {};
    }

    return Object.keys(environnements).map(envId => ({
      id: envId,
      ...environnements[envId]
    }));
  }
}

module.exports = new AdminApplicationService();
