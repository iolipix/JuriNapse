const axios = require('axios');

async function diagnosticComplet() {
  const baseURL = 'https://jurinapse-production.up.railway.app';
  
  console.log('🔍 DIAGNOSTIC COMPLET DE L\'API');
  console.log('================================\n');

  try {
    // 1. Test de l'API racine
    console.log('1️⃣ Test de l\'API racine...');
    const rootTest = await axios.get(`${baseURL}/`, { timeout: 10000 });
    console.log('   ✅ API backend accessible\n');

    // 2. Test de l'endpoint des posts (sans auth)
    console.log('2️⃣ Test de l\'endpoint des posts...');
    try {
      const postsTest = await axios.get(`${baseURL}/api/posts`, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('   ✅ Endpoint posts accessible');
      console.log(`   📊 Nombre de posts: ${postsTest.data?.posts?.length || 'N/A'}`);
    } catch (postsError) {
      if (postsError.response) {
        console.log(`   📊 Endpoint posts répond avec status: ${postsError.response.status}`);
        if (postsError.response.status === 500) {
          console.log('   🚨 ERREUR 500 SUR LES POSTS!');
          console.log('   📝 Détails:', JSON.stringify(postsError.response.data, null, 2));
        } else if (postsError.response.status === 401) {
          console.log('   ↳ Authentification requise (normal)');
        } else {
          console.log('   📝 Réponse:', postsError.response.data);
        }
      } else {
        console.log('   ❌ Pas de réponse:', postsError.message);
      }
    }
    console.log('');

    // 3. Test de l'endpoint des utilisateurs
    console.log('3️⃣ Test de l\'endpoint des utilisateurs...');
    try {
      const usersTest = await axios.get(`${baseURL}/api/users`, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('   ✅ Endpoint users accessible');
    } catch (usersError) {
      if (usersError.response) {
        console.log(`   📊 Endpoint users répond avec status: ${usersError.response.status}`);
        if (usersError.response.status === 500) {
          console.log('   🚨 ERREUR 500 SUR LES USERS!');
          console.log('   📝 Détails:', JSON.stringify(usersError.response.data, null, 2));
        }
      }
    }
    console.log('');

    // 4. Test de l'endpoint des groupes/messages
    console.log('4️⃣ Test de l\'endpoint des messages...');
    try {
      const messagesTest = await axios.get(`${baseURL}/api/messages/conversations`, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('   ✅ Endpoint conversations accessible');
    } catch (messagesError) {
      if (messagesError.response) {
        console.log(`   📊 Endpoint conversations répond avec status: ${messagesError.response.status}`);
        if (messagesError.response.status === 500) {
          console.log('   🚨 ERREUR 500 SUR LES CONVERSATIONS!');
          console.log('   📝 Détails:', JSON.stringify(messagesError.response.data, null, 2));
        } else if (messagesError.response.status === 401) {
          console.log('   ↳ Authentification requise (normal)');
        }
      }
    }
    console.log('');

    console.log('🎯 RÉSUMÉ:');
    console.log('- Si tous les endpoints répondent avec 401 (auth requise), c\'est normal');
    console.log('- Si un endpoint répond avec 500, c\'est là qu\'est le problème');
    console.log('- L\'erreur frontend vient probablement d\'un endpoint spécifique qui crash');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

diagnosticComplet();
