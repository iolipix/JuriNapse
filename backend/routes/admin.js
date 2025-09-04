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
      // Fallback pour compatibilité - initialiser le système de rôles multiples
      if (!user.roles) {
        // Initialiser avec le rôle actuel + user
        user.roles = user.role ? [user.role, 'user'] : ['user'];
      }
      
      // Ajouter moderator s'il n'est pas déjà présent
      if (!user.roles.includes('moderator')) {
        user.roles.push('moderator');
      }
      
      // Maintenir le rôle principal le plus élevé
      if (user.roles.includes('administrator')) {
        user.role = 'administrator'; // Garder admin comme rôle principal
      } else if (user.roles.includes('moderator')) {
        user.role = 'moderator';
      } else {
        user.role = 'user';
      }
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

    // Empêcher un admin de se rétrograder lui-même
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ 
        message: 'Vous ne pouvez pas vous rétrograder vous-même' 
      });
    }

    // Retirer le rôle modérateur (garder les autres rôles)
    if (user.removeRole) {
      user.removeRole('moderator');
    } else {
      // Fallback pour compatibilité
      if (user.roles) {
        user.roles = user.roles.filter(r => r !== 'moderator');
        if (user.roles.length === 0) user.roles = ['user'];
      }
      user.role = user.roles && user.roles.includes('administrator') ? 'administrator' : 'user';
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

// POST /api/admin/emergency-restore-theophane - Endpoint temporaire pour restaurer les rôles de Théophane
router.post('/emergency-restore-theophane', authenticateToken, async (req, res) => {
  try {
    console.log('🚨 EMERGENCY: Tentative de restauration des rôles pour Théophane');
    console.log('🔍 Utilisateur qui fait la demande:', req.user.username, req.user.id);

    // Trouver Théophane par username
    const theophane = await User.findOne({ username: 'theophane' });
    if (!theophane) {
      console.log('❌ Théophane non trouvé');
      return res.status(404).json({ message: 'Utilisateur Théophane non trouvé' });
    }

    console.log('👤 Théophane trouvé:', {
      id: theophane._id,
      username: theophane.username,
      currentRole: theophane.role,
      currentRoles: theophane.roles
    });

    // Restaurer tous les rôles
    theophane.roles = ['user', 'administrator', 'moderator', 'premium'];
    theophane.role = 'administrator'; // Rôle principal
    
    await theophane.save();

    console.log('✅ Rôles restaurés pour Théophane:', {
      newRole: theophane.role,
      newRoles: theophane.roles
    });

    res.json({ 
      message: 'Rôles restaurés avec succès pour Théophane',
      user: {
        _id: theophane._id,
        username: theophane.username,
        role: theophane.role,
        roles: theophane.roles
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la restauration d\'urgence:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la restauration' });
  }
});

module.exports = router;
