const axios = require('axios');

async function repairSubscriptionCounters() {
    try {
        console.log('🔧 Réparation des compteurs d\'abonnements...');
        
        // URL de l'API
        const apiUrl = 'https://jurinapse-production.up.railway.app/api/admin/repair-subscription-counters';
        
        // Token admin (tu devras peut-être le remplacer par un vrai token admin)
        const adminToken = process.env.ADMIN_TOKEN || 'ton-token-admin-ici';
        
        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Réparation terminée !');
        console.log('📊 Résultats :', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Erreur lors de la réparation :', error.response?.data || error.message);
    }
}

// Alternative : appel direct à la base de données
async function repairDirectlyFromDB() {
    require('dotenv').config({ path: './backend/config/.env' });
    const mongoose = require('mongoose');
    const User = require('./backend/models/user.model');
    
    try {
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');
        
        console.log('🔧 Début de la réparation des compteurs d\'abonnements');
        
        // Récupérer tous les utilisateurs
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
        let referencesSupprimees = 0;
        
        for (const user of users) {
            // Nettoyer les références orphelines dans following
            if (user.following && user.following.length > 0) {
                const followingValides = await User.find({ 
                    _id: { $in: user.following }
                }).select('_id');
                
                const idsValides = followingValides.map(u => u._id.toString());
                const followingOriginaux = user.following.map(id => id.toString());
                const followingNettoyé = user.following.filter(id => idsValides.includes(id.toString()));
                
                if (followingNettoyé.length !== followingOriginaux.length) {
                    utilisateursOrphelins++;
                    referencesSupprimees += (followingOriginaux.length - followingNettoyé.length);
                    console.log(`🧹 ${user.username}: ${followingOriginaux.length - followingNettoyé.length} références supprimées dans following`);
                    
                    await User.updateOne(
                        { _id: user._id },
                        { following: followingNettoyé }
                    );
                }
                
                user.following = followingNettoyé;
            }
            
            // Nettoyer les références orphelines dans followers
            if (user.followers && user.followers.length > 0) {
                const followersValides = await User.find({ 
                    _id: { $in: user.followers }
                }).select('_id');
                
                const idsValides = followersValides.map(u => u._id.toString());
                const followersOriginaux = user.followers.map(id => id.toString());
                const followersNettoyé = user.followers.filter(id => idsValides.includes(id.toString()));
                
                if (followersNettoyé.length !== followersOriginaux.length) {
                    utilisateursOrphelins++;
                    referencesSupprimees += (followersOriginaux.length - followersNettoyé.length);
                    console.log(`🧹 ${user.username}: ${followersOriginaux.length - followersNettoyé.length} références supprimées dans followers`);
                    
                    await User.updateOne(
                        { _id: user._id },
                        { followers: followersNettoyé }
                    );
                }
                
                user.followers = followersNettoyé;
            }
            
            // Calculer les vrais compteurs après nettoyage
            const vraiFollowingCount = user.following ? user.following.length : 0;
            const vraiFollowersCount = user.followers ? user.followers.length : 0;
            
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
                    }
                );
                
                compteursCorrigés++;
            }
        }
        
        const resultat = {
            success: true,
            message: 'Réparation des compteurs d\'abonnements terminée',
            statistiques: {
                utilisateursTotal: users.length,
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
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécuter la réparation directe
repairDirectlyFromDB();
