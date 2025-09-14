// Utilitaire pour vérifier la configuration d'environnement
const fs = require('fs');
const path = require('path');

function checkEnvironmentConfig() {
  const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined;
  const hasLocalEnv = fs.existsSync(path.join(__dirname, 'backend', '.env'));
  
  console.log('🔍 Vérification de la configuration environnement:');
  console.log(`📡 Railway detecté: ${isRailway ? '✅' : '❌'}`);
  console.log(`📁 Fichier .env local: ${hasLocalEnv ? '✅' : '❌'}`);
  
  if (isRailway) {
    console.log('🚀 Mode production Railway détecté');
    console.log('📝 Variables importantes:');
    console.log(`   - MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Définie' : '❌ Manquante'}`);
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'non définie'}`);
    console.log(`   - PORT: ${process.env.PORT || 'non défini'}`);
  } else if (hasLocalEnv) {
    console.log('💻 Mode développement local avec .env');
  } else {
    console.log('⚠️  Aucune configuration trouvée');
    console.log('💡 Suggestion: Copiez .env.local vers .env pour le développement');
  }
  
  return { isRailway, hasLocalEnv };
}

if (require.main === module) {
  checkEnvironmentConfig();
}

module.exports = { checkEnvironmentConfig };