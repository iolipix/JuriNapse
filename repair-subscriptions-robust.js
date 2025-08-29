require('dotenv').config({ path: './backend/config/.env' });
const mongoose = require('mongoose');
const User = require('./backend/models/user.model');

async function repairSubscriptionCountersRobust() {
    try {
        console.log('🔌 Connexion à MongoDB avec timeout étendu...');
        
        // Configuration MongoDB avec timeouts plus longs
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 30000,
        });
        
        console.log('✅ Connecté à MongoDB');
        console.log('🔧 Début de la réparation des compteurs d\'abonnements');
        
        // Traitement par petits batches pour éviter les timeouts
        const batchSize = 50;
        let skip = 0;
        let compteursIncorrects = 0;
        let compteursCorrigés = 0;
        let utilisateursOrphelins = 0;
        let referencesSupprimees = 0;
        let totalUtilisateurs = 0;
        
        while (true) {
            console.log(`📊 Traitement du batch ${Math.floor(skip/batchSize) + 1} (utilisateurs ${skip + 1} à ${skip + batchSize})`);
            
            // Récupérer un batch d'utilisateurs
            const users = await User.find({}, {
                _id: 1,
                following: 1,
                followers: 1,
                followingCount: 1,
                followersCount: 1,
                username: 1
            })
            .skip(skip)
            .limit(batchSize)
            .maxTimeMS(25000);
            
            if (users.length === 0) {
                console.log('✅ Fin du traitement - plus d\'utilisateurs à traiter');
                break;
            }
            
            totalUtilisateurs += users.length;
            
            for (const user of users) {
                try {
                    // Nettoyer les références orphelines dans following
                    let followingNettoyé = user.following || [];
                    if (followingNettoyé.length > 0) {
                        // Vérifier par petits lots pour éviter les timeouts
                        const followingIds = followingNettoyé.map(id => id.toString());
                        const followingValides = await User.find({ 
                            _id: { $in: followingIds }
                        }).select('_id').maxTimeMS(10000);
                        
                        const idsValides = followingValides.map(u => u._id.toString());
                        const nouveauFollowing = followingNettoyé.filter(id => idsValides.includes(id.toString()));
                        
                        if (nouveauFollowing.length !== followingNettoyé.length) {
                            utilisateursOrphelins++;
                            referencesSupprimees += (followingNettoyé.length - nouveauFollowing.length);
                            console.log(`🧹 ${user.username}: ${followingNettoyé.length - nouveauFollowing.length} références supprimées dans following`);
                            
                            await User.updateOne(
                                { _id: user._id },
                                { following: nouveauFollowing },
                                { maxTimeMS: 5000 }
                            );
                        }
                        
                        followingNettoyé = nouveauFollowing;
                    }
                    
                    // Nettoyer les références orphelines dans followers
                    let followersNettoyé = user.followers || [];
                    if (followersNettoyé.length > 0) {
                        const followersIds = followersNettoyé.map(id => id.toString());
                        const followersValides = await User.find({ 
                            _id: { $in: followersIds }
                        }).select('_id').maxTimeMS(10000);
                        
                        const idsValides = followersValides.map(u => u._id.toString());
                        const nouveauFollowers = followersNettoyé.filter(id => idsValides.includes(id.toString()));
                        
                        if (nouveauFollowers.length !== followersNettoyé.length) {
                            utilisateursOrphelins++;
                            referencesSupprimees += (followersNettoyé.length - nouveauFollowers.length);
                            console.log(`🧹 ${user.username}: ${followersNettoyé.length - nouveauFollowers.length} références supprimées dans followers`);
                            
                            await User.updateOne(
                                { _id: user._id },
                                { followers: nouveauFollowers },
                                { maxTimeMS: 5000 }
                            );
                        }
                        
                        followersNettoyé = nouveauFollowers;
                    }
                    
                    // Calculer les vrais compteurs après nettoyage
                    const vraiFollowingCount = followingNettoyé.length;
                    const vraiFollowersCount = followersNettoyé.length;
                    
                    // Vérifier s'il y a des incohérences
                    const followingIncorrect = user.followingCount !== vraiFollowingCount;
                    const followersIncorrect = user.followersCount !== vraiFollowersCount;
                    
                    if (followingIncorrect || followersIncorrect) {
                        compteursIncorrects++;
                        console.log(`🔍 Correction compteurs pour ${user.username}:`);
                        console.log(`  Following: ${user.followingCount} → ${vraiFollowingCount}`);
                        console.log(`  Followers: ${user.followersCount} → ${vraiFollowersCount}`);
                        
                        await User.updateOne(
                            { _id: user._id },
                            {
                                followingCount: vraiFollowingCount,
                                followersCount: vraiFollowersCount
                            },
                            { maxTimeMS: 5000 }
                        );
                        
                        compteursCorrigés++;
                    }
                    
                } catch (userError) {
                    console.error(`❌ Erreur pour l'utilisateur ${user.username}:`, userError.message);
                }
            }
            
            skip += batchSize;
            
            // Petite pause entre les batches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const resultat = {
            success: true,
            message: 'Réparation des compteurs d\'abonnements terminée',
            statistiques: {
                utilisateursTotal: totalUtilisateurs,
                compteursIncorrects,
                compteursCorrigés,
                utilisateursAvecReferencesOrphelines: utilisateursOrphelins,
                referencesSupprimees
            }
        };
        
        console.log('✅ Réparation terminée !');
        console.log('📊 Résultats :', JSON.stringify(resultat, null, 2));
        
    } catch (error) {
        console.error('❌ Erreur lors de la réparation :', error);
    } finally {
        try {
            await mongoose.disconnect();
            console.log('🔌 Déconnecté de MongoDB');
        } catch (e) {
            console.log('🔌 Déconnexion MongoDB');
        }
    }
}

// Exécuter la réparation
repairSubscriptionCountersRobust();
