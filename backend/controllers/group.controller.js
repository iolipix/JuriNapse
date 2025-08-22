const Group = require('../models/group.model');
const User = require('../models/user.model');

// Récupérer tous les groupes de l'utilisateur
exports.getAllGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Étape 1: Récupérer tous les groupes de l'utilisateur (masqués ou non)
    const allUserGroups = await Group.find({
      $or: [
        { members: userId },
        { adminId: userId }
      ]
    }).populate('members', 'username firstName lastName profilePicture university isStudent email createdAt')
    .populate('adminId', 'username firstName lastName profilePicture')
    .populate('moderatorIds', 'username firstName lastName')
    .sort({ updatedAt: -1 });

    // Étape 2: Filtrer selon la logique des messages cachés
    const Message = require('../models/message.model');
    const visibleGroups = [];

    for (const group of allUserGroups) {
      const isHidden = group.hiddenFor && group.hiddenFor.includes(userId);
      
      if (!isHidden) {
        // Groupe non masqué → toujours visible
        visibleGroups.push(group);
      } else {
        // Groupe masqué → vérifier s'il y a de nouveaux messages
        const hiddenInfo = group.hiddenForWithTimestamp.find(
          h => h.userId.toString() === userId.toString()
        );
        
        if (hiddenInfo) {
          const hasNewMessages = await Message.exists({
            groupId: group._id,
            createdAt: { $gt: hiddenInfo.hiddenAt }
          });
          
          if (hasNewMessages) {
            // Il y a de nouveaux messages → groupe visible
            visibleGroups.push(group);
          }
        }
      }
    }

    res.json({
      success: true,
      data: visibleGroups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des groupes'
    });
  }
};

// Créer un nouveau groupe
exports.createGroup = async (req, res) => {
  try {
    const { name, description, isPrivate = false, selectedMembers = [] } = req.body;
    const adminId = req.user.id;

    // Vérifier que le nom n'est pas vide
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du groupe est requis'
      });
    }

    // Créer le groupe avec l'admin comme premier membre
    const members = [adminId, ...selectedMembers.filter(id => id !== adminId)];

    const group = new Group({
      name: name.trim(),
      description: description?.trim() || '',
      adminId,
      members,
      isPrivate,
      moderatorIds: []
    });

    await group.save();

    // Populer les données pour la réponse
    await group.populate('members', 'username firstName lastName university isStudent');
    await group.populate('adminId', 'username firstName lastName');
    await group.populate('moderatorIds', 'username firstName lastName');

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du groupe'
    });
  }
};

// Récupérer un groupe spécifique
exports.getGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: id,
      members: userId
    })
    .populate('members', 'username firstName lastName profilePicture university isStudent')
    .populate('adminId', 'username firstName lastName profilePicture')
    .populate('moderatorIds', 'username firstName lastName profilePicture');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du groupe'
    });
  }
};

// Mettre à jour un groupe
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: id,
      $or: [
        { adminId: userId },
        { moderatorIds: userId }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé ou permissions insuffisantes'
      });
    }

    // Vérifier que l'utilisateur actuel est admin ou modérateur
    const isAdmin = group.adminId.toString() === userId;
    const isModerator = group.moderatorIds.includes(userId);
    
    if (!isAdmin && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs et modérateurs peuvent modifier le groupe'
      });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();

    await group.save();

    await group.populate('members', 'username firstName lastName profilePicture university isStudent');
    await group.populate('adminId', 'username firstName lastName profilePicture');
    await group.populate('moderatorIds', 'username firstName lastName profilePicture');

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du groupe'
    });
  }
};

// Supprimer un groupe
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: id,
      adminId: userId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé ou permissions insuffisantes'
      });
    }

    await Group.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Groupe supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du groupe'
    });
  }
};

// Ajouter un membre
exports.addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: newUserId } = req.body;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: id,
      $or: [
        { adminId: userId },
        { moderatorIds: userId }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé ou permissions insuffisantes'
      });
    }

    // Vérifier si l'utilisateur est déjà membre
    if (group.members.includes(newUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur est déjà membre du groupe'
      });
    }

    group.members.push(newUserId);
    await group.save();

    await group.populate('members', 'username firstName lastName profilePicture university isStudent');
    await group.populate('adminId', 'username firstName lastName profilePicture');
    await group.populate('moderatorIds', 'username firstName lastName profilePicture');

    // Récupérer les informations de l'utilisateur ajouté
    const addedUser = await User.findById(newUserId).select("username email profilePicture createdAt isActive role").lean();
    
    // Créer un message système pour notifier l'ajout
    const Message = require('../models/message.model');
    const systemMessage = new Message({
      content: `${addedUser.username} a rejoint le groupe.`,
      authorId: userId,
      groupId: id,
      isSystemMessage: true
    });
    await systemMessage.save();
    await systemMessage.populate('authorId', 'username firstName lastName profilePicture university isStudent joinedAt');

    // Notifier via Socket.io
    const io = req.io;
    if (io) {
      io.to(id).emit('memberAdded', {
        groupId: id,
        userId: newUserId,
        addedBy: userId,
        message: systemMessage
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du membre'
    });
  }
};

// Retirer un membre
exports.removeMember = async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: id,
      $or: [
        { adminId: userId },
        { moderatorIds: userId }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé ou permissions insuffisantes'
      });
    }

    // Ne pas permettre de retirer l'admin
    if (group.adminId.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de retirer l\'administrateur du groupe'
      });
    }

    // Récupérer les informations de l'utilisateur retiré avant de le supprimer
    const removedUser = await User.findById(targetUserId).select("username email profilePicture createdAt isActive role").lean();

    group.members = group.members.filter(memberId => memberId.toString() !== targetUserId);
    group.moderatorIds = group.moderatorIds.filter(modId => modId.toString() !== targetUserId);
    
    await group.save();

    await group.populate('members', 'username firstName lastName profilePicture university isStudent');
    await group.populate('adminId', 'username firstName lastName profilePicture');
    await group.populate('moderatorIds', 'username firstName lastName profilePicture');

    // Créer un message système pour notifier le retrait
    const Message = require('../models/message.model');
    const systemMessage = new Message({
      content: `${removedUser.username} a été retiré du groupe.`,
      authorId: userId,
      groupId: id,
      isSystemMessage: true
    });
    await systemMessage.save();
    await systemMessage.populate('authorId', 'username firstName lastName profilePicture university isStudent joinedAt');

    // Notifier via Socket.io
    const io = req.io;
    if (io) {
      io.to(id).emit('memberRemoved', {
        groupId: id,
        userId: targetUserId,
        removedBy: userId,
        message: systemMessage
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du membre'
    });
  }
};

// Quitter un groupe
exports.leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    // L'admin ne peut pas quitter le groupe, il doit le supprimer
    if (group.adminId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'En tant qu\'administrateur, vous devez supprimer le groupe'
      });
    }

    // Récupérer les informations de l'utilisateur qui quitte
    const leavingUser = await User.findById(userId).select("username email profilePicture createdAt isActive role").lean();

    group.members = group.members.filter(memberId => memberId.toString() !== userId);
    group.moderatorIds = group.moderatorIds.filter(modId => modId.toString() !== userId);
    
    await group.save();

    // Créer un message système pour notifier le départ
    const Message = require('../models/message.model');
    const systemMessage = new Message({
      content: `${leavingUser.username} a quitté le groupe.`,
      authorId: userId,
      groupId: id,
      isSystemMessage: true
    });
    await systemMessage.save();
    await systemMessage.populate('authorId', 'username firstName lastName profilePicture university isStudent joinedAt');

    // Notifier via Socket.io
    const io = req.io;
    if (io) {
      io.to(id).emit('memberLeft', {
        groupId: id,
        userId: userId,
        message: systemMessage
      });
    }

    res.json({
      success: true,
      message: 'Vous avez quitté le groupe avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sortie du groupe'
    });
  }
};

// Basculer les notifications
exports.toggleNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: id,
      members: userId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    group.notificationsEnabled.set(userId, enabled);
    await group.save();

    res.json({
      success: true,
      message: `Notifications ${enabled ? 'activées' : 'désactivées'} pour ce groupe`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification des notifications'
    });
  }
};

// Masquer un groupe
exports.hideGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: id,
      members: userId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    // Ne permettre le masquage QUE pour les conversations privées
    if (!group.isPrivate) {
      return res.status(400).json({
        success: false,
        message: 'Les groupes publics ne peuvent pas être masqués'
      });
    }

    if (!group.hiddenFor.includes(userId)) {
      group.hiddenFor.push(userId);
    }
    
    // Ajouter ou mettre à jour le timestamp de masquage UNIQUEMENT pour les conversations privées
    const existingHidden = group.hiddenForWithTimestamp.find(h => h.userId.toString() === userId.toString());
    if (existingHidden) {
      existingHidden.hiddenAt = new Date();
    } else {
      group.hiddenForWithTimestamp.push({
        userId: userId,
        hiddenAt: new Date()
      });
    }
    
    await group.save();

    res.json({
      success: true,
      message: 'Groupe masqué avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du masquage du groupe'
    });
  }
};

// Afficher un groupe
exports.showGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: id,
      members: userId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    group.hiddenFor = group.hiddenFor.filter(hiddenUserId => hiddenUserId.toString() !== userId);
    await group.save();

    res.json({
      success: true,
      message: 'Groupe affiché avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'affichage du groupe'
    });
  }
};

// Supprimer l'historique d'une conversation pour un utilisateur
exports.deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: id,
      members: userId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    // Ne permettre la suppression d'historique QUE pour les conversations privées
    if (!group.isPrivate) {
      return res.status(400).json({
        success: false,
        message: 'La suppression d\'historique n\'est disponible que pour les conversations privées'
      });
    }

    // Ajouter ou mettre à jour le timestamp de suppression d'historique
    // Différent de hiddenForWithTimestamp - ici on garde la conversation visible
    if (!group.historyDeletedFor) {
      group.historyDeletedFor = [];
    }
    
    const deletedAt = new Date();
    const existingEntry = group.historyDeletedFor.find(h => h.userId.toString() === userId.toString());
    if (existingEntry) {
      existingEntry.deletedAt = deletedAt;
    } else {
      group.historyDeletedFor.push({
        userId: userId,
        deletedAt: deletedAt
      });
    }
    
    await group.save();

    res.json({
      success: true,
      message: 'Historique supprimé avec succès',
      data: {
        deletedAt: deletedAt.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'historique'
    });
  }
};

// Promouvoir un membre en modérateur (admin seulement)
exports.promoteModerator = async (req, res) => {
  try {
    const { id } = req.params; // group ID
    const { userId } = req.body; // user to promote
    const adminId = req.user.id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    // Vérifier que l'utilisateur actuel est admin
    if (group.adminId.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Seul l\'administrateur peut nommer des modérateurs'
      });
    }

    // Vérifier que l'utilisateur à promouvoir est membre du groupe
    if (!group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'L\'utilisateur doit être membre du groupe'
      });
    }

    // Vérifier que l'utilisateur n'est pas déjà modérateur
    if (group.moderatorIds.map(id => id.toString()).includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'L\'utilisateur est déjà modérateur'
      });
    }

    // Vérifier que l'utilisateur n'est pas l'admin
    if (group.adminId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'L\'administrateur ne peut pas être modérateur'
      });
    }

    group.moderatorIds.push(userId);
    await group.save();

    // Populer les données du groupe avec tous les détails
    await group.populate('members', 'username firstName lastName profilePicture university isStudent');
    await group.populate('adminId', 'username firstName lastName profilePicture');
    await group.populate('moderatorIds', 'username firstName lastName profilePicture');

    // Récupérer les informations de l'utilisateur promu
    const promotedUser = await User.findById(userId).select("username email profilePicture createdAt isActive role").lean();
    
    // Créer un message système pour notifier la promotion
    const Message = require('../models/message.model');
    const systemMessage = new Message({
      content: `${promotedUser.username} a été promu modérateur du groupe.`,
      authorId: adminId,
      groupId: id,
      isSystemMessage: true
    });
    await systemMessage.save();
    await systemMessage.populate('authorId', 'username firstName lastName profilePicture university isStudent joinedAt');

    // Notifier via Socket.io
    const io = req.io;
    if (io) {
      // Notifier tous les membres du groupe de la promotion avec SEULEMENT le message système
      io.to(id).emit('userPromoted', {
        groupId: id,
        userId: userId,
        promotedBy: adminId,
        message: systemMessage
        // PAS de groupData - laisser l'API HTTP gérer les mises à jour du groupe
      });
    }

    // Préparer les données pour la réponse avec structure cohérente
    const responseData = {
      ...group.toObject(),
      // Assurer que moderatorIds est un array mixte (objets populés ET IDs pour la compatibilité)
      moderatorIds: group.moderatorIds, // Garder les objets populés
      _moderatorIds: group.moderatorIds.map(mod => mod._id || mod) // Ajouter les IDs purs pour la compatibilité
    };

    res.json({
      success: true,
      message: 'Modérateur ajouté avec succès',
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la promotion du modérateur'
    });
  }
};

// Révoquer un modérateur (admin seulement)
exports.demoteModerator = async (req, res) => {
  try {
    const { id } = req.params; // group ID
    const { userId } = req.body; // user to demote
    const adminId = req.user.id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    // Vérifier que l'utilisateur actuel est admin
    if (group.adminId.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Seul l\'administrateur peut révoquer des modérateurs'
      });
    }

    // Vérifier que l'utilisateur est bien modérateur
    if (!group.moderatorIds.map(id => id.toString()).includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'L\'utilisateur n\'est pas modérateur'
      });
    }

    group.moderatorIds = group.moderatorIds.filter(id => id.toString() !== userId);
    await group.save();

    // Populer les données du groupe avec tous les détails
    await group.populate('members', 'username firstName lastName profilePicture university isStudent');
    await group.populate('adminId', 'username firstName lastName profilePicture');
    await group.populate('moderatorIds', 'username firstName lastName profilePicture');

    // Récupérer les informations de l'utilisateur rétrogradé
    const demotedUser = await User.findById(userId).select("username email profilePicture createdAt isActive role").lean();
    
    // Créer un message système pour notifier la rétrogradation
    const Message = require('../models/message.model');
    const systemMessage = new Message({
      content: `${demotedUser.username} n'est plus modérateur du groupe.`,
      authorId: adminId,
      groupId: id,
      isSystemMessage: true
    });
    await systemMessage.save();
    await systemMessage.populate('authorId', 'username firstName lastName profilePicture university isStudent joinedAt');

    // Notifier via Socket.io
    const io = req.io;
    if (io) {
      // Notifier tous les membres du groupe de la rétrogradation avec SEULEMENT le message système
      io.to(id).emit('userDemoted', {
        groupId: id,
        userId: userId,
        demotedBy: adminId,
        message: systemMessage
        // PAS de groupData - laisser l'API HTTP gérer les mises à jour du groupe
      });
    }

    // Préparer les données pour la réponse avec structure cohérente
    const responseData = {
      ...group.toObject(),
      // Assurer que moderatorIds est un array mixte (objets populés ET IDs pour la compatibilité)
      moderatorIds: group.moderatorIds, // Garder les objets populés
      _moderatorIds: group.moderatorIds.map(mod => mod._id || mod) // Ajouter les IDs purs pour la compatibilité
    };

    res.json({
      success: true,
      message: 'Modérateur révoqué avec succès',
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la révocation du modérateur'
    });
  }
};

// Exclure un membre du groupe (admin et modérateurs)
exports.kickMember = async (req, res) => {
  try {
    const { id } = req.params; // group ID
    const { userId } = req.body; // user to kick
    const currentUserId = req.user.id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    // Vérifier que l'utilisateur actuel est admin ou modérateur
    const isAdmin = group.adminId.toString() === currentUserId;
    const isModerator = group.moderatorIds.includes(currentUserId);
    
    if (!isAdmin && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs et modérateurs peuvent exclure des membres'
      });
    }

    // Vérifier que l'utilisateur à exclure est membre du groupe
    if (!group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'L\'utilisateur n\'est pas membre du groupe'
      });
    }

    // Un modérateur ne peut pas exclure l'admin ou d'autres modérateurs
    if (isModerator && !isAdmin) {
      if (group.adminId.toString() === userId) {
        return res.status(403).json({
          success: false,
          message: 'Un modérateur ne peut pas exclure l\'administrateur'
        });
      }
      if (group.moderatorIds.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Un modérateur ne peut pas exclure un autre modérateur'
        });
      }
    }

    // L'admin ne peut pas s'auto-exclure
    if (group.adminId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'L\'administrateur ne peut pas s\'auto-exclure'
      });
    }

    // Récupérer les informations de l'utilisateur exclu
    const kickedUser = await User.findById(userId).select("username email profilePicture createdAt isActive role").lean();

    // Retirer l'utilisateur des membres et modérateurs
    group.members = group.members.filter(id => id.toString() !== userId);
    group.moderatorIds = group.moderatorIds.filter(id => id.toString() !== userId);
    
    await group.save();

    await group.populate('members', 'username firstName lastName profilePicture');
    await group.populate('moderatorIds', 'username firstName lastName profilePicture');

    // Créer un message système pour notifier l'exclusion
    const Message = require('../models/message.model');
    const systemMessage = new Message({
      content: `${kickedUser.username} a été exclu du groupe.`,
      authorId: currentUserId,
      groupId: id,
      isSystemMessage: true
    });
    await systemMessage.save();
    await systemMessage.populate('authorId', 'username firstName lastName profilePicture university isStudent joinedAt');

    // Notifier via Socket.io
    const io = req.io;
    if (io) {
      io.to(id).emit('memberKicked', {
        groupId: id,
        userId: userId,
        kickedBy: currentUserId,
        message: systemMessage
      });
    }

    res.json({
      success: true,
      message: 'Membre exclu avec succès',
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'exclusion du membre'
    });
  }
};

// Mettre à jour l'image de profil du groupe (admin et modérateurs)
exports.updateGroupPicture = async (req, res) => {
  try {
    const ImageOptimizer = require('../utils/imageOptimizer');
    const { id } = req.params; // group ID
    const { profilePicture } = req.body;
    const currentUserId = req.user.id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    // Vérifier que l'utilisateur actuel est admin ou modérateur
    const isAdmin = group.adminId.toString() === currentUserId;
    const isModerator = group.moderatorIds.includes(currentUserId);
    
    if (!isAdmin && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs et modérateurs peuvent modifier l\'image du groupe'
      });
    }

    // 🚀 OPTIMISATION AUTOMATIQUE si l'image est fournie
    let optimizedProfilePicture = profilePicture;
    if (profilePicture && profilePicture.startsWith('data:image')) {
      optimizedProfilePicture = await ImageOptimizer.optimizeBase64Image(profilePicture, {
        width: 300, // Un peu plus grand pour les groupes
        height: 300,
        quality: 85
      });
    }

    group.profilePicture = optimizedProfilePicture || null;
    await group.save();

    res.json({
      success: true,
      message: 'Image du groupe mise à jour avec succès',
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'image du groupe'
    });
  }
};
