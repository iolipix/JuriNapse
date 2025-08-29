const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user.model');

/**
 * Route d'administration pour réparer les compteurs d'abonnements
 * Route: GET /api/admin/repair-subscription-counters
 */
const repairSubscriptionCounters = async (req, res) => {
    try {
        console.log('🔧 Début de la réparation des compteurs d\'abonnements');
        
        // Vérification de sécurité - seuls les admins peuvent exécuter cette fonction
        const currentUser = await User.findById(req.user.id);
        if (!currentUser || currentUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé - Admin requis'
            });
        }
        
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
        let referencesSupprimees = 0;
        
        for (const user of users) {
            // Calculer les vrais compteurs
            const vraiFollowingCount = user.following ? user.following.length : 0;
            const vraiFollowersCount = user.followers ? user.followers.length : 0;
            
            // Vérifier s'il y a des incohérences
            const followingIncorrect = user.followingCount !== vraiFollowingCount;
            const followersIncorrect = user.followersCount !== vraiFollowersCount;
            
            if (followingIncorrect || followersIncorrect) {
                compteursIncorrects++;
                console.log(`🔍 Correction compteurs pour ${user.username}`);
            }
            
            // Nettoyer les références orphelines dans following
            let followingClean = user.following || [];
            if (followingClean.length > 0) {
                const followingExistants = await User.find({
                    _id: { $in: followingClean }
                }).select('_id');
                
                const idsExistants = followingExistants.map(u => u._id.toString());
                const orphelinsFollowing = followingClean.filter(id => 
                    !idsExistants.includes(id.toString())
                );
                
                if (orphelinsFollowing.length > 0) {
                    utilisateursOrphelins++;
                    referencesSupprimees += orphelinsFollowing.length;
                    followingClean = followingClean.filter(id => 
                        idsExistants.includes(id.toString())
                    );
                    console.log(`🧹 ${user.username}: ${orphelinsFollowing.length} following orphelins supprimés`);
                }
            }
            
            // Nettoyer les références orphelines dans followers
            let followersClean = user.followers || [];
            if (followersClean.length > 0) {
                const followersExistants = await User.find({
                    _id: { $in: followersClean }
                }).select('_id');
                
                const idsExistants = followersExistants.map(u => u._id.toString());
                const orphelinsFollowers = followersClean.filter(id => 
                    !idsExistants.includes(id.toString())
                );
                
                if (orphelinsFollowers.length > 0) {
                    utilisateursOrphelins++;
                    referencesSupprimees += orphelinsFollowers.length;
                    followersClean = followersClean.filter(id => 
                        idsExistants.includes(id.toString())
                    );
                    console.log(`🧹 ${user.username}: ${orphelinsFollowers.length} followers orphelins supprimés`);
                }
            }
            
            // Mettre à jour l'utilisateur avec les données nettoyées
            const newFollowingCount = followingClean.length;
            const newFollowersCount = followersClean.length;
            
            if (followingIncorrect || followersIncorrect || 
                user.following?.length !== followingClean.length || 
                user.followers?.length !== followersClean.length) {
                
                await User.findByIdAndUpdate(user._id, {
                    following: followingClean,
                    followers: followersClean,
                    followingCount: newFollowingCount,
                    followersCount: newFollowersCount
                });
                
                compteursCorrigés++;
            }
        }
        
        const resultat = {
            success: true,
            message: 'Réparation des compteurs d\'abonnements terminée',
            stats: {
                utilisateursVerifies: users.length,
                compteursIncorrects,
                compteursCorrigés,
                utilisateursAvecOrphelins: utilisateursOrphelins,
                referencesOrphelinesSupprimees: referencesSupprimees
            }
        };
        
        console.log('📊 RÉSUMÉ DE LA RÉPARATION:', resultat.stats);
        
        res.json(resultat);
        
    } catch (error) {
        console.error('❌ Erreur réparation compteurs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la réparation des compteurs',
            error: error.message
        });
    }
};

/**
 * Route rapide pour réparer juste les compteurs basiques sans validation extensive
 */
const quickRepairCounters = async (req, res) => {
    try {
        console.log('🚀 Réparation rapide des compteurs');
        
        // Pas de vérification admin pour l'instant - emergency fix
        
        // Mise à jour rapide des compteurs uniquement
        const bulkOps = [];
        
        // Récupérer juste les utilisateurs avec leurs listes
        const users = await User.find({}).select('following followers followingCount followersCount username').limit(100);
        
        console.log(`📊 ${users.length} utilisateurs à corriger rapidement`);
        
        let corrections = 0;
        
        for (const user of users) {
            const correctFollowingCount = user.following ? user.following.length : 0;
            const correctFollowersCount = user.followers ? user.followers.length : 0;
            
            if (user.followingCount !== correctFollowingCount || user.followersCount !== correctFollowersCount) {
                corrections++;
                console.log(`🔍 ${user.username}: following ${user.followingCount}→${correctFollowingCount}, followers ${user.followersCount}→${correctFollowersCount}`);
                
                bulkOps.push({
                    updateOne: {
                        filter: { _id: user._id },
                        update: {
                            followingCount: correctFollowingCount,
                            followersCount: correctFollowersCount
                        }
                    }
                });
            }
        }
        
        // Exécuter les corrections par batch
        if (bulkOps.length > 0) {
            const result = await User.bulkWrite(bulkOps);
            console.log(`✅ ${result.modifiedCount} utilisateurs corrigés`);
        }
        
        res.json({
            success: true,
            message: 'Réparation rapide terminée',
            corrections: corrections,
            utilisateursTraités: users.length
        });
        
    } catch (error) {
        console.error('❌ Erreur réparation rapide:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la réparation rapide',
            error: error.message
        });
    }
};

module.exports = { repairSubscriptionCounters, quickRepairCounters };
