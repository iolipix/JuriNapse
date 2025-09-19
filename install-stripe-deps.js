#!/usr/bin/env node

/**
 * Script d'installation automatique des dépendances Stripe
 * Installe stripe dans le backend et @stripe/stripe-js dans le frontend
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  title: (msg) => console.log(`\n${colors.bold}${colors.blue}📦 ${msg}${colors.reset}\n`)
};

function runCommand(command, cwd) {
  try {
    log.info(`Exécution: ${command} dans ${cwd}`);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    return true;
  } catch (error) {
    log.error(`Erreur lors de l'exécution de: ${command}`);
    log.error(error.message);
    return false;
  }
}

function checkDirectory(dirPath, name) {
  if (!fs.existsSync(dirPath)) {
    log.error(`Répertoire ${name} non trouvé: ${dirPath}`);
    return false;
  }
  
  const packageJsonPath = path.join(dirPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log.error(`package.json non trouvé dans ${name}: ${packageJsonPath}`);
    return false;
  }
  
  log.success(`Répertoire ${name} vérifié: ${dirPath}`);
  return true;
}

function checkDependency(dirPath, depName) {
  try {
    const packageJsonPath = path.join(dirPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    return allDeps[depName] !== undefined;
  } catch (error) {
    return false;
  }
}

async function main() {
  log.title('Installation des dépendances Stripe pour JuriNapse');

  const backendPath = path.join(__dirname, 'backend');
  const frontendPath = path.join(__dirname, 'frontend');

  // Vérification des répertoires
  log.title('Vérification des répertoires');
  
  const backendExists = checkDirectory(backendPath, 'Backend');
  const frontendExists = checkDirectory(frontendPath, 'Frontend');

  if (!backendExists || !frontendExists) {
    log.error('Impossible de continuer sans les répertoires backend et frontend');
    process.exit(1);
  }

  // Installation backend
  log.title('Installation des dépendances Backend');
  
  if (checkDependency(backendPath, 'stripe')) {
    log.success('Stripe déjà installé dans le backend');
  } else {
    log.info('Installation de stripe dans le backend...');
    const backendSuccess = runCommand('npm install stripe', backendPath);
    
    if (backendSuccess) {
      log.success('Stripe installé avec succès dans le backend');
    } else {
      log.error('Échec de l\'installation de stripe dans le backend');
      process.exit(1);
    }
  }

  // Installation frontend
  log.title('Installation des dépendances Frontend');
  
  if (checkDependency(frontendPath, '@stripe/stripe-js')) {
    log.success('@stripe/stripe-js déjà installé dans le frontend');
  } else {
    log.info('Installation de @stripe/stripe-js dans le frontend...');
    const frontendSuccess = runCommand('npm install @stripe/stripe-js', frontendPath);
    
    if (frontendSuccess) {
      log.success('@stripe/stripe-js installé avec succès dans le frontend');
    } else {
      log.error('Échec de l\'installation de @stripe/stripe-js dans le frontend');
      process.exit(1);
    }
  }

  // Vérification finale
  log.title('Vérification finale');
  
  const stripeInstalled = checkDependency(backendPath, 'stripe');
  const stripeJsInstalled = checkDependency(frontendPath, '@stripe/stripe-js');

  if (stripeInstalled && stripeJsInstalled) {
    log.success('Toutes les dépendances Stripe sont installées !');
    
    console.log('\nProchaines étapes:');
    console.log('1. Exécutez: node setup-stripe.js pour configurer les variables d\'environnement');
    console.log('2. Configurez votre compte Stripe et obtenez vos clés API');
    console.log('3. Redémarrez vos serveurs de développement');
    console.log('4. Testez l\'intégration premium');
    
  } else {
    log.error('Certaines dépendances n\'ont pas pu être installées');
    process.exit(1);
  }
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  log.error(`Erreur non gérée: ${error.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  log.info('\nInstallation annulée par l\'utilisateur');
  process.exit(0);
});

// Lancer le script
main().catch((error) => {
  log.error(`Erreur: ${error.message}`);
  process.exit(1);
});