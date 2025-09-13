// Script pour corriger le problème de routage des posts
// Le problème est probablement dans la fonction generateSlug qui laisse des tirets à la fin

// Améliorer la fonction generateSlug
const improveSlugGeneration = () => {
  console.log('🔧 Amélioration de la génération de slugs...');
  
  const oldSlugFunction = `const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};`;

  const newSlugFunction = `const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') // Supprimer tirets début et fin
    .trim();
};`;

  console.log('❌ Ancienne fonction:');
  console.log(oldSlugFunction);
  console.log('\n✅ Nouvelle fonction:');
  console.log(newSlugFunction);
  
  console.log('\n🧪 Test avec "La méthodologie claire du cas pratique ":');
  
  const testTitle = "La méthodologie claire du cas pratique ";
  
  // Test ancienne version
  const oldSlug = testTitle
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
    
  // Test nouvelle version
  const newSlug = testTitle
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
    
  console.log(`Ancienne: "${oldSlug}"`);
  console.log(`Nouvelle: "${newSlug}"`);
  
  return { oldSlugFunction, newSlugFunction };
};

improveSlugGeneration();
