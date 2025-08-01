const userService = require('./services/userService');

// Script pour créer des utilisateurs de test
async function createTestUsers() {
  try {
    console.log('=== Création d\'utilisateurs de test ===');
    
    // Initialiser la table
    await userService.initializeUsersTable();
    
    const testUsers = [
      { user_name: 'admin-test', role: 'ADMIN' },
      { user_name: 'archi-test', role: 'ARCHI' },
      { user_name: 'sd-test', role: 'SD_RES' },
      { user_name: 'ing-test', role: 'ING_RES' }
    ];
    
    for (const userData of testUsers) {
      try {
        const existingUser = await userService.getUserByName(userData.user_name);
        if (existingUser) {
          console.log(`⚠️  L'utilisateur ${userData.user_name} existe déjà`);
        } else {
          const userId = await userService.addUser(userData.user_name, userData.role);
          console.log(`✓ Utilisateur ${userData.user_name} créé avec l'ID ${userId}`);
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${userData.user_name}:`, error.message);
      }
    }
    
    // Afficher tous les utilisateurs
    const users = await userService.getAllUsers();
    console.log(`\n✓ Total: ${users.length} utilisateurs dans la base`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs de test:', error);
  }
}

// Exécuter la création
createTestUsers();
