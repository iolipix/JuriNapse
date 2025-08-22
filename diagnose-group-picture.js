#!/usr/bin/env node

/**
 * Script de diagnostic pour l'upload de photo de groupe
 * Usage: node diagnose-group-picture.js
 */

console.log('🔍 Diagnostic de l\'upload de photo de groupe\n');

// 1. Vérifier l'API backend
console.log('1. Vérification de l\'API backend...');
try {
  const groupController = require('./backend/controllers/group.controller.js');
  console.log('   ✅ Contrôleur de groupe trouvé');
  
  if (typeof groupController.updateGroupPicture === 'function') {
    console.log('   ✅ Fonction updateGroupPicture existe');
  } else {
    console.log('   ❌ Fonction updateGroupPicture manquante');
  }
} catch (error) {
  console.log('   ❌ Erreur contrôleur:', error.message);
}

// 2. Vérifier la route backend
console.log('\n2. Vérification de la route backend...');
try {
  const routes = require('./backend/routes/group.routes.js');
  console.log('   ✅ Routes de groupe trouvées');
} catch (error) {
  console.log('   ❌ Erreur routes:', error.message);
}

// 3. Vérifier l'ImageOptimizer
console.log('\n3. Vérification de l\'ImageOptimizer...');
try {
  const ImageOptimizer = require('./backend/utils/imageOptimizer.js');
  console.log('   ✅ ImageOptimizer trouvé');
  
  if (typeof ImageOptimizer.optimizeBase64Image === 'function') {
    console.log('   ✅ Fonction optimizeBase64Image existe');
  } else {
    console.log('   ❌ Fonction optimizeBase64Image manquante');
  }
} catch (error) {
  console.log('   ❌ Erreur ImageOptimizer:', error.message);
}

// 4. Vérifier le modèle Group
console.log('\n4. Vérification du modèle Group...');
try {
  const Group = require('./backend/models/group.model.js');
  console.log('   ✅ Modèle Group trouvé');
  
  // Créer une instance temporaire pour vérifier les champs
  const testGroup = new Group({
    name: 'Test',
    description: 'Test',
    adminId: '507f1f77bcf86cd799439011'
  });
  
  if ('profilePicture' in testGroup.toObject()) {
    console.log('   ✅ Champ profilePicture existe dans le modèle');
  } else {
    console.log('   ❌ Champ profilePicture manquant dans le modèle');
  }
  
} catch (error) {
  console.log('   ❌ Erreur modèle Group:', error.message);
}

// 5. Vérifier l'API frontend
console.log('\n5. Vérification de l\'API frontend...');
try {
  const fs = require('fs');
  const apiContent = fs.readFileSync('./frontend/src/services/api.ts', 'utf8');
  
  if (apiContent.includes('updateGroupPicture')) {
    console.log('   ✅ Fonction updateGroupPicture trouvée dans api.ts');
  } else {
    console.log('   ❌ Fonction updateGroupPicture manquante dans api.ts');
  }
  
  if (apiContent.includes('groupsAPI')) {
    console.log('   ✅ Export groupsAPI trouvé');
  } else {
    console.log('   ❌ Export groupsAPI manquant');
  }
  
} catch (error) {
  console.log('   ❌ Erreur lecture API frontend:', error.message);
}

// 6. Vérifier le contexte de messagerie
console.log('\n6. Vérification du contexte de messagerie...');
try {
  const fs = require('fs');
  const contextContent = fs.readFileSync('./frontend/src/contexts/MessagingContext.tsx', 'utf8');
  
  if (contextContent.includes('updateGroupPicture: async (groupId: string, pictureData:')) {
    console.log('   ✅ Signature updateGroupPicture trouvée dans le contexte');
  } else {
    console.log('   ❌ Signature updateGroupPicture incorrecte dans le contexte');
  }
  
  if (contextContent.includes('groupsAPI.updateGroupPicture')) {
    console.log('   ✅ Appel API trouvé dans le contexte');
  } else {
    console.log('   ❌ Appel API manquant dans le contexte');
  }
  
} catch (error) {
  console.log('   ❌ Erreur lecture contexte:', error.message);
}

console.log('\n📋 Résumé du diagnostic:');
console.log('   - Vérifiez que le serveur backend démarre sans erreur');
console.log('   - Testez l\'upload via l\'interface utilisateur');
console.log('   - Regardez les logs de la console du navigateur');
console.log('   - Vérifiez les requêtes réseau dans les outils de développement');

console.log('\n🚀 Diagnostic terminé !');
