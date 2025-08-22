// Script pour vider les caches
console.log('🧹 Vidage forcé des caches...');

// Vider le localStorage
if (typeof window !== 'undefined') {
  window.localStorage.clear();
  console.log('✅ localStorage vidé');
}

// Instructions pour vider le cache navigateur
console.log(`
📋 Instructions pour résoudre l'erreur "Erreur lors du chargement des posts":

1. 🔄 VIDER LE CACHE DU NAVIGATEUR:
   - Chrome/Edge: Ctrl+Shift+Delete → Cocher "Images et fichiers en cache" → Supprimer
   - Firefox: Ctrl+Shift+Delete → Cocher "Cache" → Effacer maintenant
   
2. 🔄 HARD REFRESH:
   - Appuyer sur Ctrl+F5 ou Ctrl+Shift+R pour forcer le rechargement

3. 🔄 VIDER LE LOCALSTORAGE:
   - Ouvrir les outils de développement (F12)
   - Aller dans Application/Storage → Local Storage
   - Supprimer toutes les entrées pour juri-napse.vercel.app

4. 🔄 REDÉMARRER COMPLETEMENT:
   - Fermer complètement le navigateur
   - Le rouvrir et aller sur https://juri-napse.vercel.app

🎯 L'erreur devrait disparaître après ces étapes car:
   - Les messages orphelins ne peuvent plus se créer (correction déployée)
   - Le cache qui contenait les anciennes erreurs sera vidé
`);
