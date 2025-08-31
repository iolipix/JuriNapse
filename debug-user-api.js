const fetch = require('node-fetch');

async function debugUserSubscriptions() {
  try {
    console.log('🔍 Test des API subscriptions pour theophane_mry...\n');

    const baseUrl = 'http://localhost:5000/api';

    // D'abord, récupérer les infos de l'utilisateur
    console.log('1. 📊 Récupération des infos utilisateur...');
    const userResponse = await fetch(`${baseUrl}/users/username/theophane_mry`);
    const userData = await userResponse.json();
    
    console.log(`Status: ${userResponse.status}`);
    console.log(`Response:`, userData);
    
    if (!userData.success) {
      // L'API renvoie directement l'utilisateur, pas wrapped dans .success
      if (userData.username) {
        console.log('✅ Utilisateur trouvé (format direct)');
      } else {
        console.log('❌ Utilisateur non trouvé');
        return;
      }
    }

    const user = userData.success ? userData.user : userData;
    const userId = user.id || user._id;
    console.log(`✅ Utilisateur trouvé: ${user.username} (ID: ${userId})`);
    console.log(`   - followersCount: ${user.followersCount}`);
    console.log(`   - followingCount: ${user.followingCount}`);
    console.log(`   - followers array: [${user.followers.join(', ')}]`);
    console.log(`   - following array: [${user.following.join(', ')}]`);
    
    // Calculer les connexions directement
    const connections = user.following.filter(followingId => 
      user.followers.includes(followingId)
    );
    
    console.log(`\n🔗 Connexions calculées directement:`);
    console.log(`   - Connexions mutuelles: ${connections.length}`);
    console.log(`   - IDs des connexions: [${connections.join(', ')}]`);

    if (connections.length !== 2) {
      console.log(`\n⚠️ PROBLÈME: L'interface affiche 2 connexions mais le calcul donne ${connections.length}`);
    }

    // Récupérer les followers
    console.log('\n2. 👥 Récupération des followers...');
    const followersResponse = await fetch(`${baseUrl}/subscriptions/user/${userId}/followers`);
    const followersData = await followersResponse.json();
    
    console.log(`Réponse followers:`, followersData);
    
    if (followersData.success) {
      console.log(`✅ Followers (${followersData.data.length}):`);
      followersData.data.forEach(follower => {
        console.log(`   - ${follower.username} (${follower.firstName} ${follower.lastName})`);
      });
    }

    // Récupérer les following
    console.log('\n3. 👥 Récupération des following...');
    const followingResponse = await fetch(`${baseUrl}/subscriptions/user/${userId}/following`);
    const followingData = await followingResponse.json();
    
    console.log(`Réponse following:`, followingData);
    
    if (followingData.success) {
      console.log(`✅ Following (${followingData.data.length}):`);
      followingData.data.forEach(following => {
        console.log(`   - ${following.username} (${following.firstName} ${following.lastName})`);
      });

      // Calculer les connexions
      if (followersData.success && followingData.success) {
        console.log('\n4. 🔗 Calcul des connexions...');
        console.log(`Debug: followers data:`, followersData.data.map(f => ({ id: f._id, username: f.username })));
        console.log(`Debug: following data:`, followingData.data.map(f => ({ id: f._id, username: f.username })));
        
        const connections = followingData.data.filter(following => {
          const isInFollowers = followersData.data.some(follower => follower._id === following._id);
          console.log(`  - ${following.username} (${following._id}) is in followers: ${isInFollowers}`);
          return isInFollowers;
        });
        
        console.log(`✅ Connexions mutuelles (${connections.length}):`);
        connections.forEach(connection => {
          console.log(`   - ${connection.username} (${connection.firstName} ${connection.lastName})`);
        });
        
        console.log(`\n📈 Résumé:`);
        console.log(`   - Abonnés: ${followersData.data.length}`);
        console.log(`   - Abonnements: ${followingData.data.length}`);
        console.log(`   - Connexions: ${connections.length}`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

debugUserSubscriptions();
