const fs = require('fs');
const path = require('path');

async function fixAllPopulateInMessageController() {
    console.log('🔧 CORRECTION DE TOUS LES POPULATE DANS MESSAGE.CONTROLLER.JS');
    console.log('================================================================');
    
    const filePath = path.join(__dirname, 'backend/controllers/message.controller.js');
    
    try {
        // Lire le fichier
        let content = fs.readFileSync(filePath, 'utf8');
        let modifications = 0;
        
        console.log('📋 Fichier original lu, début des corrections...');
        
        // 1. Corriger les populate simples (style: populate('authorId', 'fields'))
        const simplePopulateRegex = /\.populate\('([^']+)',\s*'([^']+)'\)/g;
        content = content.replace(simplePopulateRegex, (match, path, select) => {
            modifications++;
            return `.populate({ path: '${path}', select: '${select}', options: { strictPopulate: false } })`;
        });
        
        console.log(`✅ ${modifications} populate simples corrigés`);
        
        // 2. Corriger les populate avec objets qui n'ont pas encore strictPopulate
        const objectPopulateRegex = /\.populate\(\{([^}]+)\}\)/g;
        let objectMatches = 0;
        content = content.replace(objectPopulateRegex, (match, inside) => {
            // Vérifier si strictPopulate est déjà présent
            if (inside.includes('strictPopulate')) {
                return match; // Déjà corrigé
            }
            objectMatches++;
            // Ajouter strictPopulate à la fin
            const corrected = inside.trim().endsWith(',') ? inside : inside + ',';
            return `.populate({${corrected} options: { strictPopulate: false } })`;
        });
        
        console.log(`✅ ${objectMatches} populate objets corrigés`);
        
        // 3. Corriger les populate imbriqués dans replyTo si pas encore fait
        content = content.replace(
            /populate:\s*\{\s*path:\s*'authorId',\s*select:\s*'[^']+'\s*\}/g, 
            (match) => {
                if (match.includes('strictPopulate')) return match;
                return match.replace('}', ', options: { strictPopulate: false } }');
            }
        );
        
        // Écrire le fichier corrigé
        fs.writeFileSync(filePath, content);
        
        console.log(`🎯 Total corrections: ${modifications + objectMatches}`);
        console.log('✅ Fichier message.controller.js mis à jour avec succès !');
        console.log('📝 Toutes les requêtes populate sont maintenant sécurisées');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error);
        return false;
    }
}

fixAllPopulateInMessageController();
