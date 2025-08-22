const User = require('../models/user.model');
const Post = require('../models/post.model');
const Message = require('../models/message.model');
const bcrypt = require('bcryptjs');
const { replaceDeletedUserInfo, isUserNotFound } = require('../utils/deletedUserHelper');

// Importer le cache pour le nettoyer après suppression
const NodeCache = require('node-cache');
const postCache = new NodeCache({ stdTTL: 300 }); // Même config que dans post.controller

const getUsers = async (req, res) => {
  try {
    // Exclure les utilisateurs supprimés des listes générales
    const users = await User.find({ isDeleted: { $ne: true } }, '-password -refreshToken').select('username email profilePicture createdAt isActive role').lean().sort({ createdAt: -1 });
    const normalizedUsers = users.map(user => ({ ...user, id: user._id.toString() }));
    res.json({ success: true, data: normalizedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password -refreshToken').select('username email profilePicture createdAt isActive role savedPostsCount followersCount followingCount isDeleted deletedAt').lean();
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Si l'utilisateur est supprimé, renvoyer les informations génériques
    if (isUserNotFound(user)) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    const normalizedUser = { ...user, id: user._id.toString() };
    res.json({ success: true, user: normalizedUser });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur" });
  }
};

const getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }, '-password -refreshToken').select('username email profilePicture createdAt isActive role isDeleted deletedAt').lean();
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Si l'utilisateur est supprimé, renvoyer une erreur 404
    if (isUserNotFound(user)) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    const normalizedUser = { ...user, id: user._id.toString() };
    res.json(normalizedUser);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur" });
  }
};


const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    // Récupérer l'utilisateur avec ses posts sauvegardés
    const user = await User.findById(userId).select('savedPosts').populate({
      path: 'savedPosts.postId',
      populate: {
        path: 'authorId',
        select: 'username firstName lastName profilePicture isStudent createdAt'
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Filtrer les posts sauvegardés qui existent encore et mapper les données
    const savedPosts = user.savedPosts
      .filter(savedPost => savedPost.postId) // Filtrer les posts supprimés
      .map(savedPost => {
        const post = savedPost.postId;
        return {
          ...post.toObject(),
          savedAt: savedPost.savedAt // Ajouter la date de sauvegarde
        };
      })
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()); // Trier par date de sauvegarde (plus récent d'abord)

    res.json({
      success: true,
      savedPosts
    });

  } catch (error) {
    console.error('Erreur getSavedPosts:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des posts sauvegardés' });
  }
};

const getRecentEmojis = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    const user = await User.findById(userId).select('recentEmojis');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, recentEmojis: user.recentEmojis || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur récupération emojis récents' });
  }
};

const updateRecentEmojis = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    const { emojis } = req.body;
    if (!Array.isArray(emojis)) {
      return res.status(400).json({ success: false, message: 'Format invalide' });
    }
    const cleaned = [...new Set(
      emojis.filter(e => typeof e === 'string' && e.trim() !== '' && e.length <= 32)
    )].slice(0, 32);
    const user = await User.findByIdAndUpdate(userId, { recentEmojis: cleaned }, { new: true }).select('recentEmojis');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, recentEmojis: user.recentEmojis });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur mise à jour emojis récents' });
  }
};

const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    let user;

    // Essayer d'abord de chercher par ID MongoDB
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id, '-password -refreshToken')
        .select('username followersCount followingCount savedPostsCount createdAt isDeleted deletedAt')
        .lean();
    } else {
      // Si ce n'est pas un ObjectId valide, chercher par username
      user = await User.findOne({ username: id }, '-password -refreshToken')
        .select('username followersCount followingCount savedPostsCount createdAt isDeleted deletedAt')
        .lean();
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Si l'utilisateur est supprimé, renvoyer une erreur 404
    if (isUserNotFound(user)) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const stats = {
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      savedPostsCount: user.savedPostsCount || 0,
      joinDate: user.createdAt
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Erreur getUserStats:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { password } = req.body;
    
    console.log(`🔍 DEBUG deleteUser - userId: ${userId}, body:`, req.body, 'password:', password);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    if (!password) {
      console.log('❌ Mot de passe manquant dans req.body');
      return res.status(400).json({ success: false, message: 'Mot de passe requis pour la suppression' });
    }

    // Vérifier le mot de passe avant la suppression
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Mot de passe incorrect' });
    }

    console.log(`🗑️ Début suppression utilisateur: ${userId}`);

    // 1. Nettoyer les likes sur les posts
    console.log('🧹 Nettoyage des likes sur les posts...');
    const likesCleanupResult = await Post.updateMany(
      { likedBy: userId },
      { 
        $pull: { likedBy: userId },
        $inc: { likes: -1 }
      }
    );
    console.log(`   ${likesCleanupResult.modifiedCount} posts mis à jour`);

    // 2. Nettoyer les likes sur les commentaires
    console.log('🧹 Nettoyage des likes sur les commentaires...');
    const posts = await Post.find({ 'comments.likedBy': userId });
    let commentsUpdated = 0;
    
    for (const post of posts) {
      let postModified = false;
      const updatedComments = post.comments.map(comment => {
        if (comment.likedBy && comment.likedBy.includes(userId)) {
          comment.likedBy = comment.likedBy.filter(id => !id.equals(userId));
          comment.likes = comment.likedBy.length;
          postModified = true;
          commentsUpdated++;
        }
        return comment;
      });
      
      if (postModified) {
        await Post.findByIdAndUpdate(post._id, { comments: updatedComments });
      }
    }
    console.log(`   ${commentsUpdated} commentaires mis à jour`);

    // 3. Nettoyer les relations d'abonnement
    console.log('🧹 Nettoyage des relations d\'abonnement...');
    
    // Supprimer cet utilisateur de la liste des "following" des autres utilisateurs
    const followingCleanup = await User.updateMany(
      { following: userId },
      { 
        $pull: { following: userId }
      }
    );
    console.log(`   ${followingCleanup.modifiedCount} utilisateurs ne suivent plus cet utilisateur`);

    // Supprimer cet utilisateur de la liste des "followers" des autres utilisateurs  
    const followersCleanup = await User.updateMany(
      { followers: userId },
      { 
        $pull: { followers: userId }
      }
    );
    console.log(`   ${followersCleanup.modifiedCount} utilisateurs n'ont plus cet utilisateur comme abonné`);

    // 3.5. IMPORTANT: Recalculer tous les compteurs d'abonnements
    console.log('🔢 Recalcul des compteurs d\'abonnements...');
    
    // Récupérer tous les utilisateurs qui étaient connectés à l'utilisateur supprimé
    const usersToUpdate = await User.find({
      $or: [
        { following: { $exists: true } },
        { followers: { $exists: true } }
      ]
    }).select('_id following followers followingCount followersCount');

    let compteursCorrigés = 0;
    for (const userToUpdate of usersToUpdate) {
      const newFollowingCount = userToUpdate.following ? userToUpdate.following.length : 0;
      const newFollowersCount = userToUpdate.followers ? userToUpdate.followers.length : 0;
      
      // Mettre à jour seulement si les compteurs sont incorrects
      if (userToUpdate.followingCount !== newFollowingCount || userToUpdate.followersCount !== newFollowersCount) {
        await User.findByIdAndUpdate(userToUpdate._id, {
          followingCount: newFollowingCount,
          followersCount: newFollowersCount
        });
        compteursCorrigés++;
      }
    }
    console.log(`   ${compteursCorrigés} compteurs d'abonnements corrigés`);

    // 4. Supprimer tous les posts de l'utilisateur
    console.log('🧹 Suppression des posts de l\'utilisateur...');
    const userPosts = await Post.find({ authorId: userId }).select('_id');
    const userPostIds = userPosts.map(post => post._id);
    const userPostsDeleted = await Post.deleteMany({ authorId: userId });
    console.log(`   ${userPostsDeleted.deletedCount} posts supprimés`);

    // 5. Nettoyer les posts sauvegardés par d'autres utilisateurs
    console.log('🧹 Nettoyage des posts sauvegardés...');
    const savedPostsCleanup = await User.updateMany(
      { 'savedPosts.postId': { $in: userPostIds } },
      { $pull: { savedPosts: { postId: { $in: userPostIds } } } }
    );
    console.log(`   ${savedPostsCleanup.modifiedCount} utilisateurs ont eu leurs posts sauvegardés nettoyés`);

    // 6. Nettoyer les messages qui référencent les posts supprimés
    console.log('🧹 Nettoyage des messages avec posts partagés supprimés...');
    const messagesCleanup = await Message.deleteMany({
      'sharedPost._id': { $in: userPostIds }
    });
    console.log(`   ${messagesCleanup.deletedCount} messages avec posts partagés supprimés`);

    // 7. VRAIE SUPPRESSION de l'utilisateur (pas de soft delete)
    console.log('🧹 Suppression définitive de l\'utilisateur...');
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    console.log('✅ Suppression définitive terminée avec nettoyage complet');
    
    // 8. Nettoyer le cache des posts pour éviter les références orphelines
    console.log('🧹 Nettoyage du cache des posts...');
    postCache.flushAll();
    console.log('   Cache vidé');
    
    res.json({ 
      success: true, 
      message: 'Compte supprimé définitivement avec succès',
      cleanupStats: {
        postsLikesRemoved: likesCleanupResult.modifiedCount,
        commentsLikesRemoved: commentsUpdated,
        followingRelationsRemoved: followingCleanup.modifiedCount,
        followersRelationsRemoved: followersCleanup.modifiedCount,
        subscriptionCountersFixed: compteursCorrigés,
        userPostsDeleted: userPostsDeleted.deletedCount,
        savedPostsCleanedUp: savedPostsCleanup.modifiedCount,
        messagesWithSharedPostsDeleted: messagesCleanup.deletedCount
      }
    });
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du compte' });
  }
};

// Récupérer les paramètres de notifications de l'utilisateur
const getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationSettings').lean();
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Valeurs par défaut si pas encore définies
    const defaultSettings = {
      messages: true,
      friendRequests: true,
      newPosts: false,
      email: true
    };

    const settings = user.notificationSettings || defaultSettings;
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Erreur getNotificationSettings:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des paramètres' });
  }
};

// Mettre à jour les paramètres de notifications
const updateNotificationSettings = async (req, res) => {
  try {
    const { messages, friendRequests, newPosts, email } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'notificationSettings.messages': messages,
          'notificationSettings.friendRequests': friendRequests,
          'notificationSettings.newPosts': newPosts,
          'notificationSettings.email': email
        }
      },
      { new: true }
    ).select('notificationSettings').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    res.json({ success: true, settings: user.notificationSettings });
  } catch (error) {
    console.error('Erreur updateNotificationSettings:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des paramètres' });
  }
};

// Rechercher des utilisateurs par nom, prénom, nom d'utilisateur ou université
const searchUsers = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, 'i'); // Recherche insensible à la casse
    
    // Critères de recherche
    const searchCriteria = {
      isDeleted: { $ne: true },
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { username: searchRegex },
        { university: searchRegex },
        // Recherche par nom complet
        { $expr: { $regexMatch: { input: { $concat: ['$firstName', ' ', '$lastName'] }, regex: searchTerm, options: 'i' } } }
      ]
    };
    
    const users = await User.find(searchCriteria, '-password -refreshToken')
      .select('username firstName lastName profilePicture university createdAt isActive role followersCount')
      .lean()
      .limit(parseInt(limit))
      .sort({ followersCount: -1, createdAt: -1 }); // Trier par popularité puis par date
    
    const normalizedUsers = users.map(user => ({ ...user, id: user._id.toString() }));
    res.json({ success: true, data: normalizedUsers });
  } catch (error) {
    console.error('Erreur searchUsers:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la recherche d\'utilisateurs' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  getUserByUsername,
  getSavedPosts,
  getRecentEmojis,
  updateRecentEmojis,
  getUserStats,
  deleteUser,
  getNotificationSettings,
  updateNotificationSettings,
  searchUsers
};
