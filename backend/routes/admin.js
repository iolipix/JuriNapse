const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { authenticateToken } = require('../middleware/auth.middleware');

// Middleware pour vérifier que l'utilisateur est administrateur
const adminAuth = (req, res, next) => {
  // Vérifier avec le nouveau système de rôles string
  const userRoles = req.user.role ? req.user.role.split(';').map(r => r.trim()) : [];
  const hasAdminRole = userRoles.includes('administrator');
  
  if (!hasAdminRole) {
    return res.status(403).json({ message: 'Accès refusé. Permissions administrateur requises.' });
  }
  next();
};

// GET /api/admin/moderators - Récupérer la liste des modérateurs
router.get('/moderators', authenticateToken, adminAuth, async (req, res) => {
  try {
    // Chercher tous les utilisateurs qui ont le rôle modérateur dans le string role
    const moderators = await User.find({
      role: { $regex: 'moderator', $options: 'i' }
    })
      .select('username firstName lastName email profilePicture role createdAt')
      .sort({ createdAt: -1 });

    res.json({ moderators });
  } catch (error) {
    console.error('Erreur lors de la récupération des modérateurs:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des modérateurs' });
  }
});

// GET /api/admin/search-users - Rechercher des utilisateurs
router.get('/search-users', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { q } = req.query;
    
    console.log('🔍 Recherche admin - Query:', q);
    
    if (!q || q.trim().length < 2) {
      return res.json({ users: [] });
    }

    const searchQuery = q.trim();
    
    console.log('🔍 DEBUG - Recherche:', searchQuery);
    
    // Recherche par nom d'utilisateur, prénom, nom ou email
    // Exclure seulement les utilisateurs qui ont déjà le rôle modérateur
    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: searchQuery, $options: 'i' } },
            { firstName: { $regex: searchQuery, $options: 'i' } },
            { lastName: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } }
          ]
        },
        // Exclure ceux qui ont déjà le rôle modérateur dans le string role
        {
          role: { $not: { $regex: 'moderator', $options: 'i' } }
        }
      ]
    })
    .select('username firstName lastName email profilePicture role')
    .limit(20) // Limiter les résultats
    .sort({ username: 1 });

    console.log('🎯 Résultats recherche:', users.length, 'utilisateurs trouvés');
    if (users.length > 0) {
      console.log('🔍 Premier utilisateur exemple:', {
        username: users[0].username,
        role: users[0].role
      });
    }
    
    res.json({ users });
  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la recherche' });
  }
});

// POST /api/admin/promote-moderator/:userId - Promouvoir un utilisateur en modérateur
router.post('/promote-moderator/:userId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que l'utilisateur n'est pas déjà modérateur
    if (userHasRole(user, 'moderator')) {
      return res.status(400).json({ 
        message: `Cet utilisateur est déjà modérateur` 
      });
    }

    // Ajouter le rôle modérateur (sans supprimer les autres rôles)
    if (user.addRole) {
      user.addRole('moderator');
    } else {
      addRoleToUser(user, 'moderator');
    }
    
    await user.save();

    // Log de l'action
    console.log(`[ADMIN] ${req.user.username} a promu ${user.username} au rang de modérateur`);

    res.json({ 
      message: `${user.username} a été promu modérateur avec succès`,
      user: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la promotion:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la promotion' });
  }
});

// POST /api/admin/demote-moderator/:userId - Rétrograder un modérateur
router.post('/demote-moderator/:userId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que l'utilisateur est bien modérateur
    if (!userHasRole(user, 'moderator')) {
      return res.status(400).json({ 
        message: `Cet utilisateur n'est pas modérateur` 
      });
    }

    // Empêcher un admin de se retirer son propre rôle d'administrateur
    // MAIS permettre de se retirer le rôle de modérateur même si on est admin
    // Cette route retire SEULEMENT le rôle modérateur, jamais le rôle admin
    // Donc on peut toujours procéder, l'admin sera préservé dans la logique ci-dessous

    // Retirer le rôle modérateur (garder les autres rôles)
    removeRoleFromUser(user, 'moderator');
    
    await user.save();

    // Log de l'action
    console.log(`[ADMIN] ${req.user.username} a rétrogradé ${user.username} du rang de modérateur`);

    res.json({ 
      message: `${user.username} a été rétrogradé du rang de modérateur`,
      user: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la rétrogradation:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la rétrogradation' });
  }
});

// Fonction helper pour parser les rôles depuis une string
const parseRoles = (roleString) => {
  if (!roleString) return ['user'];
  const roles = roleString.split(';').map(r => r.trim()).filter(Boolean);
  
  // S'assurer que 'user' est toujours présent
  if (!roles.includes('user')) {
    roles.unshift('user');
  }
  
  return roles;
};

// Fonction helper pour sérialiser les rôles en string
const serializeRoles = (rolesArray) => {
  if (!rolesArray || rolesArray.length === 0) return 'user';
  const uniqueRoles = [...new Set(rolesArray)];
  const roleOrder = ['user', 'premium', 'moderator', 'administrator'];
  const orderedRoles = roleOrder.filter(role => uniqueRoles.includes(role));
  return orderedRoles.join(';');
};

// Fonction helper pour vérifier si un utilisateur a un rôle
const userHasRole = (user, targetRole) => {
  const userRoles = parseRoles(user.role);
  return userRoles.includes(targetRole);
};

// Fonction helper pour ajouter un rôle de manière cohérente
const addRoleToUser = (user, newRole) => {
  // Parser les rôles existants
  let currentRoles = parseRoles(user.role);
  
  // S'assurer que 'user' est toujours présent
  if (!currentRoles.includes('user')) {
    currentRoles.unshift('user');
  }
  
  // Ajouter le nouveau rôle s'il n'est pas déjà présent
  if (!currentRoles.includes(newRole)) {
    currentRoles.push(newRole);
  }
  
  // Sérialiser en string avec l'ordre correct
  user.role = serializeRoles(currentRoles);
  
  // Nettoyer l'ancien champ roles s'il existe
  if (user.roles) {
    delete user.roles;
  }
};

// Fonction helper pour retirer un rôle de manière cohérente
const removeRoleFromUser = (user, roleToRemove) => {
  // Parser les rôles existants
  let currentRoles = parseRoles(user.role);
  
  // Retirer le rôle spécifié
  currentRoles = currentRoles.filter(r => r !== roleToRemove);
  
  // S'assurer que 'user' est toujours présent
  if (!currentRoles.includes('user')) {
    currentRoles.unshift('user');
  }
  
  // Sérialiser en string avec l'ordre correct
  user.role = serializeRoles(currentRoles);
  
  // Nettoyer l'ancien champ roles s'il existe
  if (user.roles) {
    delete user.roles;
  }
};

// POST /api/admin/promote-premium/:userId - Promouvoir un utilisateur en premium
router.post('/promote-premium/:userId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (userHasRole(user, 'premium')) {
      return res.status(400).json({ 
        message: `Cet utilisateur est déjà premium` 
      });
    }

    addRoleToUser(user, 'premium');
    await user.save();

    console.log(`[ADMIN] ${req.user.username} a promu ${user.username} au rang premium`);

    res.json({ 
      message: `${user.username} a été promu premium avec succès`,
      user: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la promotion premium:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la promotion premium' });
  }
});

// POST /api/admin/demote-premium/:userId - Rétrograder un utilisateur premium
router.post('/demote-premium/:userId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (!userHasRole(user, 'premium')) {
      return res.status(400).json({ 
        message: `Cet utilisateur n'est pas premium` 
      });
    }

    removeRoleFromUser(user, 'premium');
    await user.save();

    console.log(`[ADMIN] ${req.user.username} a rétrogradé ${user.username} du rang premium`);

    res.json({ 
      message: `${user.username} a été rétrogradé du rang premium`,
      user: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la rétrogradation premium:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la rétrogradation premium' });
  }
});

// POST /api/admin/promote-administrator/:userId - Promouvoir un utilisateur en administrateur
router.post('/promote-administrator/:userId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (userHasRole(user, 'administrator')) {
      return res.status(400).json({ 
        message: `Cet utilisateur est déjà administrateur` 
      });
    }

    addRoleToUser(user, 'administrator');
    await user.save();

    console.log(`[ADMIN] ${req.user.username} a promu ${user.username} au rang d'administrateur`);

    res.json({ 
      message: `${user.username} a été promu administrateur avec succès`,
      user: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la promotion administrateur:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la promotion administrateur' });
  }
});

// POST /api/admin/demote-administrator/:userId - Rétrograder un administrateur
router.post('/demote-administrator/:userId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (!userHasRole(user, 'administrator')) {
      return res.status(400).json({ 
        message: `Cet utilisateur n'est pas administrateur` 
      });
    }

    // Empêcher qu'un admin se retire ses propres droits d'administrateur
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ 
        message: 'Vous ne pouvez pas vous retirer votre propre rôle d\'administrateur' 
      });
    }

    removeRoleFromUser(user, 'administrator');
    await user.save();

    console.log(`[ADMIN] ${req.user.username} a rétrogradé ${user.username} du rang d'administrateur`);

    res.json({ 
      message: `${user.username} a été rétrogradé du rang d'administrateur`,
      user: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la rétrogradation administrateur:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la rétrogradation administrateur' });
  }
});

// === NOUVELLES ROUTES POUR GESTION PREMIUM ET RECHERCHE UTILISATEURS ===

// Middleware pour vérifier que l'utilisateur est modérateur ou admin
const moderatorAuth = (req, res, next) => {
  const userRoles = req.user.role ? req.user.role.split(';').map(r => r.trim()) : [];
  const hasModeratorRole = userRoles.includes('moderator') || userRoles.includes('administrator');
  
  if (!hasModeratorRole) {
    return res.status(403).json({ message: 'Accès refusé. Permissions modérateur requises.' });
  }
  next();
};

// Route pour obtenir tous les utilisateurs avec recherche (pour autocomplete)
router.get('/users', authenticateToken, moderatorAuth, async (req, res) => {
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
      .exec();

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs' });
  }
});

// Route pour obtenir la liste des utilisateurs premium
router.get('/premium-users', authenticateToken, moderatorAuth, async (req, res) => {
  try {
    const premiumUsers = await User.find({
      $or: [
        { premiumExpiresAt: { $exists: true, $ne: null } },
        { premiumExpiresAt: { $gt: new Date() } }
      ]
    })
      .select('username email firstName lastName premiumExpiresAt premiumGrantedBy premiumGrantedAt')
      .sort({ premiumGrantedAt: -1 })
      .exec();

    // Enrichir avec les informations du modérateur qui a accordé le premium
    const enrichedUsers = await Promise.all(
      premiumUsers.map(async (user) => {
        let grantedByUsername = 'Système';
        if (user.premiumGrantedBy) {
          try {
            const grantor = await User.findById(user.premiumGrantedBy).select('username');
            if (grantor) {
              grantedByUsername = grantor.username;
            }
          } catch (e) {
            console.log('Utilisateur qui a accordé le premium introuvable:', user.premiumGrantedBy);
          }
        }

        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          premiumExpiresAt: user.premiumExpiresAt,
          premiumGrantedBy: grantedByUsername,
          premiumGrantedAt: user.premiumGrantedAt,
          isExpired: user.premiumExpiresAt && user.premiumExpiresAt < new Date()
        };
      })
    );

    res.json({ premiumUsers: enrichedUsers });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs premium:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs premium' });
  }
});

// Route pour attribuer un premium temporaire
router.post('/grant-premium', authenticateToken, moderatorAuth, async (req, res) => {
  try {
    const { userId, expiresAt } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'ID utilisateur requis' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Utiliser la date d'expiration fournie ou null pour permanent
    let premiumExpiresAt = null;
    if (expiresAt) {
      premiumExpiresAt = new Date(expiresAt);
      // Vérifier que la date est dans le futur
      if (premiumExpiresAt <= new Date()) {
        return res.status(400).json({ message: 'La date d\'expiration doit être dans le futur' });
      }
    }

    // Ajouter le rôle premium si pas déjà présent
    if (!user.hasRole('premium')) {
      user.addRole('premium');
    }

    // Mettre à jour l'utilisateur
    user.premiumExpiresAt = premiumExpiresAt;
    user.premiumGrantedBy = req.user.id;
    user.premiumGrantedAt = new Date();
    
    await user.save();

    res.json({
      message: `Premium ${premiumExpiresAt ? 'temporaire' : 'permanent'} accordé avec succès`,
      user: {
        _id: user._id,
        username: user.username,
        premiumExpiresAt: user.premiumExpiresAt,
        premiumGrantedBy: req.user.username,
        premiumGrantedAt: user.premiumGrantedAt,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'attribution du premium:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'attribution du premium' });
  }
});

// Route pour révoquer le premium d'un utilisateur
router.delete('/revoke-premium/:userId', authenticateToken, moderatorAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Supprimer le rôle premium
    if (user.hasRole('premium')) {
      user.removeRole('premium');
    }

    // Révoquer le premium
    user.premiumExpiresAt = null;
    user.premiumGrantedBy = null;
    user.premiumGrantedAt = null;
    
    await user.save();

    res.json({
      message: 'Premium révoqué avec succès',
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la révocation du premium:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la révocation du premium' });
  }
});

// Route pour nettoyer manuellement les premiums expirés (admin uniquement)
router.post('/cleanup-expired-premiums', authenticateToken, adminAuth, async (req, res) => {
  try {
    const result = await User.cleanupExpiredPremiums();

    res.json({
      message: 'Nettoyage des premiums expirés terminé',
      deletedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Erreur lors du nettoyage des premiums expirés:', error);
    res.status(500).json({ message: 'Erreur serveur lors du nettoyage' });
  }
});

module.exports = router;
