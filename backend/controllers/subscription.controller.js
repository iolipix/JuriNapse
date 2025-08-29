const User = require('../models/user.model');
const mongoose = require('mongoose');
const { createNotification } = require('./notification.controller');

// Obtenir tous les abonnements d'un utilisateur
const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('following', 'username firstName lastName profilePicture bio university')
      .populate('followers', 'username firstName lastName profilePicture bio university');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    res.json({
      success: true,
      subscriptions: user.following || [],
      followers: user.followers || [],
      followingCount: user.followingCount || 0,
      followersCount: user.followersCount || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Suivre un utilisateur
const followUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: targetUserId } = req.params;
    
    // Optimisation: requêtes parallèles pour récupérer les utilisateurs
    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      targetUserId.match(/^[0-9a-fA-F]{24}$/) 
        ? User.findOne({ _id: targetUserId, isDeleted: { $ne: true }, hideFromSuggestions: { $ne: true } })
        : User.findOne({ username: targetUserId, isDeleted: { $ne: true }, hideFromSuggestions: { $ne: true } })
    ]);
    
    if (!user || !targetUser) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    // Utiliser l'ID MongoDB réel du targetUser pour la comparaison
    const targetUserIdMongo = targetUser._id.toString();
    
    if (userId === targetUserIdMongo) {
      return res.status(400).json({ success: false, error: 'Vous ne pouvez pas vous suivre vous-même' });
    }
    
    // Vérifier si l'utilisateur n'est pas déjà suivi
    if (user.following.includes(targetUserIdMongo)) {
      return res.status(400).json({ success: false, error: 'Vous suivez déjà cet utilisateur' });
    }
    
    // Optimisation: utiliser $addToSet et $inc pour éviter les doublons et mettre à jour les compteurs
    const [updatedUser, updatedTargetUser] = await Promise.all([
      User.findByIdAndUpdate(
        userId,
        {
          $addToSet: { following: targetUserIdMongo },
          $inc: { followingCount: 1 }
        },
        { new: true }
      ),
      User.findByIdAndUpdate(
        targetUserIdMongo,
        {
          $addToSet: { followers: userId },
          $inc: { followersCount: 1 }
        },
        { new: true }
      )
    ]);

    // Créer une notification pour l'utilisateur suivi
    try {
      await createNotification({
        recipient: targetUserIdMongo,
        sender: userId,
        type: 'follow',
        message: `${user.username} s'est abonné à votre profil`
      }, req.io); // Passer req.io pour les WebSockets
    } catch (notificationError) {
      // Ne pas faire échouer la requête si la notification échoue
    }

    res.json({
      success: true,
      message: 'Utilisateur suivi avec succès',
      user: {
        id: updatedTargetUser._id,
        username: updatedTargetUser.username,
        firstName: updatedTargetUser.firstName,
        lastName: updatedTargetUser.lastName,
        profilePicture: updatedTargetUser.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Ne plus suivre un utilisateur
const unfollowUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: targetUserId } = req.params;
    
    // Optimisation: requêtes parallèles pour récupérer les utilisateurs
    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      targetUserId.match(/^[0-9a-fA-F]{24}$/) 
        ? User.findById(targetUserId)
        : User.findOne({ username: targetUserId })
    ]);
    
    if (!user || !targetUser) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    // Utiliser l'ID MongoDB réel du targetUser pour la comparaison
    const targetUserIdMongo = targetUser._id.toString();
    
    if (userId === targetUserIdMongo) {
      return res.status(400).json({ success: false, error: 'Vous ne pouvez pas vous ne plus suivre vous-même' });
    }
    
    // Vérifier si l'utilisateur est bien suivi
    if (!user.following.includes(targetUserIdMongo)) {
      return res.status(400).json({ success: false, error: 'Vous ne suivez pas cet utilisateur' });
    }
    
    // Optimisation: utiliser $pull et $inc pour retirer et mettre à jour les compteurs
    const [updatedUser, updatedTargetUser] = await Promise.all([
      User.findByIdAndUpdate(
        userId,
        {
          $pull: { following: targetUserIdMongo },
          $inc: { followingCount: -1 }
        },
        { new: true }
      ),
      User.findByIdAndUpdate(
        targetUserIdMongo,
        {
          $pull: { followers: userId },
          $inc: { followersCount: -1 }
        },
        { new: true }
      )
    ]);
    
    res.json({
      success: true,
      message: 'Utilisateur non suivi avec succès',
      user: {
        id: updatedTargetUser._id,
        username: updatedTargetUser.username,
        firstName: updatedTargetUser.firstName,
        lastName: updatedTargetUser.lastName,
        profilePicture: updatedTargetUser.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Obtenir les followers d'un utilisateur
const getFollowers = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('followers', 'username firstName lastName profilePicture bio university');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    res.json({
      success: true,
      followers: user.followers || []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Obtenir les utilisateurs suivis
const getFollowing = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('following', 'username firstName lastName profilePicture bio university');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    res.json({
      success: true,
      following: user.following || []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Vérifier si on suit un utilisateur
const isFollowing = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: targetUserId } = req.params;
    
    // Optimisation: requête directe pour vérifier si l'utilisateur suit le target
    let query;
    if (targetUserId.match(/^[0-9a-fA-F]{24}$/)) {
      // C'est un ID MongoDB
      query = { _id: userId, following: targetUserId };
    } else {
      // C'est un username, on doit d'abord trouver l'utilisateur
      const targetUser = await User.findOne({ username: targetUserId }, '_id');
      if (!targetUser) {
        return res.json({ success: true, isFollowing: false });
      }
      query = { _id: userId, following: targetUser._id };
    }
    
    // Utiliser countDocuments qui est plus rapide que findOne
    const isFollowing = await User.countDocuments(query) > 0;
    
    res.json({
      success: true,
      isFollowing
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Obtenir les utilisateurs bloqués
const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('blockedUsers', 'username firstName lastName profilePicture bio university');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    res.json({
      success: true,
      blockedUsers: user.blockedUsers || []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Bloquer un utilisateur
const blockUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: targetUserId } = req.params;
    
    const user = await User.findById(userId);
    
    // Gérer les cas où targetUserId peut être un ID MongoDB ou un username
    let targetUser;
    if (targetUserId.match(/^[0-9a-fA-F]{24}$/)) {
      // C'est un ID MongoDB
      targetUser = await User.findById(targetUserId);
    } else {
      // C'est un username
      targetUser = await User.findOne({ username: targetUserId });
    }
    
    if (!user || !targetUser) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    // Utiliser l'ID MongoDB réel du targetUser pour la comparaison
    const targetUserIdMongo = targetUser._id.toString();
    
    if (userId === targetUserIdMongo) {
      return res.status(400).json({ success: false, error: 'Vous ne pouvez pas vous bloquer vous-même' });
    }
    
    // Vérifier si l'utilisateur n'est pas déjà bloqué
    if (user.blockedUsers.includes(targetUserIdMongo)) {
      return res.status(400).json({ success: false, error: 'Utilisateur déjà bloqué' });
    }
    
    // Ajouter à la liste des bloqués
    user.blockedUsers.push(targetUserIdMongo);
    
    // Supprimer des abonnements mutuels
    user.following = user.following.filter(id => id.toString() !== targetUserIdMongo);
    user.followers = user.followers.filter(id => id.toString() !== targetUserIdMongo);
    
    targetUser.following = targetUser.following.filter(id => id.toString() !== userId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);
    
    // Mettre à jour les compteurs
    user.followingCount = user.following.length;
    user.followersCount = user.followers.length;
    targetUser.followingCount = targetUser.following.length;
    targetUser.followersCount = targetUser.followers.length;
    
    await user.save();
    await targetUser.save();
    
    res.json({
      success: true,
      message: 'Utilisateur bloqué avec succès'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Débloquer un utilisateur
const unblockUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: targetUserId } = req.params;
    
    const user = await User.findById(userId);
    
    // Gérer les cas où targetUserId peut être un ID MongoDB ou un username
    let targetUser;
    if (targetUserId.match(/^[0-9a-fA-F]{24}$/)) {
      targetUser = await User.findById(targetUserId);
    } else {
      targetUser = await User.findOne({ username: targetUserId });
    }
    
    if (!user || !targetUser) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    // Utiliser l'ObjectId réel du targetUser pour la comparaison
    const targetUserObjectId = targetUser._id;
    const targetUserIdString = targetUser._id.toString();
    
    // Vérifier si l'utilisateur est bien bloqué (comparaison robuste)
    const isBlocked = user.blockedUsers.some(blockedId => 
      blockedId.toString() === targetUserIdString || 
      blockedId.equals(targetUserObjectId)
    );
    
    if (!isBlocked) {
      return res.status(400).json({ success: false, error: 'Utilisateur non bloqué' });
    }
    
    // Supprimer de la liste des bloqués (filtrage robuste)
    const originalLength = user.blockedUsers.length;
    user.blockedUsers = user.blockedUsers.filter(blockedId => 
      blockedId.toString() !== targetUserIdString && 
      !blockedId.equals(targetUserObjectId)
    );
    
    if (user.blockedUsers.length === originalLength) {
      return res.status(500).json({ success: false, error: 'Échec du déblocage' });
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Utilisateur débloqué avec succès'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Vérifier si un utilisateur est bloqué
const isBlocked = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: targetUserId } = req.params;
    
    const user = await User.findById(userId);
    
    // Gérer les cas où targetUserId peut être un ID MongoDB ou un username
    let targetUser;
    if (targetUserId.match(/^[0-9a-fA-F]{24}$/)) {
      // C'est un ID MongoDB
      targetUser = await User.findById(targetUserId);
    } else {
      // C'est un username
      targetUser = await User.findOne({ username: targetUserId });
    }
    
    if (!user || !targetUser) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    // Utiliser l'ID MongoDB réel du targetUser pour la comparaison
    const targetUserIdMongo = targetUser._id.toString();
    const isBlocked = user.blockedUsers.includes(targetUserIdMongo);
    
    res.json({
      success: true,
      isBlocked
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Obtenir les abonnés d'un utilisateur spécifique
const getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Trouver l'utilisateur par ID ou username
    const user = userId.match(/^[0-9a-fA-F]{24}$/) 
      ? await User.findById(userId).populate('followers', 'username firstName lastName profilePicture bio university')
      : await User.findOne({ username: userId }).populate('followers', 'username firstName lastName profilePicture bio university');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    res.json({
      success: true,
      data: user.followers || []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Obtenir les abonnements d'un utilisateur spécifique
const getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Trouver l'utilisateur par ID ou username
    const user = userId.match(/^[0-9a-fA-F]{24}$/) 
      ? await User.findById(userId).populate('following', 'username firstName lastName profilePicture bio university')
      : await User.findOne({ username: userId }).populate('following', 'username firstName lastName profilePicture bio university');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    res.json({
      success: true,
      data: user.following || []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

module.exports = {
  getUserSubscriptions,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFollowing,
  getBlockedUsers,
  blockUser,
  unblockUser,
  isBlocked,
  getUserFollowers,
  getUserFollowing
};
