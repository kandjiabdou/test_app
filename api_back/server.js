const express = require('express');
const cors = require('cors');
const path = require('path');
const UserServiceFactory = require('./services/userServiceFactory');
const userService = UserServiceFactory.getUserService();

// Import des routes
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialisation de la base de données
async function initializeDatabase() {
  try {
    await userService.initializeUsersTable();
    console.log('Base de données initialisée');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
}

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ message: 'API Backend OpenFlux - OK', timestamp: new Date().toISOString() });
});

// Démarrage du serveur
app.listen(PORT, async () => {
  console.log(`Serveur API démarré sur le port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Applications: http://localhost:${PORT}/api/applications`);
  console.log(`Admin: http://localhost:${PORT}/api/admin/applications`);
  console.log(`Users: http://localhost:${PORT}/api/users`);
  
  // Initialiser la base de données
  await initializeDatabase();
});

module.exports = app;
