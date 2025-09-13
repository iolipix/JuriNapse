// Script pour nettoyer les slugs existants avec des tirets en fin
const cleanupSlugs = async () => {
  console.log('🧹 Script de nettoyage des slugs avec tirets en fin');
  console.log('');
  
  const fixSlug = (slug) => {
    if (!slug) return slug;
    return slug
      .replace(/^-+|-+$/g, '') // Supprimer tirets début et fin
      .trim();
  };
  
  // Test de la fonction
  const testSlugs = [
    'la-methodologie-claire-du-cas-pratique-',
    'test-slug-',
    '-test-slug',
    '-test-slug-',
    'slug-normal',
    ''
  ];
  
  console.log('🧪 Test de nettoyage:');
  testSlugs.forEach(slug => {
    const cleaned = fixSlug(slug);
    console.log(`"${slug}" → "${cleaned}"`);
  });
  
  console.log('');
  console.log('📋 Ce script devrait être exécuté côté backend pour:');
  console.log('1. Récupérer tous les posts avec des slugs se terminant par "-"');
  console.log('2. Nettoyer ces slugs');
  console.log('3. Sauvegarder les posts avec les nouveaux slugs');
  console.log('');
  console.log('💡 Avec les modifications faites, les URLs devraient maintenant fonctionner !');
};

cleanupSlugs();
