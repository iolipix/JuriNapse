// Script pour corriger les rôles de theophane_mry dans MongoDB
// Exécuter avec: node fix-theophane-roles.js

const { MongoClient } = require('mongodb');

async function fixTheophaneRoles() {
  // Remplacez par votre URL de connexion MongoDB
  const url = 'mongodb://localhost:27017'; // ou votre URL MongoDB
  const dbName = 'jurinapse'; // ou le nom de votre base de données
  
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db(dbName);
    const users = db.collection('users');
    
    // Trouver theophane_mry
    const user = await users.findOne({ username: 'theophane_mry' });
    
    if (!user) {
      console.log('❌ Utilisateur theophane_mry non trouvé');
      return;
    }
    
    console.log('👤 Utilisateur trouvé:', {
      username: user.username,
      currentRole: user.role,
      currentRoles: user.roles
    });
    
    // Corriger les rôles
    const updateResult = await users.updateOne(
      { username: 'theophane_mry' },
      {
        $set: {
          role: 'administrator',  // Rôle principal correct
          roles: ['user', 'administrator']  // Array de rôles correct
        }
      }
    );
    
    if (updateResult.modifiedCount > 0) {
      console.log('✅ Rôles corrigés avec succès !');
      
      // Vérifier le résultat
      const updatedUser = await users.findOne({ username: 'theophane_mry' });
      console.log('🎯 Nouveaux rôles:', {
        role: updatedUser.role,
        roles: updatedUser.roles
      });
    } else {
      console.log('❌ Aucune modification effectuée');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

fixTheophaneRoles();
