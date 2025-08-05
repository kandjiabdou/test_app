require('dotenv').config();

/**
 * Factory pour sélectionner le service utilisateur approprié
 * Basé sur la variable d'environnement DATA_SERVICE
 */
class UserServiceFactory {
  static getUserService() {
    const dataService = process.env.DATA_SERVICE || 'mysql';
    
    console.log(`Configuration DATA_SERVICE: ${dataService}`);
    
    switch (dataService.toLowerCase()) {
      case 'json':
        console.log('Utilisation du service utilisateur JSON');
        return require('./userServiceJson');
      case 'mysql':
        console.log('Utilisation du service utilisateur MySQL');
        return require('./userService');
      default:
        console.warn(`Service de données inconnu: ${dataService}. Utilisation de MySQL par défaut.`);
        return require('./userService');
    }
  }
}

module.exports = UserServiceFactory;
