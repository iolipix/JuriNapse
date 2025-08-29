const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC RAILWAY - Vérification de la structure des fichiers');
console.log('='.repeat(60));

// Vérifier le répertoire courant
console.log('📂 Répertoire de travail:', process.cwd());
console.log('📂 __dirname:', __dirname);

// Vérifier les dossiers importants
const importantPaths = [
  './services',
  './controllers', 
  './models',
  './routes',
  './services/email.service.js',
  '../services/email.service.js',
  './services/token.service.js'
];

importantPaths.forEach(checkPath => {
  const fullPath = path.resolve(checkPath);
  const exists = fs.existsSync(fullPath);
  
  console.log(`${exists ? '✅' : '❌'} ${checkPath} -> ${fullPath}`);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    console.log(`   ${stats.isDirectory() ? '📁' : '📄'} ${stats.isDirectory() ? 'Dossier' : 'Fichier'}`);
    
    if (stats.isDirectory()) {
      try {
        const files = fs.readdirSync(fullPath);
        console.log(`   📋 Contenu (${files.length} éléments):`, files.slice(0, 5).join(', '));
      } catch (error) {
        console.log(`   ⚠️ Erreur lecture dossier:`, error.message);
      }
    }
  }
});

// Test des imports critiques
console.log('\n🧪 TEST DES IMPORTS CRITIQUES');
console.log('-'.repeat(40));

const testImports = [
  '../models/user.model',
  '../services/token.service', 
  './services/email.service',
  '../services/email.service'
];

testImports.forEach(importPath => {
  try {
    const resolved = require.resolve(importPath);
    console.log(`✅ ${importPath} -> ${resolved}`);
  } catch (error) {
    console.log(`❌ ${importPath} -> ${error.code}: ${error.message}`);
  }
});

// Vérifier les variables d'environnement critiques
console.log('\n🔧 VARIABLES D\'ENVIRONNEMENT');
console.log('-'.repeat(40));

const criticalEnvs = [
  'NODE_ENV',
  'MONGODB_URI', 
  'JWT_SECRET',
  'RESEND_API_KEY'
];

criticalEnvs.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar} = ${envVar === 'RESEND_API_KEY' || envVar === 'JWT_SECRET' || envVar === 'MONGODB_URI' ? '[MASQUÉ]' : value}`);
  } else {
    console.log(`❌ ${envVar} = NON DÉFINIE`);
  }
});

console.log('\n📊 DIAGNOSTIC TERMINÉ');
console.log('='.repeat(60));
