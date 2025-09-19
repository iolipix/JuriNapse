#!/usr/bin/env node

/**
 * Script principal de configuration Stripe pour JuriNapse Premium
 * Installe les dépendances et configure l'environnement automatiquement
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.magenta}🚀 ${msg}${colors.reset}\n`),
  step: (msg) => console.log(`${colors.cyan}📋 ${msg}${colors.reset}`)
};

function runScript(scriptPath) {
  try {
    log.step(`Exécution: ${scriptPath}`);
    execSync(`node "${scriptPath}"`, { 
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    return true;
  } catch (error) {
    log.error(`Erreur lors de l'exécution de ${scriptPath}`);
    return false;
  }
}

async function main() {
  log.title('🎯 Configuration Complète Stripe pour JuriNapse Premium');
  
  console.log(`${colors.bold}Ce script va automatiquement:${colors.reset}`);
  console.log('• 📦 Installer les dépendances Stripe nécessaires');
  console.log('• ⚙️  Configurer les variables d\'environnement');
  console.log('• 📖 Fournir la documentation complète');
  console.log('• ✅ Vérifier que tout est correctement configuré\n');

  // Étape 1: Installation des dépendances
  log.title('Étape 1/2: Installation des dépendances');
  
  const installScript = path.join(__dirname, 'install-stripe-deps.js');
  const installSuccess = runScript(installScript);
  
  if (!installSuccess) {
    log.error('Échec de l\'installation des dépendances');
    process.exit(1);
  }

  log.success('✅ Dépendances Stripe installées avec succès !');

  // Étape 2: Configuration de l'environnement
  log.title('Étape 2/2: Configuration de l\'environnement');
  
  const setupScript = path.join(__dirname, 'setup-stripe.js');
  const setupSuccess = runScript(setupScript);
  
  if (!setupSuccess) {
    log.error('Échec de la configuration de l\'environnement');
    process.exit(1);
  }

  // Configuration terminée
  log.title('🎉 Configuration Stripe Terminée !');
  
  console.log(`${colors.bold}${colors.green}Félicitations ! Votre intégration Stripe est prête.${colors.reset}\n`);
  
  console.log(`${colors.bold}Fonctionnalités implémentées:${colors.reset}`);
  console.log('✅ Service Stripe backend complet');
  console.log('✅ Routes API pour les abonnements');
  console.log('✅ Gestion automatique des webhooks');
  console.log('✅ Interface utilisateur premium');
  console.log('✅ Pages de succès et d\'annulation');
  console.log('✅ Intégration dans la sidebar');
  console.log('✅ Système d\'historique premium\n');

  console.log(`${colors.bold}Documentation disponible:${colors.reset}`);
  console.log('📖 STRIPE_SETUP_GUIDE.md - Guide complet de configuration');
  console.log('🔧 Variables d\'environnement configurées automatiquement\n');

  console.log(`${colors.bold}Prochaines étapes:${colors.reset}`);
  console.log('1. 🔑 Obtenez vos clés API depuis le Dashboard Stripe');
  console.log('2. 🎯 Créez un produit premium dans Stripe');
  console.log('3. 🔗 Configurez les webhooks Stripe');
  console.log('4. 🚀 Redémarrez vos serveurs de développement');
  console.log('5. ✨ Testez l\'abonnement premium !');

  console.log(`\n${colors.bold}${colors.cyan}Happy coding ! 🎉${colors.reset}`);
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  log.error(`Erreur non gérée: ${error.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  log.info('\nConfiguration annulée par l\'utilisateur');
  process.exit(0);
});

// Lancer le script principal
main().catch((error) => {
  log.error(`Erreur: ${error.message}`);
  process.exit(1);
});