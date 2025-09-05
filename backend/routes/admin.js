const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { authenticateToken } = require('../middleware/auth.middleware');

// Middleware pour vérifier que l'utilisateur est administrateur
const adminAuth = (req, res, next) => {
  // Vérifier avec le nouveau système de rôles multiples
  const hasAdminRole = req.user.roles && req.user.roles.includes('administrator');
  // Maintenir la compatibilité avec l'ancien système
  const isAdminLegacy = req.user.role === 'administrator';
  
  if (!hasAdminRole && !isAdminLegacy) {
    return res.status(403).json({ message: 'Accès refusé. Permissions administrateur requises.' });
  }
  next();
};

// GET /api/admin/moderators - Récupérer la liste des modérateurs
router.get('/moderators', authenticateToken, adminAuth, async (req, res) => {
  try {
    // Chercher tous les utilisateurs qui ont le rôle modérateur (nouveau système ou ancien)
    const moderators = await User.find({
      $or: [
        { roles: 'moderator' }, // Nouveau système de rôles multiples
        { role: 'moderator' }   // Ancien système pour compatibilité
      ]
    })
      .select('username firstName lastName email profilePicture role roles createdAt')
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
        // Exclure seulement ceux qui ont déjà le rôle modérateur
        {
          $and: [
            // Nouveau système : pas de moderator dans roles OU roles n'existe pas
            {
              $or: [
                { roles: { $exists: false } },
                { roles: { $nin: ['moderator'] } }
              ]
            },
            // Ancien système : rôle différent de moderator
            { role: { $ne: 'moderator' } }
          ]
        }
      ]
    })
    .select('username firstName lastName email profilePicture role roles')
    .limit(20) // Limiter les résultats
    .sort({ username: 1 });

    console.log('🎯 Résultats recherche:', users.length, 'utilisateurs trouvés');
    if (users.length > 0) {
      console.log('🔍 Premier utilisateur exemple:', {
        username: users[0].username,
        role: users[0].role,
        roles: users[0].roles
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
    if (user.hasRole && user.hasRole('moderator')) {
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
        role: user.role,
        roles: user.roles
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
    const isModerator = user.hasRole ? user.hasRole('moderator') : user.role === 'moderator';
    if (!isModerator) {
      return res.status(400).json({ 
        message: `Cet utilisateur n'est pas modérateur` 
      });
    }

    // Empêcher un admin de se retirer son propre rôle d'administrateur
    // MAIS permettre de se retirer le rôle de modérateur même si on est admin
    // Cette route retire SEULEMENT le rôle modérateur, jamais le rôle admin
    // Donc on peut toujours procéder, l'admin sera préservé dans la logique ci-dessous

    // Retirer le rôle modérateur (garder les autres rôles)
    if (user.removeRole) {
      user.removeRole('moderator');
    } else {
      removeRoleFromUser(user, 'moderator');
    }
    
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
        role: user.role,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Erreur lors de la rétrogradation:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la rétrogradation' });
  }
});

// Fonction helper pour ajouter un rôle de manière cohérente
const addRoleToUser = (user, newRole) => {
  // Initialiser le système de rôles multiples si nécessaire
  if (!user.roles) {
    user.roles = ['user'];
    if (user.role && user.role !== 'user' && !user.roles.includes(user.role)) {
      user.roles.push(user.role);
    }
  }
  
  // S'assurer que 'user' est toujours présent
  if (!user.roles.includes('user')) {
    user.roles.unshift('user');
  }
  
  // Ajouter le nouveau rôle s'il n'est pas déjà présent
  if (!user.roles.includes(newRole)) {
    user.roles.push(newRole);
  }
  
  // Maintenir l'ordre logique des rôles: [user, premium, moderator, administrator]
  const roleOrder = ['user', 'premium', 'moderator', 'administrator'];
  user.roles = roleOrder.filter(role => user.roles.includes(role));
  
  // Déterminer le rôle principal (le plus élevé dans la hiérarchie)
  if (user.roles.includes('administrator')) {
    user.role = 'administrator';
  } else if (user.roles.includes('moderator')) {
    user.role = 'moderator';
  } else if (user.roles.includes('premium')) {
    user.role = 'premium';
  } else {
    user.role = 'user';
  }
};

// Fonction helper pour retirer un rôle de manière cohérente
const removeRoleFromUser = (user, roleToRemove) => {
  if (user.roles) {
    user.roles = user.roles.filter(r => r !== roleToRemove);
    
    // S'assurer que 'user' est toujours présent
    if (!user.roles.includes('user')) {
      user.roles.unshift('user');
    }
    
    // Maintenir l'ordre logique des rôles: [user, premium, moderator, administrator]
    const roleOrder = ['user', 'premium', 'moderator', 'administrator'];
    user.roles = roleOrder.filter(role => user.roles.includes(role));
    
    // Recalculer le rôle principal (le plus élevé dans la hiérarchie)
    if (user.roles.includes('administrator')) {
      user.role = 'administrator';
    } else if (user.roles.includes('moderator')) {
      user.role = 'moderator';
    } else if (user.roles.includes('premium')) {
      user.role = 'premium';
    } else {
      user.role = 'user';
    }
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

    if (user.hasRole && user.hasRole('premium')) {
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
        role: user.role,
        roles: user.roles
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

    const isPremium = user.hasRole ? user.hasRole('premium') : user.role === 'premium';
    if (!isPremium) {
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
        role: user.role,
        roles: user.roles
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

    if (user.hasRole && user.hasRole('administrator')) {
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
        role: user.role,
        roles: user.roles
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

    const isAdmin = user.hasRole ? user.hasRole('administrator') : user.role === 'administrator';
    if (!isAdmin) {
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
        role: user.role,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Erreur lors de la rétrogradation administrateur:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la rétrogradation administrateur' });
  }
});

module.exports = router;
