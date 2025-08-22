const mongoose = require('mongoose');
const User = require('../models/user.model');

/**
 * Fonction utilitaire pour recalculer et synchroniser les compteurs d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
async function syncUserCounters(userId) {
  try {
    const user = await User.findById(userId).populate('following followers');
    if (!user) return false;
    
    const realFollowingCount = user.following?.length || 0;
    const realFollowersCount = user.followers?.length || 0;
    
    // Mettre à jour seulement si nécessaire
    if (user.followingCount !== realFollowingCount || user.followersCount !== realFollowersCount) {
      await User.findByIdAndUpdate(userId, {
        followingCount: realFollowingCount,
        followersCount: realFollowersCount
      });
      
      console.log(`🔄 Compteurs synchronisés pour ${user.username}: following ${user.followingCount}→${realFollowingCount}, followers ${user.followersCount}→${realFollowersCount}`);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la synchronisation des compteurs:', error);
    return false;
  }
}

/**
 * Fonction sécurisée pour suivre un utilisateur avec vérifications
 */
async function secureFollowUser(currentUserId, targetUserId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Vérifications de base
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId).session(session),
      User.findById(targetUserId).session(session)
    ]);
    
    if (!currentUser || !targetUser) {
      throw new Error('Utilisateur non trouvé');
    }
    
    if (currentUserId === targetUserId) {
      throw new Error('Impossible de se suivre soi-même');
    }
    
    // Vérifier si déjà suivi
    if (currentUser.following.includes(targetUserId)) {
      throw new Error('Utilisateur déjà suivi');
    }
    
    // Effectuer les mises à jour avec transaction
    await Promise.all([
      User.findByIdAndUpdate(
        currentUserId,
        {
          $addToSet: { following: targetUserId },
          $inc: { followingCount: 1 }
        },
        { session }
      ),
      User.findByIdAndUpdate(
        targetUserId,
        {
          $addToSet: { followers: currentUserId },
          $inc: { followersCount: 1 }
        },
        { session }
      )
    ]);
    
    await session.commitTransaction();
    
    // Synchroniser les compteurs après la transaction
    await Promise.all([
      syncUserCounters(currentUserId),
      syncUserCounters(targetUserId)
    ]);
    
    return { success: true };
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Fonction sécurisée pour ne plus suivre un utilisateur avec vérifications
 */
async function secureUnfollowUser(currentUserId, targetUserId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Vérifications de base
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId).session(session),
      User.findById(targetUserId).session(session)
    ]);
    
    if (!currentUser || !targetUser) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Vérifier si actuellement suivi
    if (!currentUser.following.includes(targetUserId)) {
      throw new Error('Utilisateur non suivi actuellement');
    }
    
    // Effectuer les mises à jour avec transaction
    await Promise.all([
      User.findByIdAndUpdate(
        currentUserId,
        {
          $pull: { following: targetUserId },
          $inc: { followingCount: -1 }
        },
        { session }
      ),
      User.findByIdAndUpdate(
        targetUserId,
        {
          $pull: { followers: currentUserId },
          $inc: { followersCount: -1 }
        },
        { session }
      )
    ]);
    
    await session.commitTransaction();
    
    // Synchroniser les compteurs après la transaction
    await Promise.all([
      syncUserCounters(currentUserId),
      syncUserCounters(targetUserId)
    ]);
    
    return { success: true };
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = {
  syncUserCounters,
  secureFollowUser,
  secureUnfollowUser
};
