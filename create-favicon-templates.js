#!/usr/bin/env node
/**
 * 🖼️ CONVERTISSEUR SIMPLE SVG → PNG POUR JURINAPSE
 * 
 * Alternative si vous n'avez pas d'outils de conversion installés
 */

const fs = require('fs').promises;
const path = require('path');

console.log('🖼️ CONVERTISSEUR D\'IMAGES JURINAPSE');
console.log('=' .repeat(40));

async function createImageTemplates() {
  try {
    const frontendPublicPath = path.join(__dirname, 'frontend', 'public');
    
    // Pour chaque taille, créer un SVG optimisé qui sera plus facile à convertir
    const createOptimizedSVG = (size, content) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  ${content}
</svg>`;

    const createOptimizedOG = (width, height, content) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 630">
  ${content}
</svg>`;

    // Contenu simple pour favicon 16x16 et 32x32
    const smallFaviconContent = `
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af"/>
      <stop offset="100%" style="stop-color:#6366f1"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#bg)"/>
  <text x="32" y="42" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="white">J</text>`;

    // Contenu pour 180x180 (Apple touch icon)
    const appleTouchContent = `
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af"/>
      <stop offset="100%" style="stop-color:#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="12" fill="url(#bg)"/>
  <g transform="translate(32,20) scale(0.8)">
    <rect x="-1" y="0" width="2" height="30" fill="white"/>
    <g transform="translate(-12,8)">
      <ellipse cx="0" cy="0" rx="8" ry="2" fill="white" opacity="0.9"/>
      <line x1="-6" y1="0" x2="0" y2="-8" stroke="white" stroke-width="1"/>
    </g>
    <g transform="translate(12,8)">
      <ellipse cx="0" cy="0" rx="8" ry="2" fill="white" opacity="0.9"/>
      <line x1="6" y1="0" x2="0" y2="-8" stroke="white" stroke-width="1"/>
    </g>
    <line x1="-12" y1="-8" x2="12" y2="-8" stroke="white" stroke-width="1"/>
  </g>
  <text x="32" y="50" text-anchor="middle" font-family="Arial" font-size="8" fill="white" opacity="0.8">JuriNapse</text>`;

    // Créer les fichiers SVG optimisés
    await fs.writeFile(
      path.join(frontendPublicPath, 'favicon-16x16-template.svg'),
      createOptimizedSVG(16, smallFaviconContent)
    );

    await fs.writeFile(
      path.join(frontendPublicPath, 'favicon-32x32-template.svg'),
      createOptimizedSVG(32, smallFaviconContent)
    );

    await fs.writeFile(
      path.join(frontendPublicPath, 'favicon-180x180-template.svg'),
      createOptimizedSVG(180, appleTouchContent)
    );

    console.log('✅ Templates SVG créés avec succès!');
    console.log('\n📁 Fichiers créés:');
    console.log('   • favicon-16x16-template.svg');
    console.log('   • favicon-32x32-template.svg'); 
    console.log('   • favicon-180x180-template.svg');
    
    console.log('\n🔄 MÉTHODES DE CONVERSION:');
    console.log('\n1️⃣ MÉTHODE EN LIGNE (Plus simple):');
    console.log('   • Allez sur: https://convertio.co/svg-png/');
    console.log('   • Uploadez chaque template SVG');
    console.log('   • Téléchargez le PNG correspondant');
    console.log('   • Renommez: favicon-16x16.png, favicon-32x32.png, etc.');
    
    console.log('\n2️⃣ MÉTHODE NAVIGATEUR:');
    console.log('   • Ouvrez chaque fichier SVG dans Chrome/Firefox');
    console.log('   • Faites un clic droit → "Sauvegarder l\'image sous"');
    console.log('   • Choisissez format PNG');
    
    console.log('\n3️⃣ SI VOUS AVEZ PHOTOSHOP/GIMP:');
    console.log('   • Ouvrez les fichiers SVG');
    console.log('   • Exportez en PNG aux dimensions voulues');

    // Créer également un fichier HTML de test pour preview
    const htmlPreview = `
<!DOCTYPE html>
<html>
<head>
    <title>Preview Favicons JuriNapse</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #f5f5f5; }
        .preview { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; }
        .icon { display: inline-block; margin: 10px; text-align: center; }
        img { border: 1px solid #ddd; }
    </style>
</head>
<body>
    <h1>🏛️ Preview Favicons JuriNapse</h1>
    
    <div class="preview">
        <h2>Favicon Templates (à convertir)</h2>
        <div class="icon">
            <img src="favicon-16x16-template.svg" width="16" height="16"><br>
            <small>16x16</small>
        </div>
        <div class="icon">
            <img src="favicon-32x32-template.svg" width="32" height="32"><br>
            <small>32x32</small>
        </div>
        <div class="icon">
            <img src="favicon-180x180-template.svg" width="180" height="180"><br>
            <small>180x180 (Apple)</small>
        </div>
    </div>
    
    <div class="preview">
        <h2>Logo principal</h2>
        <div class="icon">
            <img src="jurinapse-logo.svg" width="200" height="200"><br>
            <small>Logo complet</small>
        </div>
    </div>
    
    <div class="preview">
        <h2>Open Graph Image</h2>
        <div class="icon">
            <img src="jurinapse-og-image.svg" width="300" height="157"><br>
            <small>1200x630 (Social Media)</small>
        </div>
    </div>
    
    <p><strong>Instructions:</strong> Convertissez chaque template SVG en PNG aux dimensions indiquées.</p>
</body>
</html>`;

    await fs.writeFile(path.join(frontendPublicPath, 'favicon-preview.html'), htmlPreview);
    
    console.log('   • favicon-preview.html (pour vérifier le rendu)');
    
    console.log('\n🎯 POUR TESTER:');
    console.log('   Ouvrez: frontend/public/favicon-preview.html');
    console.log('   Vérifiez que les icônes s\'affichent correctement');
    
    console.log('\n✅ Une fois les PNG créés, votre site affichera le logo JuriNapse au lieu de la planète!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

if (require.main === module) {
  createImageTemplates();
}

module.exports = { createImageTemplates };
