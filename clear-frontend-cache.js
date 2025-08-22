// Script à exécuter DIRECTEMENT dans la console du navigateur (F12)
// Va sur https://juri-napse.vercel.app puis ouvre les outils de développement et colle ce code

console.log('🧹 NETTOYAGE COMPLET DU CACHE FRONTEND');
console.log('=====================================');

// 1. Vider le localStorage
try {
  const keysBeforeClearing = Object.keys(localStorage);
  console.log('📦 localStorage avant nettoyage:', keysBeforeClearing);
  
  localStorage.clear();
  console.log('✅ localStorage vidé');
} catch (e) {
  console.log('❌ Erreur localStorage:', e.message);
}

// 2. Vider le sessionStorage
try {
  const sessionKeysBeforeClearing = Object.keys(sessionStorage);
  console.log('📦 sessionStorage avant nettoyage:', sessionKeysBeforeClearing);
  
  sessionStorage.clear();
  console.log('✅ sessionStorage vidé');
} catch (e) {
  console.log('❌ Erreur sessionStorage:', e.message);
}

// 3. Vider les cookies du domaine
try {
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  console.log('✅ Cookies vidés');
} catch (e) {
  console.log('❌ Erreur cookies:', e.message);
}

// 4. Vider le cache d'IndexedDB si il existe
try {
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        console.log('🗄️ Suppression IndexedDB:', db.name);
        indexedDB.deleteDatabase(db.name);
      });
    });
    console.log('✅ IndexedDB vidé');
  }
} catch (e) {
  console.log('❌ Erreur IndexedDB:', e.message);
}

// 5. Forcer le rechargement complet
console.log('🔄 Rechargement forcé dans 2 secondes...');
setTimeout(() => {
  location.reload(true);
}, 2000);

console.log('');
console.log('🎯 ACTIONS EFFECTUÉES:');
console.log('✅ localStorage vidé');
console.log('✅ sessionStorage vidé'); 
console.log('✅ Cookies supprimés');
console.log('✅ IndexedDB vidé');
console.log('⏳ Rechargement forcé en cours...');
console.log('');
console.log('📝 Si l\'erreur persiste après le rechargement:');
console.log('1. Ferme complètement le navigateur');
console.log('2. Rouvre-le et va sur https://juri-napse.vercel.app');
console.log('3. Si ça ne marche toujours pas, le problème vient du backend');
