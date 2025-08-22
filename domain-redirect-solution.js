// 🔄 SOLUTION: REDIRECTION AUTOMATIQUE VERS DOMAINE PRINCIPAL
// Ajouter ce script dans le frontend pour forcer l'utilisation d'un seul domaine

// Domaine principal choisi
const MAIN_DOMAIN = 'https://www.jurinapse.com';

// Vérifier si on est sur le bon domaine
const currentDomain = window.location.origin;

if (currentDomain !== MAIN_DOMAIN) {
  console.log('🔄 Redirection vers le domaine principal...');
  
  // Construire l'URL de redirection avec le même path
  const redirectUrl = MAIN_DOMAIN + window.location.pathname + window.location.search + window.location.hash;
  
  // Redirection immédiate
  window.location.replace(redirectUrl);
}

// Alternative: Afficher un message à l'utilisateur
/*
if (currentDomain !== MAIN_DOMAIN) {
  const banner = document.createElement('div');
  banner.innerHTML = `
    <div style="background: #ff6b6b; color: white; padding: 10px; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 9999;">
      🔄 Pour une meilleure expérience, utilisez <a href="${MAIN_DOMAIN}" style="color: white; text-decoration: underline;">jurinapse.com</a>
    </div>
  `;
  document.body.appendChild(banner);
}
*/
