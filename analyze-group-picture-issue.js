#!/usr/bin/env node

/**
 * Script d'analyse des problèmes de photos de profil des groupes
 * Usage: node analyze-group-picture-issue.js
 */

console.log('🔍 Analyse des problèmes de photos de profil des groupes\n');

const fs = require('fs');
const path = require('path');

// Fonction pour analyser un fichier
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    return null;
  }
}

// Fonction pour chercher des patterns dans un fichier
function findPatterns(content, patterns) {
  const results = {};
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern.regex, 'g');
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        match: match[0],
        line: content.substring(0, match.index).split('\n').length,
        context: content.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50)
      });
    }
    results[pattern.name] = matches;
  });
  return results;
}

console.log('1. Analyse du contexte de messagerie...');

// Analyser MessagingContext.tsx
const contextPath = './frontend/src/contexts/MessagingContext.tsx';
const contextContent = analyzeFile(contextPath);

if (contextContent) {
  const contextPatterns = [
    { name: 'loadGroups_profilePicture', regex: 'profilePicture:\\s*group\\.profilePicture' },
    { name: 'updateGroupPicture_function', regex: 'const updateGroupPicture = async' },
    { name: 'groupPhotoUpdated_event', regex: 'groupPhotoUpdated' },
    { name: 'setGroups_call', regex: 'setGroups\\(' }
  ];
  
  const contextResults = findPatterns(contextContent, contextPatterns);
  
  Object.entries(contextResults).forEach(([patternName, matches]) => {
    console.log(`   ${matches.length > 0 ? '✅' : '❌'} ${patternName}: ${matches.length} occurrence(s)`);
    matches.forEach(match => {
      console.log(`      Ligne ${match.line}: ${match.match}`);
    });
  });
} else {
  console.log('   ❌ Impossible de lire MessagingContext.tsx');
}

console.log('\n2. Analyse de MessagingPage.tsx...');

// Analyser MessagingPage.tsx
const pagePath = './frontend/src/components/Messaging/MessagingPage.tsx';
const pageContent = analyzeFile(pagePath);

if (pageContent) {
  const pagePatterns = [
    { name: 'getChatProfilePicture_function', regex: 'const getChatProfilePicture = \\(chat: any\\)' },
    { name: 'getChatProfilePicture_calls', regex: 'getChatProfilePicture\\(' },
    { name: 'imageRefreshKey_usage', regex: 'imageRefreshKey\\[.*?\\]' },
    { name: 'groupPhotoUpdated_listener', regex: 'groupPhotoUpdated.*handler' },
    { name: 'profilePicture_img_tags', regex: '<img[^>]*src=\\{getChatProfilePicture' }
  ];
  
  const pageResults = findPatterns(pageContent, pagePatterns);
  
  Object.entries(pageResults).forEach(([patternName, matches]) => {
    console.log(`   ${matches.length > 0 ? '✅' : '❌'} ${patternName}: ${matches.length} occurrence(s)`);
  });
} else {
  console.log('   ❌ Impossible de lire MessagingPage.tsx');
}

console.log('\n3. Analyse de ChatItem.tsx...');

// Analyser ChatItem.tsx
const chatItemPath = './frontend/src/components/Messaging/ChatItem.tsx';
const chatItemContent = analyzeFile(chatItemPath);

if (chatItemContent) {
  const chatItemPatterns = [
    { name: 'getChatProfilePicture_function', regex: 'const getChatProfilePicture = \\(\\)' },
    { name: 'SimpleAnimatedGroupAvatar_usage', regex: '<SimpleAnimatedGroupAvatar[^>]*src=\\{' },
    { name: 'chat_profilePicture_usage', regex: 'chat\\.profilePicture' }
  ];
  
  const chatItemResults = findPatterns(chatItemContent, chatItemPatterns);
  
  Object.entries(chatItemResults).forEach(([patternName, matches]) => {
    console.log(`   ${matches.length > 0 ? '✅' : '❌'} ${patternName}: ${matches.length} occurrence(s)`);
  });
} else {
  console.log('   ❌ Impossible de lire ChatItem.tsx');
}

console.log('\n4. Analyse de l\'API frontend...');

// Analyser api.ts
const apiPath = './frontend/src/services/api.ts';
const apiContent = analyzeFile(apiPath);

if (apiContent) {
  const apiPatterns = [
    { name: 'getAllGroups_function', regex: 'getAllGroups:\\s*async' },
    { name: 'updateGroupPicture_function', regex: 'updateGroupPicture:\\s*async' },
    { name: 'fixUrlsInResponse_function', regex: 'const fixUrlsInResponse = \\(data: any\\)' },
    { name: 'profilePicture_fix', regex: 'fixed\\.profilePicture.*fixApiUrl' }
  ];
  
  const apiResults = findPatterns(apiContent, apiPatterns);
  
  Object.entries(apiResults).forEach(([patternName, matches]) => {
    console.log(`   ${matches.length > 0 ? '✅' : '❌'} ${patternName}: ${matches.length} occurrence(s)`);
  });
} else {
  console.log('   ❌ Impossible de lire api.ts');
}

console.log('\n5. Recommandations pour déboguer...');

console.log(`
📋 Points à vérifier dans les outils de développement du navigateur :

1. Console du navigateur :
   - Chercher les messages "🚀 updateGroupPicture APPELÉE !"
   - Chercher les messages "📸 Événement groupPhotoUpdated reçu"
   - Vérifier s'il y a des erreurs 404 ou 500 pour les images

2. Onglet Network :
   - Vérifier les requêtes vers /api/groups
   - Voir si les photos sont incluses dans la réponse
   - Tester les requêtes vers /api/groups/:id/picture

3. Onglet Elements :
   - Inspecter les balises <img> des photos de groupe
   - Vérifier les URLs src (data:image vs URLs externes)
   - Voir si les images ont des attributs key pour le cache-busting

4. Tests manuels :
   - Essayer d'uploader une nouvelle photo de groupe
   - Vérifier si le modal de groupe affiche la photo
   - Tester sur différents groupes

5. Données backend :
   - Vérifier que les groupes ont bien des profilePicture dans MongoDB
   - Tester l'endpoint GET /api/groups/:id/picture directement
`);

console.log('\n✅ Analyse terminée !');
