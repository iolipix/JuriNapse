const User = require('../models/user.model');
const { replaceDeletedUserInfo, isUserNotFound } = require('../utils/deletedUserHelper');

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
  // ...implémentation existante...
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
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    // Marquer l'utilisateur comme supprimé au lieu de le supprimer physiquement
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: true,
        deletedAt: new Date(),
        // Optionnel : vider les champs sensibles
        email: `deleted_${userId}@deleted.local`,
        profilePicture: null,
        bio: '',
        website: '',
        location: ''
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    res.json({ success: true, message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du compte' });
  }
};

// Récupérer les paramètres de notifications de l'utilisateur
const getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('notificationSettings').lean();
    
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
      req.userId,
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
  updateNotificationSettings
};
