const fs = require('fs');
const path = require('path');

class ApplicationService {
  constructor() {
    this.dataPath = path.join(__dirname, '../open_flux_data/appplications.json');
  }

  /**
   * Charge les données depuis le fichier JSON
   */
  loadData() {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      throw new Error('Impossible de charger les données des applications');
    }
  }

  /**
   * Sauvegarde les données dans le fichier JSON
   */
  saveData(data) {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 4), 'utf8');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
      throw new Error('Impossible de sauvegarder les données des applications');
    }
  }

  /**
   * Récupère toutes les applications avec transformation pour le frontend
   */
  getAllApplications(searchQuery = '') {
    const rawData = this.loadData();
    const applications = this.transformApplicationsData(rawData);

    // Filtrage par recherche si nécessaire
    if (searchQuery && searchQuery.trim() !== '') {
      return this.filterApplications(applications, searchQuery.trim());
    }

    return applications;
  }

  /**
   * Transforme les données JSON brutes en format attendu par le frontend
   */
  transformApplicationsData(rawData) {
    const applications = [];
    let applicationId = 1;
    let environnementId = 1;
    let sousApplicationId = 1;

    Object.keys(rawData).forEach(resourceKey => {
      const appData = rawData[resourceKey];
      
      const application = {
        id: applicationId++,
        nomApplication: appData.nomApplication,
        nomRessourceCloud: resourceKey, // Utiliser la clé comme nomRessourceCloud
        hasSousApp: appData.hasSousApp,
        SousApplications: [],
        Environnements: []
      };

      // Gestion des sous-applications
      if (appData.hasSousApp && appData.sousApplications) {
        Object.keys(appData.sousApplications).forEach(sousAppKey => {
          const sousAppData = appData.sousApplications[sousAppKey];
          
          const sousApplication = {
            id: sousApplicationId++,
            nomSousApplication: sousAppData.nomSousApplication,
            Environnements: []
          };

          // Environnements de la sous-application
          if (sousAppData.environnements) {
            Object.keys(sousAppData.environnements).forEach(envKey => {
              const envData = sousAppData.environnements[envKey];
              
              sousApplication.Environnements.push({
                id: environnementId++,
                typeEnvironnement: envKey,
                proprietaire: envData.proprietaire,
                dateCreation: envData.dateCreation,
                idOuvertureEnv: envData.nomDemandeOuverture || `DOF-${resourceKey}-${sousAppKey}-${envKey}`,
                applicationId: application.id,
                sousApplicationId: sousApplication.id,
                VersionEnvironnements: []
              });
            });
          }

          application.SousApplications.push(sousApplication);
        });
      }

      // Environnements directement rattachés à l'application (sans sous-application)
      if (appData.environnements && typeof appData.environnements === 'object' && !Array.isArray(appData.environnements)) {
        Object.keys(appData.environnements).forEach(envKey => {
          const envData = appData.environnements[envKey];
          
          application.Environnements.push({
            id: environnementId++,
            typeEnvironnement: envKey,
            proprietaire: envData.proprietaire,
            dateCreation: envData.dateCreation,
            idOuvertureEnv: envData.nomDemandeOuverture || `DOF-${resourceKey}-${envKey}`,
            applicationId: application.id,
            sousApplicationId: null,
            VersionEnvironnements: []
          });
        });
      }

      applications.push(application);
    });

    return applications;
  }

  /**
   * Recherche des applications avec enrichissement des environnements disponibles
   */
  searchApplications(searchQuery = '') {
    const rawData = this.loadData();
    const applications = this.transformApplicationsData(rawData);

    // Filtrage par recherche
    let filteredApplications = applications;
    if (searchQuery && searchQuery.trim() !== '') {
      filteredApplications = this.filterApplications(applications, searchQuery.trim());
    }

    // Enrichir avec les environnements disponibles
    const enrichedApps = this.enrichWithAvailableEnvironments(filteredApplications);
    
    return enrichedApps;
  }

  /**
   * Récupère une demande par son ID (nom du fichier)
   */
  getEnvironnementById(idOuvertureEnv) {
    try {
      // Construire le chemin du fichier
      const nomFichier = `${idOuvertureEnv}.json`;
      const cheminFichier = path.join(__dirname, '../open_flux_data/demandes', nomFichier);

      // Vérifier si le fichier existe
      if (!fs.existsSync(cheminFichier)) {
        throw new Error(`Aucune demande trouvée avec l'ID "${idOuvertureEnv}"`);
      }

      // Charger et parser le fichier
      const data = fs.readFileSync(cheminFichier, 'utf8');
      const demandeData = JSON.parse(data);

      console.log(`Demande récupérée: ${nomFichier}`);

      return {
        success: true,
        fileName: nomFichier,
        filePath: cheminFichier,
        data: demandeData
      };

    } catch (error) {
      // Pas de console.error ici, juste remonter l'erreur
      throw error;
    }
  }

  /**
   * Met à jour une demande existante
   */
  updateEnvironnement(idOuvertureEnv, demandeData) {
    try {
      // Validation des données obligatoires
      this.validateDemandeData(demandeData);

      // Construire le chemin du fichier
      const nomFichier = `${idOuvertureEnv}.json`;
      const cheminFichier = path.join(__dirname, '../open_flux_data/demandes', nomFichier);

      // Vérifier si le fichier existe
      if (!fs.existsSync(cheminFichier)) {
        throw new Error(`Aucune demande trouvée avec l'ID "${idOuvertureEnv}"`);
      }

      // Charger les données existantes pour conserver certaines métadonnées
      const existingData = JSON.parse(fs.readFileSync(cheminFichier, 'utf8'));

      // Préparer les données mises à jour
      const demandeComplete = this.formatDemandeDataForUpdate(demandeData, existingData);

      // Sauvegarder la demande mise à jour
      fs.writeFileSync(cheminFichier, JSON.stringify(demandeComplete, null, 2), 'utf8');

      console.log(`Demande mise à jour: ${nomFichier}`);

      return {
        success: true,
        message: 'Demande d\'ouverture de flux mise à jour avec succès',
        fileName: nomFichier,
        filePath: cheminFichier,
        data: demandeComplete
      };

    } catch (error) {
      console.error('Erreur lors de la mise à jour de la demande:', error);
      throw error;
    }
  }

  /**
   * Formate les données de la demande pour une mise à jour
   */
  formatDemandeDataForUpdate(demandeData, existingData) {
    return {
      application: {
        nomDemandeOuverture: demandeData.application.nomDemandeOuverture?.trim(),
        proprietaire: demandeData.application.proprietaire?.trim(),
        nomApplication: demandeData.application.nomApplication?.trim(),
        nomRessourceCloud: demandeData.application.nomRessourceCloud?.trim(),
        nomSousApplication: demandeData.application.nomSousApplication?.trim() || null,
        environnement: demandeData.application.environnement?.trim(),
        applicationId: demandeData.application.applicationId,
        sousApplicationId: demandeData.application.sousApplicationId || null
      },
      composants: demandeData.composants || [],
      matriceFlux: demandeData.matriceFlux || [],
      affectationGroupsInputs: demandeData.affectationGroupsInputs || {},
      affectationGroupsAuto: demandeData.affectationGroupsAuto || {},
      metadata: {
        ...existingData.metadata, // Conserver les métadonnées existantes
        dateModification: new Date().toISOString(),
        version: existingData.metadata?.version || '1.0'
      }
    };
  }

  /**
   * Crée une nouvelle demande d'ouverture de flux
   */
  createOuvertureFlux(demandeData) {
    try {
      // Validation des données obligatoires
      this.validateDemandeData(demandeData);

      // Générer le nom du fichier basé sur nomDemandeOuverture
      const nomFichier = `${demandeData.application.nomDemandeOuverture}.json`;
      const cheminFichier = path.join(__dirname, '../open_flux_data/demandes', nomFichier);

      // Vérifier si la demande existe déjà
      if (fs.existsSync(cheminFichier)) {
        throw new Error(`Une demande avec le nom "${demandeData.application.nomDemandeOuverture}" existe déjà`);
      }

      // Préparer les données à sauvegarder
      const demandeComplete = this.formatDemandeData(demandeData);

      // Créer le dossier demandes s'il n'existe pas
      const dossierDemandes = path.join(__dirname, '../open_flux_data/demandes');
      if (!fs.existsSync(dossierDemandes)) {
        fs.mkdirSync(dossierDemandes, { recursive: true });
      }

      // Sauvegarder la demande
      fs.writeFileSync(cheminFichier, JSON.stringify(demandeComplete, null, 2), 'utf8');

      // Mettre à jour le fichier applications.json avec le nouvel environnement
      this.updateApplicationsWithNewEnvironment(demandeData);

      console.log(`Nouvelle demande créée: ${nomFichier}`);
      console.log(`Fichier applications.json mis à jour avec le nouvel environnement`);

      return {
        success: true,
        message: 'Demande d\'ouverture de flux créée avec succès',
        fileName: nomFichier,
        filePath: cheminFichier,
        data: demandeComplete
      };

    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      throw error;
    }
  }

  /**
   * Met à jour le fichier applications.json avec le nouvel environnement
   */
  updateApplicationsWithNewEnvironment(demandeData) {
    try {
      // Charger les données actuelles des applications
      const rawData = this.loadData();
      
      const {
        nomRessourceCloud,
        nomDemandeOuverture,
        nomSousApplication,
        environnement,
        proprietaire,
      } = demandeData.application;
      const dateCreation = new Date().toISOString();

      // Vérifier que l'application existe
      if (!rawData[nomRessourceCloud]) {
        throw new Error(`L'application avec la ressource cloud "${nomRessourceCloud}" n'existe pas`);
      }

      const application = rawData[nomRessourceCloud];

      // Nouvel environnement à ajouter
      const newEnvironment = {
        nomDemandeOuverture: nomDemandeOuverture,
        proprietaire: proprietaire,
        dateCreation: dateCreation
      };

      if (nomSousApplication) {
        // Cas avec sous-application
        if (!application.hasSousApp || !application.sousApplications || !application.sousApplications[nomSousApplication]) {
          throw new Error(`La sous-application "${nomSousApplication}" n'existe pas pour l'application "${nomRessourceCloud}"`);
        }

        // Vérifier que l'environnement n'existe pas déjà
        if (application.sousApplications[nomSousApplication].environnements[environnement]) {
          throw new Error(`L'environnement "${environnement}" existe déjà pour la sous-application "${nomSousApplication}"`);
        }

        // Ajouter le nouvel environnement à la sous-application
        application.sousApplications[nomSousApplication].environnements[environnement] = newEnvironment;
        
      } else {
        // Cas sans sous-application
        if (application.hasSousApp) {
          throw new Error(`L'application "${nomRessourceCloud}" a des sous-applications, vous devez spécifier une sous-application`);
        }

        // Vérifier que l'environnement n'existe pas déjà
        if (application.environnements[environnement]) {
          throw new Error(`L'environnement "${environnement}" existe déjà pour l'application "${nomRessourceCloud}"`);
        }

        // Ajouter le nouvel environnement à l'application
        application.environnements[environnement] = newEnvironment;
      }

      // Sauvegarder le fichier applications.json mis à jour
      this.saveData(rawData);
      
      console.log(`Environnement "${environnement}" ajouté à ${nomRessourceCloud}${nomSousApplication ? `-${nomSousApplication}` : ''}`);

    } catch (error) {
      console.error('Erreur lors de la mise à jour du fichier applications.json:', error);
      throw new Error(`Impossible de mettre à jour le fichier applications.json: ${error.message}`);
    }
  }

  /**
   * Valide les données obligatoires d'une demande
   */
  validateDemandeData(demandeData) {
    const requiredFields = [
      'application.nomDemandeOuverture',
      'application.proprietaire',
      'application.nomApplication',
      'application.nomRessourceCloud',
      'application.environnement'
    ];

    for (const field of requiredFields) {
      const value = this.getNestedValue(demandeData, field);
      if (!value || value.trim() === '') {
        throw new Error(`Le champ "${field}" est obligatoire`);
      }
    }

    // Vérifier que le nom de la demande suit le bon format
    const nomDemande = demandeData.application.nomDemandeOuverture;
    if (!nomDemande.startsWith('DOF-')) {
      throw new Error('Le nom de la demande doit commencer par "DOF-"');
    }
  }

  /**
   * Récupère une valeur imbriquée dans un objet
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  /**
   * Formate les données de la demande pour la sauvegarde
   */
  formatDemandeData(demandeData) {
    return {
      application: {
        nomDemandeOuverture: demandeData.application.nomDemandeOuverture?.trim(),
        proprietaire: demandeData.application.proprietaire?.trim(),
        nomApplication: demandeData.application.nomApplication?.trim(),
        nomRessourceCloud: demandeData.application.nomRessourceCloud?.trim(),
        nomSousApplication: demandeData.application.nomSousApplication?.trim() || null,
        environnement: demandeData.application.environnement?.trim(),
        applicationId: demandeData.application.applicationId,
        sousApplicationId: demandeData.application.sousApplicationId || null
      },
      composants: demandeData.composants || [],
      matriceFlux: demandeData.matriceFlux || [],
      affectationGroupsInputs: demandeData.affectationGroupsInputs || {},
      affectationGroupsAuto: demandeData.affectationGroupsAuto || {},
      metadata: {
        dateCreation: new Date().toISOString(),
        version: '1.0'
      }
    };
  }

  /**
   * Enrichit les applications avec la liste des environnements disponibles
   */
  enrichWithAvailableEnvironments(applications) {
    const allEnvTypes = ['POC', 'DEV', 'REC', 'PPR', 'PRD'];
    
    return applications.map(app => {
      if (app.hasSousApp) {
        return {
          ...app,
          sousApplications: app.SousApplications.map(sousApp => {
            const usedEnvs = sousApp.Environnements.map(env => env.typeEnvironnement);
            const availableEnvs = allEnvTypes.filter(env => !usedEnvs.includes(env));
            return {
              ...sousApp,
              environnementsDisponibles: availableEnvs
            };
          })
        };
      } else {
        const usedEnvs = app.Environnements.map(env => env.typeEnvironnement);
        const availableEnvs = allEnvTypes.filter(env => !usedEnvs.includes(env));
        return {
          ...app,
          environnementsDisponibles: availableEnvs
        };
      }
    });
  }

  /**
   * Filtre les applications selon une requête de recherche
   */
  filterApplications(applications, searchQuery) {
    const query = searchQuery.toLowerCase();
    
    return applications.filter(app => {
      // Recherche dans le nom de l'application
      if (app.nomApplication && app.nomApplication.toLowerCase().includes(query)) {
        return true;
      }

      // Recherche dans le nom de la ressource cloud
      if (app.nomRessourceCloud && app.nomRessourceCloud.toLowerCase().includes(query)) {
        return true;
      }

      // Recherche dans les sous-applications
      if (app.SousApplications && app.SousApplications.some(sousApp => 
        sousApp.nomSousApplication && sousApp.nomSousApplication.toLowerCase().includes(query)
      )) {
        return true;
      }

      // Recherche dans les types d'environnement
      const allEnvironnements = [
        ...(app.Environnements || []),
        ...(app.SousApplications || []).flatMap(sousApp => sousApp.Environnements || [])
      ];

      return allEnvironnements.some(env => 
        env.typeEnvironnement && env.typeEnvironnement.toLowerCase().includes(query)
      );
    });
  }
}

module.exports = new ApplicationService();
