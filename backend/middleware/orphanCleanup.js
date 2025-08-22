const mongoose = require('mongoose');
const User = require('../models/user.model');

// ID de l'utilisateur "Introuvable"
const UTILISATEUR_INTROUVABLE_ID = new mongoose.Types.ObjectId('000000000000000000000001');

// Cache des utilisateurs vérifiés (pour éviter les requêtes répétées)
const utilisateursVerifies = new Set();
const utilisateursInexistants = new Set();

// Nettoyer le cache toutes les 5 minutes
setInterval(() => {
    utilisateursVerifies.clear();
    utilisateursInexistants.clear();
}, 5 * 60 * 1000);

async function verifierEtCorrigerUtilisateur(authorId) {
    try {
        // Si pas d'ID, retourner l'utilisateur introuvable
        if (!authorId) {
            return UTILISATEUR_INTROUVABLE_ID;
        }

        const authorIdStr = authorId.toString();
        
        // Si déjà vérifié comme existant
        if (utilisateursVerifies.has(authorIdStr)) {
            return authorId;
        }
        
        // Si déjà identifié comme inexistant
        if (utilisateursInexistants.has(authorIdStr)) {
            return UTILISATEUR_INTROUVABLE_ID;
        }
        
        // Vérifier si l'utilisateur existe
        const utilisateurExiste = await User.findById(authorId).select('_id');
        
        if (utilisateurExiste) {
            utilisateursVerifies.add(authorIdStr);
            return authorId;
        } else {
            utilisateursInexistants.add(authorIdStr);
            console.log(`🔄 Référence orpheline détectée et corrigée: ${authorIdStr}`);
            return UTILISATEUR_INTROUVABLE_ID;
        }
        
    } catch (error) {
        console.warn('⚠️ Erreur vérification utilisateur:', error);
        // En cas d'erreur, utiliser l'utilisateur introuvable
        return UTILISATEUR_INTROUVABLE_ID;
    }
}

async function creerUtilisateurIntrouvableAuto() {
    try {
        const User = require('../models/user.model');
        
        // Vérifier si l'utilisateur "Introuvable" existe
        let utilisateurIntrouvable = await User.findById(UTILISATEUR_INTROUVABLE_ID);
        
        if (!utilisateurIntrouvable) {
            utilisateurIntrouvable = new User({
                _id: UTILISATEUR_INTROUVABLE_ID,
                username: 'Utilisateur Introuvable',
                email: 'introuvable@deleted.com',
                password: 'DELETED_ACCOUNT',
                isDeleted: true,
                createdAt: new Date('2020-01-01')
            });
            
            await utilisateurIntrouvable.save();
            console.log('✅ Utilisateur "Introuvable" créé automatiquement');
        }
        
        return utilisateurIntrouvable;
    } catch (error) {
        console.error('❌ Erreur création auto utilisateur introuvable:', error);
    }
}

// Middleware pour les messages
async function middlewareMessagesOrphelins(req, res, next) {
    try {
        // S'assurer que l'utilisateur "Introuvable" existe
        await creerUtilisateurIntrouvableAuto();
        
        // Continuer vers le contrôleur
        next();
    } catch (error) {
        console.error('❌ Erreur middleware orphelins:', error);
        next();
    }
}

// Fonction pour enrichir les messages avec correction automatique
async function enrichirMessagesAvecCorrection(messages) {
    if (!Array.isArray(messages)) {
        return messages;
    }
    
    const messagesCorrigés = [];
    
    for (const message of messages) {
        try {
            // Créer une copie du message
            const messageCorrigé = { ...message.toObject() };
            
            // Vérifier et corriger l'authorId
            if (messageCorrigé.authorId) {
                const authorIdCorrigé = await verifierEtCorrigerUtilisateur(messageCorrigé.authorId);
                
                // Si l'ID a été corrigé, mettre à jour en base
                if (authorIdCorrigé.toString() !== messageCorrigé.authorId.toString()) {
                    // Mise à jour asynchrone en base (sans attendre)
                    const Message = require('../models/message.model');
                    
                    // Essayer de mettre à jour dans la collection Message
                    Message.updateOne(
                        { _id: message._id },
                        { authorId: authorIdCorrigé }
                    ).catch(err => console.warn('Mise à jour Message échouée:', err));
                    
                    messageCorrigé.authorId = authorIdCorrigé;
                }
            }
            
            messagesCorrigés.push(messageCorrigé);
            
        } catch (error) {
            console.warn('⚠️ Erreur enrichissement message:', error);
            // En cas d'erreur, garder le message original
            messagesCorrigés.push(message.toObject ? message.toObject() : message);
        }
    }
    
    return messagesCorrigés;
}

module.exports = {
    middlewareMessagesOrphelins,
    verifierEtCorrigerUtilisateur,
    enrichirMessagesAvecCorrection,
    UTILISATEUR_INTROUVABLE_ID,
    creerUtilisateurIntrouvableAuto
};
