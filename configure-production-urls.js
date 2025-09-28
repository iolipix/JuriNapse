/**
 * Configuration des URLs pour la production Railway
 */

const fs = require('fs');
const path = require('path');

console.log('🌐 Configuration des URLs pour la production...\n');

// URLs de production
const productionUrls = {
  FRONTEND_URL: 'https://jurinapse.com', // Remplace par ton vraie URL frontend
  // Si ton frontend est aussi sur Railway, utilise l'URL Railway
  // FRONTEND_URL: 'https://ton-frontend.railway.app'
};

// Chemin vers le fichier .env du backend
const envPath = path.join(__dirname, 'backend', 'config', '.env');

try {
  // Lire le fichier .env existant
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Fichier .env existant trouvé');
  } else {
    console.log('❌ Fichier .env non trouvé');
    process.exit(1);
  }

  // Fonction pour mettre à jour ou ajouter une variable
  const updateEnvVar = (content, key, value) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      return content.replace(regex, `${key}=${value}`);
    } else {
      return content + `\n${key}=${value}`;
    }
  };

  // Mettre à jour les URLs
  console.log('📋 Mise à jour des URLs :');
  
  Object.entries(productionUrls).forEach(([key, value]) => {
    envContent = updateEnvVar(envContent, key, value);
    console.log(`   ${key}=${value}`);
  });

  // Écrire le fichier .env mis à jour
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  
  console.log('\n✅ URLs mises à jour avec succès !');
  console.log(`📁 Fichier : ${envPath}`);
  
  console.log('\n🚨 IMPORTANT :');
  console.log('1. Ajoutez FRONTEND_URL sur Railway avec la vraie URL de votre site');
  console.log('2. Les redirections Stripe iront maintenant vers votre site en production');
  console.log('3. Testez à nouveau le flux d\'abonnement');

} catch (error) {
  console.error('❌ Erreur lors de la configuration :', error.message);
  process.exit(1);
}