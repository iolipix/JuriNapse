const mongoose = require('mongoose');
const Message = require('./backend/models/message.model');
const User = require('./backend/models/user.model');
const Group = require('./backend/models/group.model');
require('dotenv').config({ path: './config/.env' });

// ID spécial pour "Utilisateur Introuvable"
const UTILISATEUR_INTROUVABLE_ID = new mongoose.Types.ObjectId('000000000000000000000001');

async function creerUtilisateurIntrouvable() {
    try {
        // Vérifier si l'utilisateur "Introuvable" existe déjà
        let utilisateurIntrouvable = await User.findById(UTILISATEUR_INTROUVABLE_ID);
        
        if (!utilisateurIntrouvable) {
            // Créer l'utilisateur "Introuvable"
            utilisateurIntrouvable = new User({
                _id: UTILISATEUR_INTROUVABLE_ID,
                username: 'Utilisateur Introuvable',
                email: 'introuvable@deleted.com',
                password: 'DELETED_ACCOUNT',
                isDeleted: true,
                createdAt: new Date('2020-01-01')
            });
            
            await utilisateurIntrouvable.save();
            console.log('✅ Utilisateur "Introuvable" créé');
        } else {
            console.log('✅ Utilisateur "Introuvable" existe déjà');
        }
        
        return utilisateurIntrouvable;
    } catch (error) {
        console.error('❌ Erreur création utilisateur introuvable:', error);
        throw error;
    }
}

async function trouverUtilisateursSupprimes() {
    try {
        console.log('🔍 Recherche des utilisateurs référencés mais n\'existant plus...');
        
        // Récupérer tous les IDs d'utilisateurs existants
        const utilisateursExistants = await User.find({}, '_id');
        const idsExistants = new Set(utilisateursExistants.map(u => u._id.toString()));
        
        // Chercher dans les messages
        const messagesOrphelins = await Message.find({}).select('authorId');
        const idsReferencesMessages = new Set();
        
        messagesOrphelins.forEach(msg => {
            if (msg.authorId && !idsExistants.has(msg.authorId.toString())) {
                idsReferencesMessages.add(msg.authorId.toString());
            }
        });
        
        const tousIdsOrphelins = new Set([...idsReferencesMessages]);
        
        console.log(`📊 Références orphelines trouvées:`);
        console.log(`   - Messages: ${idsReferencesMessages.size} IDs orphelins`);
        console.log(`   - Total unique: ${tousIdsOrphelins.size} IDs à migrer`);
        
        return Array.from(tousIdsOrphelins);
        
    } catch (error) {
        console.error('❌ Erreur recherche utilisateurs supprimés:', error);
        throw error;
    }
}

async function migrerReferencesOrphelines(idsOrphelins) {
    try {
        console.log('🔄 Migration des références orphelines...');
        
        let totalMigrations = 0;
        
        // Migrer les messages normaux
        for (const idOrphelin of idsOrphelins) {
            const resultMessages = await Message.updateMany(
                { authorId: idOrphelin },
                { authorId: UTILISATEUR_INTROUVABLE_ID }
            );
            
            if (resultMessages.modifiedCount > 0) {
                console.log(`   ✅ Messages: ${resultMessages.modifiedCount} mis à jour pour ${idOrphelin}`);
                totalMigrations += resultMessages.modifiedCount;
            }
        }
        
        console.log(`🎉 Migration terminée: ${totalMigrations} références mises à jour`);
        return totalMigrations;
        
    } catch (error) {
        console.error('❌ Erreur migration:', error);
        throw error;
    }
}

async function verifierMigration() {
    try {
        console.log('🔍 Vérification de la migration...');
        
        // Compter les messages avec l'utilisateur "Introuvable"
        const messagesIntrouvables = await Message.countDocuments({ 
            authorId: UTILISATEUR_INTROUVABLE_ID 
        });
        
        console.log(`📊 Après migration:`);
        console.log(`   - Messages avec "Utilisateur Introuvable": ${messagesIntrouvables}`);
        
        // Vérifier s'il reste des références orphelines
        const utilisateursExistants = await User.find({}, '_id');
        const idsExistants = new Set(utilisateursExistants.map(u => u._id.toString()));
        
        const messagesOrphelinsRestants = await Message.find({}).select('authorId');
        let orphelinsRestants = 0;
        
        messagesOrphelinsRestants.forEach(msg => {
            if (msg.authorId && !idsExistants.has(msg.authorId.toString())) {
                orphelinsRestants++;
            }
        });
        
        if (orphelinsRestants === 0) {
            console.log('✅ Aucune référence orpheline restante !');
        } else {
            console.log(`⚠️  ${orphelinsRestants} références orphelines restantes`);
        }
        
    } catch (error) {
        console.error('❌ Erreur vérification:', error);
        throw error;
    }
}

async function executerMigration() {
    try {
        console.log('🚀 Démarrage de la migration des utilisateurs supprimés');
        console.log('=' .repeat(60));
        
        // Connexion MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connexion MongoDB établie');
        
        // 1. Créer l'utilisateur "Introuvable"
        await creerUtilisateurIntrouvable();
        
        // 2. Trouver les références orphelines
        const idsOrphelins = await trouverUtilisateursSupprimes();
        
        if (idsOrphelins.length === 0) {
            console.log('🎉 Aucune référence orpheline trouvée !');
            return;
        }
        
        // 3. Migrer les références
        const totalMigrations = await migrerReferencesOrphelines(idsOrphelins);
        
        // 4. Vérifier la migration
        await verifierMigration();
        
        console.log('=' .repeat(60));
        console.log('🎉 Migration terminée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur critique:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Connexion fermée');
    }
}

// Exécuter la migration
if (require.main === module) {
    executerMigration();
}

module.exports = { executerMigration, UTILISATEUR_INTROUVABLE_ID };
