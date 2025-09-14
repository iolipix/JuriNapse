const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const { hasRoleLevel } = require('../middleware/roleAuth');

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

/**
 * Initialise l'administrateur par défaut si défini dans les variables d'environnement
 * Cette fonction est appelée au démarrage du serveur
 */
const initializeDefaultAdmin = async () => {
  try {
    const defaultAdminId = process.env.DEFAULT_ADMIN_USER_ID;

    if (!defaultAdminId) {
      return; // Pas d'admin par défaut configuré
    }

    const user = await User.findById(defaultAdminId);

    if (!user) {
      console.log('⚠️ Utilisateur admin par défaut non trouvé avec ID:', defaultAdminId);
      return;
    }

    // Rôles stockés en string séparée par des ';' (ex: "user;moderator;administrator")
    const roles = (typeof user.role === 'string' && user.role.trim().length > 0)
      ? user.role.split(';').map(r => r.trim()).filter(Boolean)
      : [];

    // Toujours garantir le rôle de base 'user'
    if (!roles.includes('user')) roles.unshift('user');

    // Ajouter 'administrator' si manquant, sans enlever d'autres rôles
    if (!roles.includes('administrator')) {
      roles.push('administrator');
      user.role = Array.from(new Set(roles)).join(';');
      await user.save();
      console.log('✅ Admin par défaut ajusté (additive):', user.username, '→', user.role);
    } else {
      // Rien à faire si déjà admin; ne pas écraser les autres rôles
      // Optionnel: normaliser l'ordre minimal
      const normalized = Array.from(new Set(roles));
      const before = user.role;
      const after = normalized.join(';');
      if (before !== after) {
        user.role = after;
        await user.save();
      }
      console.log('ℹ️ Admin par défaut déjà configuré, aucun changement pour', user.username);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de l\'admin par défaut:', error);
  }
};

/**
 * Obtenir tous les utilisateurs (admin/modérateur uniquement)
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    
    // Construire le filtre de recherche
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && ['user', 'moderator', 'administrator'].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('username email firstName lastName role isActive createdAt university')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
};

/**
 * Mettre à jour le rôle d'un utilisateur (admin uniquement)
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const currentUser = req.user;

    // Valider le rôle
    if (!['user', 'moderator', 'administrator'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    // Récupérer l'utilisateur cible
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher l'utilisateur de modifier son propre rôle
    if (currentUser.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre rôle'
      });
    }

    // Seul un administrateur peut créer d'autres administrateurs
    if (role === 'administrator' && currentUser.role !== 'administrator') {
      return res.status(403).json({
        success: false,
        message: 'Seul un administrateur peut nommer d\'autres administrateurs'
      });
    }

    // Mettre à jour le rôle
    targetUser.role = role;
    await targetUser.save();

    res.json({
      success: true,
      message: `Rôle mis à jour avec succès`,
      user: {
        id: targetUser._id,
        username: targetUser.username,
        role: targetUser.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du rôle'
    });
  }
};

/**
 * Obtenir les statistiques des rôles (admin uniquement)
 */
const getRoleStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Assurer que tous les rôles sont présents
    const roles = ['user', 'moderator', 'administrator'];
    const formattedStats = roles.map(role => {
      const stat = stats.find(s => s._id === role);
      return {
        role,
        count: stat ? stat.count : 0
      };
    });

    res.json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

/**
 * Désactiver/Activer un utilisateur (modérateur/admin uniquement)
 */
const toggleUserActive = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher de désactiver son propre compte
    if (currentUser.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte'
      });
    }

    // Empêcher un modérateur de désactiver un admin
    if (targetUser.role === 'administrator' && currentUser.role !== 'administrator') {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver un administrateur'
      });
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    res.json({
      success: true,
      message: `Utilisateur ${targetUser.isActive ? 'activé' : 'désactivé'} avec succès`,
      user: {
        id: targetUser._id,
        username: targetUser.username,
        isActive: targetUser.isActive
      }
    });
  } catch (error) {
    console.error('Erreur lors de la modification du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut'
    });
  }
};

/**
 * Attribuer un premium temporaire à un utilisateur
 * Route: POST /api/admin/grant-premium
 */
const grantPremium = async (req, res) => {
  try {
    const { userId, durationInDays } = req.body;
    
    // Vérification des permissions - modérateur ou admin requis
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (!currentUser.isModerator() && !currentUser.isAdmin())) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Modérateur ou Administrateur requis'
      });
    }
    
    // Validation des données
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }
    
    if (durationInDays && (isNaN(durationInDays) || durationInDays < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Durée invalide (doit être un nombre positif de jours)'
      });
    }
    
    // Trouver l'utilisateur cible
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier qu'on ne peut pas s'auto-attribuer le premium (sauf admin)
    if (userId === req.user.id && !currentUser.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas vous attribuer le premium à vous-même'
      });
    }
    
    // Attribuer le premium
    targetUser.grantPremium(durationInDays, req.user.id);
    await targetUser.save();
    
    // Préparer la réponse
    const premiumInfo = targetUser.getPremiumInfo();
    
    res.json({
      success: true,
      message: `Premium ${durationInDays ? 'temporaire' : 'permanent'} attribué avec succès`,
      user: {
        id: targetUser._id,
        username: targetUser.username,
        premiumInfo
      },
      grantedBy: {
        id: currentUser._id,
        username: currentUser.username
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'attribution du premium:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Révoquer le premium d'un utilisateur
 * Route: DELETE /api/admin/revoke-premium/:userId
 */
const revokePremium = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérification des permissions - modérateur ou admin requis
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (!currentUser.isModerator() && !currentUser.isAdmin())) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Modérateur ou Administrateur requis'
      });
    }
    
    // Trouver l'utilisateur cible
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier si l'utilisateur a le premium
    if (!targetUser.hasRole('premium')) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur n\'a pas le premium'
      });
    }
    
    // Révoquer le premium
    targetUser.revokePremium();
    await targetUser.save();
    
    res.json({
      success: true,
      message: 'Premium révoqué avec succès',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        premiumInfo: targetUser.getPremiumInfo()
      },
      revokedBy: {
        id: currentUser._id,
        username: currentUser.username
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la révocation du premium:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Obtenir la liste des utilisateurs premium avec leurs informations d'expiration
 * Route: GET /api/admin/premium-users
 */
const getPremiumUsers = async (req, res) => {
  try {
    // Vérification des permissions - modérateur ou admin requis
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (!currentUser.isModerator() && !currentUser.isAdmin())) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Modérateur ou Administrateur requis'
      });
    }
    
    // Trouver tous les utilisateurs premium
    const premiumUsers = await User.find({
      role: { $regex: 'premium' }
    })
    .select('username firstName lastName email premiumExpiresAt premiumGrantedBy premiumGrantedAt')
    .populate('premiumGrantedBy', 'username')
    .sort({ premiumGrantedAt: -1 });
    
    // Formater les données
    const formattedUsers = premiumUsers.map(user => ({
      id: user._id,
      username: user.username,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      premiumInfo: user.getPremiumInfo(),
      grantedBy: user.premiumGrantedBy ? {
        id: user.premiumGrantedBy._id,
        username: user.premiumGrantedBy.username
      } : null
    }));
    
    res.json({
      success: true,
      users: formattedUsers,
      count: formattedUsers.length
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs premium:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Nettoyer manuellement les premiums expirés
 * Route: POST /api/admin/cleanup-expired-premiums
 */
const cleanupExpiredPremiums = async (req, res) => {
  try {
    // Vérification des permissions - admin requis
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || !currentUser.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Administrateur requis'
      });
    }
    
    // Nettoyer les premiums expirés
    const result = await User.cleanupExpiredPremiums();
    
    res.json({
      success: true,
      message: 'Nettoyage des premiums expirés terminé',
      modifiedCount: result.modifiedCount
    });
    
  } catch (error) {
    console.error('Erreur lors du nettoyage des premiums expirés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = { 
  repairSubscriptionCounters, 
  quickRepairCounters, 
  getAllUsers, 
  updateUserRole, 
  getRoleStats, 
  toggleUserActive, 
  initializeDefaultAdmin,
  grantPremium,
  revokePremium,
  getPremiumUsers,
  cleanupExpiredPremiums
};
