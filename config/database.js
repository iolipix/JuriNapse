const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

// Charger les variables cryptées ou encodées en fallback
const { loadEncryptedEnv } = require('../utils/crypto-env');
const { decodeEnvVars } = require('../utils/decode-env');

const connectDB = async () => {
  try {
    // Essayer de charger les variables cryptées d'abord
    if (!loadEncryptedEnv()) {
      // Si échec, essayer les variables encodées
      decodeEnvVars();
    }

    // Construction de l'URI MongoDB
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbCluster = process.env.DB_CLUSTER;
    const dbAppName = process.env.DB_APP_NAME;
    const dbName = process.env.DB_NAME || 'jurinapse';
    
    if (!dbUser || !dbPassword || !dbCluster || !dbAppName) {
      throw new Error('Variables de base de données manquantes');
    }
    
    const mongoURI = `mongodb+srv://${dbUser}:${dbPassword}@${dbCluster}/${dbName}?retryWrites=true&w=majority&appName=${dbAppName}`;
    
    const conn = await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connecté avec succès');
    return conn;
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    throw error;
  }
};

module.exports = connectDB;
