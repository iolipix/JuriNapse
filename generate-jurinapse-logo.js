#!/usr/bin/env node
/**
 * 🏛️ GÉNÉRATEUR DE LOGO JURINAPSE
 * 
 * Crée un logo SVG personnalisé pour JuriNapse
 * et génère toutes les variantes de favicon nécessaires
 */

const fs = require('fs').promises;
const path = require('path');

// Logo SVG JuriNapse stylisé
const jurinapseLogo = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <!-- Dégradé de fond professionnel -->
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
    
    <!-- Dégradé pour le texte -->
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e0e7ff;stop-opacity:1" />
    </linearGradient>
    
    <!-- Ombre portée -->
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Fond rond avec dégradé -->
  <circle cx="128" cy="128" r="120" fill="url(#bgGrad)" stroke="#1e293b" stroke-width="2"/>
  
  <!-- Symbole justice stylisé (balance) -->
  <g transform="translate(128,80)">
    <!-- Base de la balance -->
    <rect x="-2" y="0" width="4" height="60" fill="url(#textGrad)" filter="url(#shadow)"/>
    
    <!-- Plateau gauche -->
    <g transform="translate(-25,15)">
      <ellipse cx="0" cy="0" rx="18" ry="4" fill="url(#textGrad)" opacity="0.9"/>
      <line x1="-15" y1="0" x2="0" y2="-15" stroke="url(#textGrad)" stroke-width="2"/>
    </g>
    
    <!-- Plateau droit -->
    <g transform="translate(25,15)">
      <ellipse cx="0" cy="0" rx="18" ry="4" fill="url(#textGrad)" opacity="0.9"/>
      <line x1="15" y1="0" x2="0" y2="-15" stroke="url(#textGrad)" stroke-width="2"/>
    </g>
    
    <!-- Barre horizontale -->
    <line x1="-25" y1="-15" x2="25" y2="-15" stroke="url(#textGrad)" stroke-width="3"/>
  </g>
  
  <!-- Texte "JuriNapse" -->
  <text x="128" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="url(#textGrad)" filter="url(#shadow)">
    JuriNapse
  </text>
  
  <!-- Sous-titre -->
  <text x="128" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="url(#textGrad)" opacity="0.8">
    Communauté Juridique
  </text>
</svg>`;

// Logo simplifié pour petites tailles
const jurinapseLogoSimple = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fond rond -->
  <circle cx="32" cy="32" r="30" fill="url(#bgGrad)"/>
  
  <!-- Lettre "J" stylisée -->
  <text x="32" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white">
    J
  </text>
</svg>`;

async function generateJurinapseFavicons() {
  console.log('🏛️ GÉNÉRATION DES FAVICONS JURINAPSE');
  console.log('=' .repeat(50));
  
  try {
    const frontendPublicPath = path.join(__dirname, 'frontend', 'public');
    const publicPath = path.join(__dirname, 'public');
    
    // Créer les dossiers s'ils n'existent pas
    await fs.mkdir(frontendPublicPath, { recursive: true });
    await fs.mkdir(publicPath, { recursive: true });
    
    console.log('📝 Étape 1: Création du logo SVG...');
    
    // Sauvegarder le logo principal
    const logoPath = path.join(frontendPublicPath, 'jurinapse-logo.svg');
    await fs.writeFile(logoPath, jurinapseLogo.trim());
    console.log(`   ✅ Logo principal: ${logoPath}`);
    
    // Sauvegarder le favicon SVG
    const faviconPath = path.join(frontendPublicPath, 'favicon.svg');
    await fs.writeFile(faviconPath, jurinapseLogoSimple.trim());
    console.log(`   ✅ Favicon SVG: ${faviconPath}`);
    
    // Copier dans le dossier public principal aussi
    await fs.copyFile(logoPath, path.join(publicPath, 'jurinapse-logo.svg'));
    await fs.copyFile(faviconPath, path.join(publicPath, 'favicon.svg'));
    
    console.log('\n🖼️ Étape 2: Instructions pour générer les PNG...');
    console.log('   ⚠️ Note: Pour convertir SVG → PNG, utilisez un outil comme:');
    console.log('   • Inkscape: inkscape favicon.svg -o favicon-32x32.png -w 32 -h 32');
    console.log('   • ImageMagick: convert favicon.svg -resize 32x32 favicon-32x32.png');
    console.log('   • Ou un service en ligne comme cloudconvert.com');
    
    console.log('\n📋 Étape 3: Tailles à générer:');
    const sizes = [16, 32, 96, 180, 192, 512];
    sizes.forEach(size => {
      console.log(`   • favicon-${size}x${size}.png`);
    });
    
    console.log('\n🎨 Étape 4: Image Open Graph (1200x630px)...');
    const ogImage = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
    
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="3" dy="3" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.4"/>
    </filter>
  </defs>
  
  <!-- Fond -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  
  <!-- Logo central -->
  <g transform="translate(350, 315)">
    <!-- Cercle de fond -->
    <circle cx="0" cy="0" r="80" fill="white" fill-opacity="0.1"/>
    
    <!-- Balance de justice -->
    <g transform="scale(1.5)">
      <!-- Base -->
      <rect x="-2" y="-30" width="4" height="60" fill="white" filter="url(#shadow)"/>
      
      <!-- Plateaux -->
      <g transform="translate(-20,0)">
        <ellipse cx="0" cy="0" rx="12" ry="3" fill="white" opacity="0.9"/>
        <line x1="-10" y1="0" x2="0" y2="-15" stroke="white" stroke-width="2"/>
      </g>
      
      <g transform="translate(20,0)">
        <ellipse cx="0" cy="0" rx="12" ry="3" fill="white" opacity="0.9"/>
        <line x1="10" y1="0" x2="0" y2="-15" stroke="white" stroke-width="2"/>
      </g>
      
      <line x1="-20" y1="-15" x2="20" y2="-15" stroke="white" stroke-width="2"/>
    </g>
  </g>
  
  <!-- Texte principal -->
  <text x="600" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" filter="url(#shadow)">
    JuriNapse
  </text>
  
  <!-- Sous-titre -->
  <text x="600" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="white" opacity="0.9">
    Plateforme sociale pour la communauté juridique
  </text>
  
  <!-- Ligne décorative -->
  <line x1="300" y1="350" x2="900" y2="350" stroke="white" stroke-width="2" opacity="0.6"/>
  
  <!-- Descriptif -->
  <text x="600" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="white" opacity="0.8">
    Connectez-vous • Partagez • Développez votre réseau juridique
  </text>
</svg>`;
    
    const ogImagePath = path.join(frontendPublicPath, 'jurinapse-og-image.svg');
    await fs.writeFile(ogImagePath, ogImage.trim());
    console.log(`   ✅ Image Open Graph SVG: ${ogImagePath}`);
    console.log('   ⚠️ À convertir en PNG 1200x630px pour usage final');
    
    // Copier dans le dossier principal
    await fs.copyFile(ogImagePath, path.join(publicPath, 'jurinapse-og-image.svg'));
    
    console.log('\n✅ GÉNÉRATION TERMINÉE !');
    console.log('\n🔄 PROCHAINES ÉTAPES:');
    console.log('1. Convertir les SVG en PNG aux bonnes tailles');
    console.log('2. Mettre à jour les fichiers HTML avec les nouvelles métadonnées');
    console.log('3. Déployer les changements');
    console.log('4. Tester avec Facebook Debugger et Twitter Card Validator');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

if (require.main === module) {
  generateJurinapseFavicons();
}

module.exports = { generateJurinapseFavicons };
