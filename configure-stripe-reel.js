/**
 * Configuration automatique de Stripe avec les vraies clés de test
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Configuration de Stripe avec les vraies clés de test...\n');

// Configuration Stripe réelle
const stripeConfig = {
  STRIPE_SECRET_KEY: 'sk_test_51S99PoC7f4ITcTzZ8gVfZYdSoT8tPeNRxuJ5AOwmuWWCvXnlRIJnZQwAUxAF9dtmXq78MXQWXmLxkRkHtQ0tBs1300VPA8cqHS',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_VOTRE_CLE_PUBLIQUE_ICI', // À remplacer par la vraie clé publique
  STRIPE_PREMIUM_LOOKUP_KEY: 'Premium-52dc2dc',
  STRIPE_WEBHOOK_SECRET: 'whsec_VOTRE_WEBHOOK_SECRET_ICI' // À configurer plus tard
};

// Chemin vers le fichier .env du backend
const envPath = path.join(__dirname, 'backend', 'config', '.env');

try {
  // Lire le fichier .env existant s'il existe
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Fichier .env existant trouvé');
  } else {
    console.log('📝 Création d\'un nouveau fichier .env');
    // Créer le dossier config s'il n'existe pas
    const configDir = path.dirname(envPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
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

  // Mettre à jour les variables Stripe
  console.log('\n📋 Mise à jour des variables d\'environnement Stripe :');
  
  Object.entries(stripeConfig).forEach(([key, value]) => {
    envContent = updateEnvVar(envContent, key, value);
    console.log(`   ${key}=${value.substring(0, 20)}...`);
  });

  // Écrire le fichier .env mis à jour
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  
  console.log('\n✅ Configuration Stripe mise à jour avec succès !');
  console.log(`📁 Fichier : ${envPath}`);
  
  console.log('\n🚨 IMPORTANT :');
  console.log('1. Récupérez votre clé publique sur https://dashboard.stripe.com/test/apikeys');
  console.log('2. Remplacez "pk_test_VOTRE_CLE_PUBLIQUE_ICI" par votre vraie clé publique');
  console.log('3. Configurez le webhook sur Railway avec l\'URL : https://votre-app.railway.app/api/stripe/webhook');
  console.log('4. Remplacez "whsec_VOTRE_WEBHOOK_SECRET_ICI" par le secret du webhook');
  
  console.log('\n🎯 Prix Premium configuré : 3,00€/mois');
  console.log('🔑 Lookup key : Premium-52dc2dc');

} catch (error) {
  console.error('❌ Erreur lors de la configuration :', error.message);
  process.exit(1);
}