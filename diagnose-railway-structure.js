const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnostic de la structure Railway...\n');

// Vérifier où on se trouve
console.log('📍 Répertoire courant:', process.cwd());
console.log('📍 __dirname:', __dirname);

// Lister le contenu du répertoire racine
console.log('\n📂 Contenu du répertoire racine:');
try {
  const rootFiles = fs.readdirSync('.');
  rootFiles.forEach(file => {
    const stats = fs.statSync(file);
    console.log(`  ${stats.isDirectory() ? '📁' : '📄'} ${file}`);
  });
} catch (error) {
  console.log('❌ Erreur lecture racine:', error.message);
}

// Vérifier si le dossier services existe
console.log('\n📂 Vérification dossier services:');
try {
  if (fs.existsSync('./services')) {
    console.log('✅ Dossier ./services existe');
    const serviceFiles = fs.readdirSync('./services');
    console.log('  Contenu:');
    serviceFiles.forEach(file => {
      console.log(`    📄 ${file}`);
    });
  } else {
    console.log('❌ Dossier ./services n\'existe PAS');
  }
} catch (error) {
  console.log('❌ Erreur services:', error.message);
}

// Vérifier si le dossier controllers existe
console.log('\n📂 Vérification dossier controllers:');
try {
  if (fs.existsSync('./controllers')) {
    console.log('✅ Dossier ./controllers existe');
    const controllerFiles = fs.readdirSync('./controllers');
    console.log('  Contenu:');
    controllerFiles.forEach(file => {
      console.log(`    📄 ${file}`);
    });
  } else {
    console.log('❌ Dossier ./controllers n\'existe PAS');
  }
} catch (error) {
  console.log('❌ Erreur controllers:', error.message);
}

// Test d'import depuis controllers
console.log('\n🔗 Test d\'import depuis controllers:');
try {
  // Simuler le chemin depuis controllers/auth.controller.js
  const emailServicePath = path.resolve('./services/email.service.js');
  console.log('📍 Chemin absolu email service:', emailServicePath);
  console.log('✅ Le fichier email.service.js existe:', fs.existsSync(emailServicePath));
  
  if (fs.existsSync(emailServicePath)) {
    console.log('📊 Taille du fichier:', fs.statSync(emailServicePath).size, 'octets');
  }
} catch (error) {
  console.log('❌ Erreur test import:', error.message);
}

// Test d'import du contrôleur
console.log('\n🎮 Test d\'import du contrôleur:');
try {
  const controllerPath = path.resolve('./controllers/auth.controller.js');
  console.log('📍 Chemin absolu auth controller:', controllerPath);
  console.log('✅ Le fichier auth.controller.js existe:', fs.existsSync(controllerPath));
  
  if (fs.existsSync(controllerPath)) {
    console.log('📊 Taille du fichier:', fs.statSync(controllerPath).size, 'octets');
  }
} catch (error) {
  console.log('❌ Erreur test contrôleur:', error.message);
}
