const mongoose = require('mongoose');
require('dotenv').config({ path: './config/.env' });

console.log('🔍 Diagnostic de connexion MongoDB');
console.log('📋 Configuration actuelle:');
console.log('   - MONGODB_URI:', process.env.MONGODB_URI ? 'Définie' : 'Non définie');
console.log('   - DB_USER:', process.env.DB_USER);
console.log('   - DB_PASSWORD:', process.env.DB_PASSWORD ? 'Défini (masqué)' : 'Non défini');
console.log('   - DB_CLUSTER:', process.env.DB_CLUSTER);

async function testConnection() {
  try {
    console.log('\n🔄 Tentative de connexion...');
    
    const mongoUri = process.env.MONGODB_URI;
    console.log('   URI utilisée:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connexion MongoDB réussie !');
    
    // Tester une requête simple
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Collections trouvées:', collections.length);
    
    await mongoose.disconnect();
    console.log('🔌 Déconnexion réussie');
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 Solutions possibles:');
      console.log('   1. Vérifier le nom d\'utilisateur et mot de passe');
      console.log('   2. Vérifier que l\'utilisateur existe dans MongoDB Atlas');
      console.log('   3. Vérifier les permissions de l\'utilisateur');
      console.log('   4. Vérifier que l\'IP est autorisée (whitelist)');
    }
    
    if (error.message.includes('network')) {
      console.log('\n🌐 Problème réseau détecté:');
      console.log('   1. Vérifier la connexion internet');
      console.log('   2. Vérifier que MongoDB Atlas est accessible');
    }
  }
}

testConnection();
