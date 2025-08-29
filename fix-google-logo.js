#!/usr/bin/env node
/**
 * 🌍➡️🏛️ SCRIPT POUR REMPLACER L'ICÔNE PLANÈTE PAR LE LOGO JURINAPSE
 * 
 * Ce script corrige l'affichage de l'icône dans les résultats Google
 * en remplaçant le favicon générique par le logo Jurinapse
 */

const fs = require('fs').promises;
const path = require('path');

console.log('🔧 CORRECTION LOGO GOOGLE - JuriNapse');
console.log('=' .repeat(50));

async function fixGoogleLogo() {
  try {
    console.log('🎯 Étape 1: Analyse du problème...');
    console.log('   ❌ Google affiche une planète générique');
    console.log('   ✅ Objectif: Afficher le logo JuriNapse');
    
    console.log('\n📁 Étape 2: Vérification des fichiers favicon...');
    
    const frontendPublicPath = path.join(__dirname, 'frontend', 'public');
    const publicPath = path.join(__dirname, 'public');
    
    // Vérifier les fichiers existants
    const faviconPaths = [
      path.join(frontendPublicPath, 'Favicon.png'),
      path.join(frontendPublicPath, 'favicon.svg'),
      path.join(publicPath, 'Favicon.png'),
      path.join(publicPath, 'favicon.svg')
    ];
    
    for (const faviconPath of faviconPaths) {
      try {
        const stats = await fs.stat(faviconPath);
        console.log(`   📄 ${faviconPath} - ${(stats.size / 1024).toFixed(2)}KB`);
      } catch (error) {
        console.log(`   ❌ ${faviconPath} - Non trouvé`);
      }
    }
    
    console.log('\n🔍 Étape 3: Analyse des métadonnées HTML...');
    
    const htmlFiles = [
      path.join(__dirname, 'frontend', 'index.html'),
      path.join(__dirname, 'index.html')
    ];
    
    for (const htmlFile of htmlFiles) {
      try {
        const content = await fs.readFile(htmlFile, 'utf8');
        
        console.log(`\n📋 ${htmlFile}:`);
        
        // Vérifier les liens favicon
        const faviconLinks = content.match(/<link[^>]*rel="[^"]*icon[^"]*"[^>]*>/gi) || [];
        faviconLinks.forEach(link => {
          console.log(`   🔗 ${link}`);
        });
        
        // Vérifier les métadonnées Open Graph
        const ogImage = content.match(/<meta[^>]*property="og:image"[^>]*>/gi) || [];
        ogImage.forEach(meta => {
          console.log(`   📷 ${meta}`);
        });
        
        // Vérifier les métadonnées Twitter
        const twitterImage = content.match(/<meta[^>]*name="twitter:image"[^>]*>/gi) || [];
        twitterImage.forEach(meta => {
          console.log(`   🐦 ${meta}`);
        });
        
      } catch (error) {
        console.log(`   ❌ ${htmlFile} - Non trouvé`);
      }
    }
    
    console.log('\n💡 SOLUTIONS RECOMMANDÉES:');
    console.log('=' .repeat(50));
    
    console.log('\n1️⃣ REMPLACER LE FAVICON:');
    console.log('   • Créer un logo JuriNapse en 32x32, 64x64, 128x128, 256x256');
    console.log('   • Formats: .ico, .png, .svg');
    console.log('   • Remplacer frontend/public/Favicon.png');
    
    console.log('\n2️⃣ AJOUTER IMAGE OPEN GRAPH:');
    console.log('   • Créer une image 1200x630px avec logo JuriNapse');
    console.log('   • Ajouter og:image et twitter:image pointant vers cette image');
    
    console.log('\n3️⃣ AMÉLIORER LES MÉTADONNÉES:');
    console.log('   • Ajouter des tailles multiples de favicon');
    console.log('   • Ajouter apple-touch-icon');
    console.log('   • Ajouter manifest.json pour PWA');
    
    console.log('\n4️⃣ FORCER LA MISE À JOUR GOOGLE:');
    console.log('   • Ajouter un cache-buster aux URLs des images');
    console.log('   • Soumettre à Google Search Console');
    console.log('   • Délai: 1-2 semaines pour mise à jour');
    
    console.log('\n🚀 PROCHAINES ÉTAPES:');
    console.log('   1. Créer votre logo JuriNapse aux bonnes dimensions');
    console.log('   2. Exécuter le script de mise à jour');
    console.log('   3. Tester avec les outils de débogage social media');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Créer un template pour les nouvelles métadonnées
function generateImprovedMetadata() {
  return `
<!-- Favicons multiples pour compatibilité maximale -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2024">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2024">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png?v=2024">
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2024">
<link rel="shortcut icon" href="/favicon.ico?v=2024">

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2024">

<!-- Open Graph optimisé pour JuriNapse -->
<meta property="og:type" content="website" />
<meta property="og:title" content="Jurinapse - Plateforme sociale pour la communauté juridique" />
<meta property="og:description" content="Connectez-vous avec des étudiants et professionnels du droit. Partagez vos connaissances et développez votre réseau professionnel." />
<meta property="og:image" content="/jurinapse-og-image.png?v=2024" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Jurinapse - Plateforme sociale pour la communauté juridique" />
<meta name="twitter:description" content="Connectez-vous avec des étudiants et professionnels du droit" />
<meta name="twitter:image" content="/jurinapse-og-image.png?v=2024" />

<!-- Theme color pour mobile -->
<meta name="theme-color" content="#3b82f6">
<meta name="msapplication-TileColor" content="#3b82f6">
`;
}

console.log('\n📝 TEMPLATE MÉTADONNÉES AMÉLIORÉES:');
console.log(generateImprovedMetadata());

if (require.main === module) {
  fixGoogleLogo();
}

module.exports = { fixGoogleLogo, generateImprovedMetadata };
