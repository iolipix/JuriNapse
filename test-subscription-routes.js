const express = require('express');
const mongoose = require('mongoose');

/**
 * Test simple des routes de subscription
 * Permet de vérifier si le problème vient du routage ou des données
 */

const testSubscriptionRoutes = async () => {
  try {
    console.log('🧪 Test des routes de subscription...');
    
    // Simuler la structure des routes
    console.log('\n=== ROUTES ATTENDUES ===');
    const expectedRoutes = [
      'GET /api/subscriptions',
      'POST /api/subscriptions/follow/:userId',
      'DELETE /api/subscriptions/unfollow/:userId',
      'GET /api/subscriptions/followers',
      'GET /api/subscriptions/following',
      'GET /api/subscriptions/is-following/:userId',
      'GET /api/subscriptions/user/:userId/followers',
      'GET /api/subscriptions/user/:userId/following',
      'GET /api/subscriptions/blocked',
      'POST /api/subscriptions/block/:userId',
      'DELETE /api/subscriptions/unblock/:userId',
      'GET /api/subscriptions/is-blocked/:userId'
    ];
    
    expectedRoutes.forEach(route => console.log(`✓ ${route}`));
    
    // Vérifier les fichiers du système
    console.log('\n=== VÉRIFICATION DES FICHIERS ===');
    const fs = require('fs');
    const path = require('path');
    
    const filesToCheck = [
      './backend/routes/subscription.routes.js',
      './backend/controllers/subscription.controller.js',
      './backend/server.js'
    ];
    
    for (const file of filesToCheck) {
      if (fs.existsSync(path.resolve(file))) {
        const stats = fs.statSync(path.resolve(file));
        console.log(`✅ ${file} - Modifié le: ${stats.mtime.toLocaleString()}`);
      } else {
        console.log(`❌ ${file} - FICHIER MANQUANT !`);
      }
    }
    
    console.log('\n=== INSTRUCTIONS DE DÉBOGAGE ===');
    console.log('1. Commitez et pushez ce script sur Railway');
    console.log('2. Exécutez-le via Railway CLI: railway run node fix-theophane-subscriptions.js');
    console.log('3. Vérifiez les logs Railway pour voir les erreurs serveur');
    console.log('4. Testez manuellement une route: GET https://votre-app.railway.app/api/subscriptions');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

testSubscriptionRoutes();

module.exports = { testSubscriptionRoutes };
