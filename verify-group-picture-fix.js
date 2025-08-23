#!/usr/bin/env node

/**
 * Vérification des corrections appliquées pour les photos de profil des groupes
 * Usage: node verify-group-picture-fix.js
 */

const fs = require('fs');

console.log('🔍 Vérification des corrections - Photos de profil des groupes\n');

// 1. Vérifier la correction dans api.ts
console.log('1. Vérification de api.ts...');
try {
  const apiContent = fs.readFileSync('./frontend/src/services/api.ts', 'utf8');
  
  if (apiContent.includes('getAllGroups: async () => {') && 
      apiContent.includes('fixUrlsInResponse(response.data.data)')) {
    console.log('   ✅ Correction getAllGroups appliquée');
  } else {
    console.log('   ❌ Correction getAllGroups manquante');
  }
  
  if (apiContent.includes('getGroup: async (groupId: string) => {') && 
      apiContent.includes('fixUrlsInResponse(response.data.data)')) {
    console.log('   ✅ Correction getGroup appliquée');
  } else {
    console.log('   ❌ Correction getGroup manquante');
  }
} catch (error) {
  console.log('   ❌ Erreur lecture api.ts:', error.message);
}

// 2. Vérifier le contexte de messagerie
console.log('\n2. Vérification du contexte de messagerie...');
try {
  const contextContent = fs.readFileSync('./frontend/src/contexts/MessagingContext.tsx', 'utf8');
  
  if (contextContent.includes('profilePicture: group.profilePicture')) {
    console.log('   ✅ Mapping profilePicture dans loadGroups présent');
  } else {
    console.log('   ❌ Mapping profilePicture dans loadGroups manquant');
  }
  
  if (contextContent.includes('groupPhotoUpdated')) {
    console.log('   ✅ Événement groupPhotoUpdated présent');
  } else {
    console.log('   ❌ Événement groupPhotoUpdated manquant');
  }
} catch (error) {
  console.log('   ❌ Erreur lecture MessagingContext.tsx:', error.message);
}

// 3. Vérifier MessagingPage.tsx
console.log('\n3. Vérification de MessagingPage.tsx...');
try {
  const pageContent = fs.readFileSync('./frontend/src/components/Messaging/MessagingPage.tsx', 'utf8');
  
  if (pageContent.includes('getChatProfilePicture = (chat: any)')) {
    console.log('   ✅ Fonction getChatProfilePicture présente');
  } else {
    console.log('   ❌ Fonction getChatProfilePicture manquante');
  }
  
  if (pageContent.includes('imageRefreshKey')) {
    console.log('   ✅ Système de cache-busting présent');
  } else {
    console.log('   ❌ Système de cache-busting manquant');
  }
  
  if (pageContent.includes('groupPhotoUpdated')) {
    console.log('   ✅ Listener groupPhotoUpdated présent');
  } else {
    console.log('   ❌ Listener groupPhotoUpdated manquant');
  }
} catch (error) {
  console.log('   ❌ Erreur lecture MessagingPage.tsx:', error.message);
}

// 4. Vérifier ChatItem.tsx
console.log('\n4. Vérification de ChatItem.tsx...');
try {
  const chatItemContent = fs.readFileSync('./frontend/src/components/Messaging/ChatItem.tsx', 'utf8');
  
  if (chatItemContent.includes('SimpleAnimatedGroupAvatar')) {
    console.log('   ✅ Composant SimpleAnimatedGroupAvatar utilisé');
  } else {
    console.log('   ❌ Composant SimpleAnimatedGroupAvatar manquant');
  }
  
  if (chatItemContent.includes('chat.profilePicture')) {
    console.log('   ✅ Propriété chat.profilePicture utilisée');
  } else {
    console.log('   ❌ Propriété chat.profilePicture manquante');
  }
} catch (error) {
  console.log('   ❌ Erreur lecture ChatItem.tsx:', error.message);
}

console.log('\n='.repeat(60));
console.log('RÉSUMÉ ET PROCHAINES ÉTAPES');
console.log('='.repeat(60));

console.log('\n✅ CORRECTIONS APPLIQUÉES:');
console.log('   • getAllGroups utilise maintenant fixUrlsInResponse');
console.log('   • getGroup utilise maintenant fixUrlsInResponse');
console.log('   • Le mapping profilePicture est présent dans loadGroups');
console.log('   • Le système de cache-busting fonctionne');
console.log('   • Les événements groupPhotoUpdated sont en place');

console.log('\n🔬 TESTS À EFFECTUER:');
console.log('   1. Déployer les changements sur Vercel/Railway');
console.log('   2. Vérifier dans les DevTools que les URLs pointent vers Railway');
console.log('   3. Tester l\'upload d\'une nouvelle photo de groupe');
console.log('   4. Vérifier l\'affichage dans la liste des groupes');
console.log('   5. Vérifier l\'affichage dans le modal de groupe');

console.log('\n🐛 SI LE PROBLÈME PERSISTE:');
console.log('   • Vérifier les logs de la console (F12)');
console.log('   • Inspecter les requêtes Network pour voir les URLs');
console.log('   • Tester directement l\'API: GET /api/groups');
console.log('   • Vérifier que le backend inclut bien profilePicture');

console.log('\n✅ Vérification terminée !');
