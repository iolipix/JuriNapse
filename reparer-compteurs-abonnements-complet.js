const mongoose = require('mongoose');
const User = require('./backend/models/user.model');
require('dotenv').config({ path: './config/.env' });

async function reparer_compteurs_abonnements() {
    try {
        console.log('🔧 RÉPARATION DES COMPTEURS D\'ABONNEMENTS');
        console.log('=' .repeat(50));
        
        // Connexion MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connexion MongoDB établie');
        
        // Récupérer tous les utilisateurs avec leurs listes d'abonnements
        const users = await User.find({}, {
            _id: 1,
            following: 1,
            followers: 1,
            followingCount: 1,
            followersCount: 1,
            username: 1
        });
        
        console.log(`📊 ${users.length} utilisateurs à vérifier`);
        
        let compteursIncorrects = 0;
        let compteursCorrigés = 0;
        let utilisateursOrphelins = 0;
        
        for (const user of users) {
            // Calculer les vrais compteurs
            const vraiFollowingCount = user.following ? user.following.length : 0;
            const vraiFollowersCount = user.followers ? user.followers.length : 0;
            
            // Vérifier s'il y a des incohérences
            const followingIncorrect = user.followingCount !== vraiFollowingCount;
            const followersIncorrect = user.followersCount !== vraiFollowersCount;
            
            if (followingIncorrect || followersIncorrect) {
                compteursIncorrects++;
                
                console.log(`\n🔍 Utilisateur: ${user.username} (${user._id})`);
                if (followingIncorrect) {
                    console.log(`   Following: ${user.followingCount} → ${vraiFollowingCount}`);
                }
                if (followersIncorrect) {
                    console.log(`   Followers: ${user.followersCount} → ${vraiFollowersCount}`);
                }
                
                // Corriger en base
                await User.findByIdAndUpdate(user._id, {
                    followingCount: vraiFollowingCount,
                    followersCount: vraiFollowersCount
                });
                
                compteursCorrigés++;
                console.log('   ✅ Corrigé');
            }
            
            // Vérifier s'il y a des références orphelines dans les listes
            if (user.following && user.following.length > 0) {
                const followingExistants = await User.find({
                    _id: { $in: user.following }
                }).select('_id');
                
                const idsExistants = followingExistants.map(u => u._id.toString());
                const orphelinsFollowing = user.following.filter(id => 
                    !idsExistants.includes(id.toString())
                );
                
                if (orphelinsFollowing.length > 0) {
                    utilisateursOrphelins++;
                    console.log(`\n🔍 ${user.username} suit ${orphelinsFollowing.length} utilisateurs supprimés`);
                    
                    // Nettoyer les références orphelines
                    await User.findByIdAndUpdate(user._id, {
                        $pull: { following: { $in: orphelinsFollowing } },
                        followingCount: idsExistants.length
                    });
                    
                    console.log('   🧹 Références orphelines nettoyées');
                }
            }
            
            if (user.followers && user.followers.length > 0) {
                const followersExistants = await User.find({
                    _id: { $in: user.followers }
                }).select('_id');
                
                const idsExistants = followersExistants.map(u => u._id.toString());
                const orphelinsFollowers = user.followers.filter(id => 
                    !idsExistants.includes(id.toString())
                );
                
                if (orphelinsFollowers.length > 0) {
                    utilisateursOrphelins++;
                    console.log(`\n🔍 ${user.username} a ${orphelinsFollowers.length} abonnés supprimés`);
                    
                    // Nettoyer les références orphelines
                    await User.findByIdAndUpdate(user._id, {
                        $pull: { followers: { $in: orphelinsFollowers } },
                        followersCount: idsExistants.length
                    });
                    
                    console.log('   🧹 Références orphelines nettoyées');
                }
            }
        }
        
        console.log('\n📊 RÉSUMÉ DE LA RÉPARATION:');
        console.log(`   Utilisateurs avec compteurs incorrects: ${compteursIncorrects}`);
        console.log(`   Compteurs corrigés: ${compteursCorrigés}`);
        console.log(`   Utilisateurs avec références orphelines: ${utilisateursOrphelins}`);
        
        if (compteursCorrigés > 0 || utilisateursOrphelins > 0) {
            console.log('\n🎉 Réparation terminée avec succès !');
            console.log('👤 Les profils comme celui de Théophane Maurey devraient maintenant afficher les bons compteurs');
        } else {
            console.log('\n✅ Tous les compteurs étaient déjà corrects !');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la réparation:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Connexion fermée');
    }
}

// Exécuter la réparation
if (require.main === module) {
    reparer_compteurs_abonnements();
}

module.exports = { reparer_compteurs_abonnements };
