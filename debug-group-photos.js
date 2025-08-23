#!/usr/bin/env node

/**
 * Script de debug pour les photos de profil des groupes
 * Usage: node debug-group-photos.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function debugGroupPhotos() {
  try {
    console.log('🔍 Debug des photos de profil des groupes\n');

    // 1. Connecter à MongoDB
    console.log('1. Connexion à MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurinapse';
    await mongoose.connect(mongoUri);
    console.log('   ✅ Connecté à MongoDB');

    // 2. Charger le modèle Group
    const Group = require('./backend/models/group.model.js');
    
    // 3. Récupérer tous les groupes
    console.log('\n2. Récupération des groupes...');
    const groups = await Group.find({}).select('_id name description profilePicture adminId createdAt').limit(10);
    console.log(`   ✅ ${groups.length} groupes trouvés`);

    // 4. Analyser chaque groupe
    console.log('\n3. Analyse des groupes...');
    groups.forEach((group, index) => {
      console.log(`\n   📁 Groupe ${index + 1}: ${group.name}`);
      console.log(`      ID: ${group._id}`);
      console.log(`      Admin: ${group.adminId}`);
      console.log(`      Créé: ${group.createdAt}`);
      
      if (group.profilePicture) {
        console.log(`      ✅ A une photo de profil`);
        console.log(`      📏 Taille: ${group.profilePicture.length} caractères`);
        
        // Vérifier le format
        if (group.profilePicture.startsWith('data:image/')) {
          const mimeMatch = group.profilePicture.match(/^data:(image\/[^;]+);base64,/);
          if (mimeMatch) {
            console.log(`      🖼️ Format: ${mimeMatch[1]}`);
            console.log(`      📷 Type: Data URL Base64`);
            
            // Extraire les 50 premiers caractères de la partie base64
            const base64Part = group.profilePicture.split(',')[1];
            if (base64Part) {
              console.log(`      🔤 Base64 preview: ${base64Part.substring(0, 50)}...`);
            }
          } else {
            console.log(`      ❌ Format Data URL invalide`);
          }
        } else if (group.profilePicture.startsWith('http')) {
          console.log(`      🔗 Type: URL externe`);
          console.log(`      🌐 URL: ${group.profilePicture}`);
        } else {
          console.log(`      ❓ Type: Inconnu`);
          console.log(`      📝 Début: ${group.profilePicture.substring(0, 100)}...`);
        }
      } else {
        console.log(`      ❌ Pas de photo de profil`);
      }
    });

    // 5. Test d'API pour un groupe spécifique
    console.log('\n4. Test de récupération via API...');
    if (groups.length > 0) {
      const testGroup = groups.find(g => g.profilePicture) || groups[0];
      console.log(`   🎯 Test avec le groupe: ${testGroup.name} (${testGroup._id})`);
      
      // Simuler la fonction getGroupPicture
      try {
        const groupForApi = await Group.findById(testGroup._id).select('profilePicture');
        if (groupForApi && groupForApi.profilePicture) {
          console.log(`   ✅ Récupération API réussie`);
          console.log(`   📏 Taille via API: ${groupForApi.profilePicture.length} caractères`);
          
          const profilePicture = groupForApi.profilePicture;
          if (typeof profilePicture === 'string' && profilePicture.startsWith('data:')) {
            const match = profilePicture.match(/^data:(image\/[^;]+);base64,(.+)$/);
            if (match) {
              console.log(`   ✅ Format Data URL valide pour l'API`);
              console.log(`   🎨 MIME: ${match[1]}`);
            } else {
              console.log(`   ❌ Format Data URL invalide pour l'API`);
            }
          }
        } else {
          console.log(`   ❌ Pas de photo pour ce groupe via API`);
        }
      } catch (error) {
        console.log(`   ❌ Erreur récupération API: ${error.message}`);
      }
    }

    // 6. Statistiques générales
    console.log('\n5. Statistiques générales...');
    const groupsWithPictures = groups.filter(g => g.profilePicture);
    const groupsWithoutPictures = groups.filter(g => !g.profilePicture);
    
    console.log(`   📊 Groupes avec photo: ${groupsWithPictures.length}`);
    console.log(`   📊 Groupes sans photo: ${groupsWithoutPictures.length}`);
    
    if (groupsWithPictures.length > 0) {
      const avgSize = groupsWithPictures.reduce((sum, g) => sum + g.profilePicture.length, 0) / groupsWithPictures.length;
      console.log(`   📊 Taille moyenne des photos: ${Math.round(avgSize)} caractères`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  } finally {
    // 7. Fermer la connexion
    await mongoose.connection.close();
    console.log('\n✅ Debug terminé, connexion fermée');
  }
}

// Exécuter le debug
debugGroupPhotos();
