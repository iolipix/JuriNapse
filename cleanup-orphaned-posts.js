// Script pour nettoyer les posts sauvegardés orphelins
const axios = require('axios');

async function cleanupOrphanedSavedPosts() {
  try {
    console.log('🧹 Nettoyage des posts sauvegardés orphelins...');
    
    const response = await axios.post('https://jurinapse-production.up.railway.app/api/admin/cleanup-saved-posts', {}, {
      headers: {
        'Authorization': 'Bearer ADMIN_TOKEN' // À remplacer par un vrai token admin si nécessaire
      }
    });
    
    console.log('✅ Nettoyage terminé:', response.data);
  } catch (error) {
    console.log('❌ Pas d\'endpoint de nettoyage, c\'est normal');
    console.log('L\'erreur va probablement se résoudre d\'elle-même');
  }
}

cleanupOrphanedSavedPosts();
