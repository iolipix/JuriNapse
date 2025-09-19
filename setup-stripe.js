#!/usr/bin/env node

/**
 * Script de configuration automatique pour Stripe
 * Configure les variables d'environnement et vérifie la configuration
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.blue}🔧 ${msg}${colors.reset}\n`)
};

async function updateEnvFile(filePath, variables) {
  try {
    let envContent = '';
    
    // Lire le fichier existant s'il existe
    if (fs.existsSync(filePath)) {
      envContent = fs.readFileSync(filePath, 'utf8');
    }

    // Ajouter ou mettre à jour les variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`^${key}=.*`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
        log.info(`Mis à jour: ${key}`);
      } else {
        envContent += `\n${newLine}`;
        log.success(`Ajouté: ${key}`);
      }
    }

    // Écrire le fichier
    fs.writeFileSync(filePath, envContent.trim() + '\n');
    log.success(`Fichier mis à jour: ${filePath}`);
    
  } catch (error) {
    log.error(`Erreur lors de la mise à jour de ${filePath}: ${error.message}`);
  }
}

async function main() {
  log.title('Configuration Stripe pour JuriNapse Premium');

  console.log('Ce script va configurer les variables d\'environnement pour Stripe.');
  console.log('Assurez-vous d\'avoir créé votre compte Stripe et d\'avoir les clés API.\n');

  // Configuration backend
  log.title('Configuration Backend');
  
  const stripeSecretKey = await ask('Clé secrète Stripe (sk_test_... ou sk_live_...): ');
  const stripePublishableKey = await ask('Clé publique Stripe (pk_test_... ou pk_live_...): ');
  const stripeWebhookSecret = await ask('Secret webhook Stripe (whsec_...) [optionnel]: ');
  const stripePriceId = await ask('ID du prix premium (price_...) [optionnel]: ');
  const frontendUrl = await ask('URL du frontend [http://localhost:3000]: ') || 'http://localhost:3000';

  // Variables backend
  const backendVars = {
    'STRIPE_SECRET_KEY': stripeSecretKey,
    'STRIPE_PUBLISHABLE_KEY': stripePublishableKey,
    'FRONTEND_URL': frontendUrl
  };

  if (stripeWebhookSecret) {
    backendVars['STRIPE_WEBHOOK_SECRET'] = stripeWebhookSecret;
  }

  if (stripePriceId) {
    backendVars['STRIPE_PRICE_ID'] = stripePriceId;
  }

  // Mettre à jour le .env backend
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  await updateEnvFile(backendEnvPath, backendVars);

  // Configuration frontend
  log.title('Configuration Frontend');
  
  const frontendVars = {
    'REACT_APP_STRIPE_PUBLISHABLE_KEY': stripePublishableKey
  };

  // Mettre à jour le .env frontend
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  await updateEnvFile(frontendEnvPath, frontendVars);

  // Vérifications
  log.title('Vérifications');

  // Vérifier si les dépendances sont installées
  const backendPackageJson = path.join(__dirname, 'backend', 'package.json');
  const frontendPackageJson = path.join(__dirname, 'frontend', 'package.json');

  if (fs.existsSync(backendPackageJson)) {
    const backendPkg = JSON.parse(fs.readFileSync(backendPackageJson, 'utf8'));
    if (!backendPkg.dependencies?.stripe) {
      log.warning('Dépendance Stripe manquante dans le backend. Exécutez: cd backend && npm install stripe');
    } else {
      log.success('Dépendance Stripe trouvée dans le backend');
    }
  }

  if (fs.existsSync(frontendPackageJson)) {
    const frontendPkg = JSON.parse(fs.readFileSync(frontendPackageJson, 'utf8'));
    if (!frontendPkg.dependencies?.['@stripe/stripe-js']) {
      log.warning('Dépendance @stripe/stripe-js manquante dans le frontend. Exécutez: cd frontend && npm install @stripe/stripe-js');
    } else {
      log.success('Dépendance @stripe/stripe-js trouvée dans le frontend');
    }
  }

  // Instructions finales
  log.title('Configuration terminée !');
  
  console.log('Prochaines étapes:');
  console.log('1. Configurer les webhooks dans le Dashboard Stripe');
  console.log('2. Créer un produit et un prix dans Stripe');
  console.log('3. Redémarrer les serveurs backend et frontend');
  console.log('4. Tester l\'abonnement premium');
  console.log('\nConsultez STRIPE_SETUP_GUIDE.md pour plus de détails.');

  rl.close();
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  log.error(`Erreur non gérée: ${error.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  log.info('\nConfiguration annulée par l\'utilisateur');
  rl.close();
  process.exit(0);
});

// Lancer le script
main().catch((error) => {
  log.error(`Erreur: ${error.message}`);
  process.exit(1);
});