// 🔧 RÉPARER LES req.user._id EN req.user.id
const fs = require('fs');

const filePath = './backend/controllers/message.controller.js';
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer tous les req.user._id par req.user.id
const originalContent = content;
content = content.replace(/req\.user\._id/g, 'req.user.id');

// Compter les remplacements
const matches = originalContent.match(/req\.user\._id/g);
const count = matches ? matches.length : 0;

fs.writeFileSync(filePath, content);

console.log(`✅ Réparé ${count} occurrences de req.user._id → req.user.id`);
console.log('🔧 Le fichier message.controller.js a été corrigé !');
