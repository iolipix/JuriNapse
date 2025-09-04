// Script d'urgence pour diagnostiquer et réparer les routes subscription
console.log('🚨 DIAGNOSTIC ROUTES SUBSCRIPTION');

// Test 1: Vérifier si les modules se chargent
console.log('\n=== TEST 1: CHARGEMENT DES MODULES ===');

try {
  const subscriptionController = require('./backend/controllers/subscription.controller');
  console.log('✅ Controller subscription chargé');
  console.log('   Fonctions:', Object.keys(subscriptionController));
} catch (error) {
  console.error('❌ Erreur controller subscription:', error.message);
}

try {
  const subscriptionRoutes = require('./backend/routes/subscription.routes');
  console.log('✅ Routes subscription chargées');
} catch (error) {
  console.error('❌ Erreur routes subscription:', error.message);
}

try {
  const { authenticateToken } = require('./backend/middleware/auth.middleware');
  console.log('✅ Middleware auth chargé');
} catch (error) {
  console.error('❌ Erreur middleware auth:', error.message);
}

// Test 2: Vérifier la structure du serveur
console.log('\n=== TEST 2: STRUCTURE SERVEUR ===');

try {
  const express = require('express');
  const app = express();
  
  // Simuler le chargement des routes comme dans server.js
  const subscriptionRoutes = require('./backend/routes/subscription.routes');
  app.use('/api/subscriptions', subscriptionRoutes);
  
  console.log('✅ Routes subscription peuvent être montées');
} catch (error) {
  console.error('❌ Erreur montage routes:', error.message);
}

console.log('\n=== INSTRUCTIONS ===');
console.log('1. Si des erreurs apparaissent ci-dessus, c\'est un problème de code');
console.log('2. Sinon, le problème vient du déploiement Railway');
console.log('3. Vérifiez les logs Railway pour les erreurs de démarrage');
