const Message = require('../models/message.model');
const Group = require('../models/group.model');
const User = require('../models/user.model');
const Post = require('../models/post.model');
const Reaction = require('../models/reaction.model');
const { replaceDeletedUserInfo, processMessages, processConversations, isUserNotFound } = require('../utils/deletedUserHelper');
const { enrichirMessagesAvecCorrection, middlewareMessagesOrphelins } = require('../middleware/orphanCleanup');

// Fonction utilitaire pour enrichir les messages avec les réactions
async function enrichMessagesWithReactions(messages) {
  if (!messages || messages.length === 0) return messages;
  
  const messageIds = messages.map(msg => msg._id);
  
  // Récupérer toutes les réactions pour ces messages
  const reactions = await Reaction.find({
    messageId: { $in: messageIds }
  }).populate({ path: 'userId', select: 'username firstName lastName profilePicture', options: { strictPopulate: false } });
  
  // Organiser les réactions par message
  const reactionsByMessage = {};
  reactions.forEach(reaction => {
    const messageId = reaction.messageId.toString();
    if (!reactionsByMessage[messageId]) {
      reactionsByMessage[messageId] = {};
    }
    
    const emoji = reaction.emoji;
    if (!reactionsByMessage[messageId][emoji]) {
      reactionsByMessage[messageId][emoji] = {
        users: [],
        count: 0
      };
    }
    
    reactionsByMessage[messageId][emoji].users.push(reaction.userId._id.toString());
    reactionsByMessage[messageId][emoji].count++;
  });
  
  // Enrichir chaque message avec ses réactions
  return messages.map(message => {
    const messageObj = message.toObject ? message.toObject() : message;
    const messageId = messageObj._id.toString();
    messageObj.reactions = reactionsByMessage[messageId] || {};
    return messageObj;
  });
}

// Récupérer les messages d'un groupe
exports.getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id; // Utiliser id (getter virtuel Mongoose)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Vérifier que l'utilisateur est membre du groupe
    const group = await Group.findOne({
      _id: groupId,
      members: userId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé ou accès refusé'
      });
    }

    // Vérifier si l'utilisateur a masqué cette conversation et quand
    const hiddenEntry = group.hiddenForWithTimestamp?.find(h => h.userId.toString() === userId.toString());
    const hiddenAt = hiddenEntry ? hiddenEntry.hiddenAt : null;
    
    // Vérifier si l'utilisateur a supprimé l'historique de cette conversation
    const historyDeletedEntry = group.historyDeletedFor?.find(h => h.userId.toString() === userId.toString());
    const historyDeletedAt = historyDeletedEntry ? historyDeletedEntry.deletedAt : null;
    
    // 🐛 DEBUG: Ajouter des logs pour le diagnostic
    console.log(`   Utilisateur: ${userId}`);
    console.log(`   Page: ${page}, Limit: ${limit}`);
    console.log(`   hiddenEntry: ${hiddenEntry ? 'OUI' : 'NON'}`);
    console.log(`   hiddenAt: ${hiddenAt}`);
    console.log(`   historyDeletedEntry: ${historyDeletedEntry ? 'OUI' : 'NON'}`);
    console.log(`   historyDeletedAt: ${historyDeletedAt}`);
    
    // Construire la query pour filtrer les messages
    let messageQuery = { groupId };
    if (hiddenAt) {
      // Si l'utilisateur a masqué la conversation, ne montrer que les messages postérieurs
      messageQuery.createdAt = { $gt: hiddenAt };
    } else if (historyDeletedAt) {
      // Si l'utilisateur a supprimé l'historique, ne montrer que les messages postérieurs à la suppression
      messageQuery.createdAt = { $gt: historyDeletedAt };
    }

    console.log(`   messageQuery: ${JSON.stringify(messageQuery)}`);

    let messages = [];
    try {
      messages = await Message.find(messageQuery)
        .populate({
          path: 'authorId',
          select: 'username firstName lastName profilePicture university isStudent isDeleted',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'sharedPost.author',
          select: 'username firstName lastName profilePicture isDeleted',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'sharedFolder.author',
          select: 'username firstName lastName profilePicture isDeleted',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'sharedPdf.author',
          select: 'username firstName lastName profilePicture isDeleted',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'replyTo',
          populate: {
            path: 'authorId',
            select: 'username firstName lastName profilePicture university isStudent isDeleted',
            options: { strictPopulate: false }
          },
          options: { strictPopulate: false }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      console.log(`   ✅ Messages récupérés: ${messages.length}`);
      
    } catch (populateError) {
      console.error('❌ Erreur populate messages:', populateError.message);
      
      // Fallback : récupérer sans populate
      try {
        messages = await Message.find(messageQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
        
        console.log(`   ✅ Fallback réussi: ${messages.length} messages sans populate`);
        
        // Ajouter des auteurs "supprimés" par défaut
        messages = messages.map(msg => ({
          ...msg.toObject(),
          authorId: {
            _id: null,
            username: 'utilisateur_supprime',
            firstName: 'Utilisateur',
            lastName: 'Supprimé',
            isDeleted: true
          }
        }));
        
      } catch (fallbackError) {
        console.error('❌ Même le fallback a échoué:', fallbackError.message);
        throw fallbackError;
      }
    }
    
    // Enrichir les messages avec les réactions depuis la nouvelle collection
    let messagesWithReactions = messages;
    try {
      messagesWithReactions = await enrichMessagesWithReactions(messages);
      console.log(`   ✅ Réactions ajoutées`);
    } catch (reactionError) {
      console.error('❌ Erreur réactions (ignorée):', reactionError.message);
      messagesWithReactions = messages; // Continuer sans réactions
    }

    // 🔧 CORRECTION AUTOMATIQUE: Réparer les références orphelines
    let messagesCorriges = messagesWithReactions;
    try {
      messagesCorriges = await enrichirMessagesAvecCorrection(messagesWithReactions);
      console.log(`   ✅ Références orphelines corrigées automatiquement`);
    } catch (correctionError) {
      console.error('❌ Erreur correction automatique (ignorée):', correctionError.message);
      messagesCorriges = messagesWithReactions; // Continuer sans correction
    }

    // Traiter les messages pour remplacer les informations des utilisateurs supprimés
    let processedMessages = messagesCorriges;
    try {
      processedMessages = processMessages(messagesCorriges);
      console.log(`   ✅ Messages traités`);
    } catch (processError) {
      console.error('❌ Erreur traitement (ignorée):', processError.message);
      processedMessages = messagesCorriges; // Continuer sans traitement
    }

    // Inverser l'ordre pour avoir les plus récents en bas
    const reversedMessages = processedMessages.reverse();

    console.log(`   Messages trouvés: ${messages.length}`);
    if (messages.length > 0) {
      console.log(`   Premier: "${messages[0].content.substring(0, 30)}..." (${messages[0].createdAt})`);
      console.log(`   Dernier: "${messages[messages.length-1].content.substring(0, 30)}..." (${messages[messages.length-1].createdAt})`);
    }

    res.json({
      success: true,
      data: reversedMessages,
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    console.error('❌ Erreur détaillée getMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages',
      error: error.message
    });
  }
};

// Créer un nouveau message
exports.createMessage = async (req, res) => {
  try {
  const { groupId, content, replyToId } = req.body;
    const authorId = req.user.id;

    // Vérifier que l'utilisateur est membre du groupe
    const group = await Group.findOne({
      _id: groupId,
      members: authorId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé ou accès refusé'
      });
    }

    // Vérifier que le contenu n'est pas vide
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du message est requis'
      });
    }

    // Détermination du message référencé (nouveau champ replyToId prioritaire)
    let replyToMessageId = null;
    let cleanContent = content.trim();
    let candidateId = replyToId || null;
    let patternMatch = null;
    if (!candidateId) {
      patternMatch = content.match(/^\[REPLY:([a-f\d]{24})\]\s*(.*)/);
      if (patternMatch) {
        candidateId = patternMatch[1];
        cleanContent = patternMatch[2].trim();
      }
    }
    if (candidateId) {
      const replyToMessage = await Message.findOne({ _id: candidateId, groupId });
      if (replyToMessage) {
        replyToMessageId = candidateId;
        if (patternMatch && !cleanContent) cleanContent = replyToMessage.content; // fallback
      } else {
        console.warn('⚠️ Reply target introuvable ou hors groupe:', candidateId);
      }
    }

    const message = new Message({
      groupId,
      authorId,
      content: cleanContent,
      replyTo: replyToMessageId
    });

    await message.save();

    // Mettre à jour la date de modification du groupe
    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });
    
    // Si quelqu'un avait masqué cette conversation, la faire réapparaître dans leur liste
    // MAIS conserver le timestamp de masquage pour filtrer les anciens messages
    const groupToUpdate = await Group.findById(groupId);
    let groupWasUpdated = false;
    
    if (groupToUpdate && groupToUpdate.hiddenFor.length > 0) {
      
      // Seulement vider hiddenFor pour faire réapparaître la conversation
      // CONSERVER hiddenForWithTimestamp pour filtrer les anciens messages
      await Group.findByIdAndUpdate(groupId, {
        $set: { 
          hiddenFor: []
          // hiddenForWithTimestamp reste intact !
        }
      });
      
      groupWasUpdated = true;
    }

    // Populer les données pour la réponse
    await message.populate({ path: 'authorId', select: 'username firstName lastName profilePicture university isStudent', options: { strictPopulate: false } });
    
    // Populer le message auquel on répond si c'est une réponse
    if (message.replyTo) {
      await message.populate({
        path: 'replyTo',
        populate: {
          path: 'authorId',
          select: 'username firstName lastName profilePicture university isStudent'
        , options: { strictPopulate: false } }
      });
    }

    // Émettre le nouveau message via Socket.io
    const io = req.io;
    if (io) {
      const messageData = {
        id: message._id,
        groupId: message.groupId,
        authorId: message.authorId._id,
        author: {
          id: message.authorId._id,
          username: message.authorId.username,
          firstName: message.authorId.firstName,
          lastName: message.authorId.lastName,
          profilePicture: message.authorId.profilePicture,
          university: message.authorId.university,
          isStudent: message.authorId.isStudent,
          email: message.authorId.email,
          joinedAt: new Date(message.authorId.createdAt || Date.now())
        },
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        replyTo: message.replyTo ? {
          id: message.replyTo._id,
          content: message.replyTo.content,
          createdAt: message.replyTo.createdAt,
          author: {
            id: message.replyTo.authorId._id,
            username: message.replyTo.authorId.username,
            firstName: message.replyTo.authorId.firstName,
            lastName: message.replyTo.authorId.lastName,
            profilePicture: message.replyTo.authorId.profilePicture,
            university: message.replyTo.authorId.university,
            isStudent: message.replyTo.authorId.isStudent,
            email: message.replyTo.authorId.email,
            joinedAt: new Date(message.replyTo.authorId.createdAt || Date.now())
          }
        } : undefined
      };
      
      io.to(groupId).emit('new-message', messageData);
      
      // Si le groupe a été mis à jour (hiddenFor vidé), émettre l'événement de mise à jour
      if (groupWasUpdated) {
        // Récupérer le groupe mis à jour pour l'envoyer
        const updatedGroup = await Group.findById(groupId).populate({ path: 'members', select: 'username firstName lastName profilePicture university isStudent', options: { strictPopulate: false } });
        if (updatedGroup) {
          io.to(groupId).emit('groupUpdated', {
            groupId: updatedGroup._id,
            group: updatedGroup
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: message._id,
        groupId: message.groupId,
        authorId: message.authorId._id || message.authorId,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        replyTo: message.replyTo ? {
          id: message.replyTo._id,
            content: message.replyTo.content,
            createdAt: message.replyTo.createdAt,
            author: message.replyTo.authorId ? {
              id: message.replyTo.authorId._id,
              username: message.replyTo.authorId.username,
              profilePicture: message.replyTo.authorId.profilePicture
            } : undefined
        } : undefined
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du message'
    });
  }
};

// Mettre à jour un message
exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: id,
      authorId: userId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé ou permissions insuffisantes'
      });
    }

    // Vérifier que le contenu n'est pas vide
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du message est requis'
      });
    }

    message.content = content.trim();
    message.updatedAt = new Date();
    await message.save();

    await message.populate({ path: 'authorId', select: 'username firstName lastName profilePicture university isStudent', options: { strictPopulate: false } });

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du message'
    });
  }
};

// Supprimer un message
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Vérifier les permissions de suppression
    const group = await Group.findById(message.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    const isAuthor = message.authorId.toString() === userId;
    const isAdmin = group.adminId.toString() === userId;
    const isModerator = group.moderatorIds.includes(userId);

    // Autoriser la suppression si :
    // 1. L'utilisateur est l'auteur du message
    // 2. L'utilisateur est admin du groupe
    // 3. L'utilisateur est modérateur du groupe
    if (!isAuthor && !isAdmin && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes pour supprimer ce message'
      });
    }

    const groupId = message.groupId.toString(); // Convertir en chaîne pour Socket.io

    // Déterminer le motif de suppression et créer le message approprié
    let deletedBy = null;
    let deletionReason = 'Supprimé par l\'auteur';
    let shouldCreateSystemMessage = false;
    
    if (!isAuthor) {
      deletedBy = userId;
      shouldCreateSystemMessage = true;
      
      // Récupérer les infos de la personne qui supprime
      const deleter = await User.findById(userId);
      const authorName = message.authorId ? (await User.findById(message.authorId))?.firstName || 'Utilisateur' : 'Utilisateur';
      const deleterName = deleter?.firstName || 'Modérateur';
      
      if (isAdmin) {
        deletionReason = `Message de ${authorName} supprimé par l'administrateur ${deleterName}`;
      } else if (isModerator) {
        deletionReason = `Message de ${authorName} supprimé par le modérateur ${deleterName}`;
      }
    }

    // Supprimer complètement le message original
    await Message.findByIdAndDelete(id);

    // Si c'est une suppression par modérateur/admin, créer un message système
    if (shouldCreateSystemMessage) {
      const systemMessage = new Message({
        content: deletionReason,
        // PAS d'authorId pour que ce soit un vrai message système
        groupId: message.groupId,
        isSystemMessage: true,
        createdAt: new Date()
      });
      
      await systemMessage.save();
      console.log(`✅ Message système créé: "${systemMessage.content}"`);
    }

    // Récupérer l'instance Socket.io
    const io = req.io;

    // Émettre la suppression via Socket.io
    if (io) {
      if (shouldCreateSystemMessage) {
        // Émettre le nouveau message système au lieu de la suppression
        const updatedMessages = await Message.find({ groupId: message.groupId })
          .populate({
            path: 'authorId',
            select: 'username firstName lastName profilePicture university isStudent',
            // Permettre les messages sans auteur (messages système)
            options: { strictPopulate: false }
          })
          .sort({ createdAt: 1 });
        
        io.to(groupId).emit('messages-updated', {
          groupId,
          messages: updatedMessages
        });
      } else {
        // Pour les suppressions par l'auteur, émettre juste la suppression
        io.to(groupId).emit('message-deleted', { 
          messageId: id, 
          groupId
        });
      }
    }

    res.json({
      success: true,
      message: 'Message supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du message'
    });
  }
};

// Partager un post
exports.sharePost = async (req, res) => {
  try {
    const { groupId, postId, content = '' } = req.body;
    const authorId = req.user.id;

    // Vérifier que l'utilisateur est membre du groupe
    const group = await Group.findOne({
      _id: groupId,
      members: authorId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé ou accès refusé'
      });
    }

    // Récupérer le post
    const post = await Post.findById(postId).populate({ path: 'authorId', select: 'username firstName lastName profilePicture', options: { strictPopulate: false } });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    const message = new Message({
      groupId,
      authorId,
      content: content.trim() || 'Post partagé',
      sharedPost: {
        id: post._id,
        title: post.title,
        content: post.content,
        author: post.authorId
      }
    });

    await message.save();

    // Mettre à jour la date de modification du groupe
    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });

    await message.populate({ path: 'authorId', select: 'username firstName lastName profilePicture university isStudent', options: { strictPopulate: false } });
    await message.populate({ path: 'sharedPost.author', select: 'username firstName lastName profilePicture', options: { strictPopulate: false } });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du partage du post'
    });
  }
};

// Partager un dossier
exports.shareFolder = async (req, res) => {
  try {
    const { groupId, folderId, content = '' } = req.body;
    const authorId = req.user.id;

    // Vérifier que l'utilisateur est membre du groupe
    const group = await Group.findOne({
      _id: groupId,
      members: authorId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé ou accès refusé'
      });
    }

    // Récupérer le dossier (vous devrez adapter selon votre modèle de dossier)
    const Folder = require('../models/folder.model');
    const folder = await Folder.findById(folderId).populate({ path: 'authorId', select: 'username firstName lastName profilePicture', options: { strictPopulate: false } });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    const message = new Message({
      groupId,
      authorId,
      content: content.trim() || 'Dossier partagé',
      sharedFolder: {
        id: folder._id,
        name: folder.name,
        description: folder.description,
        itemsCount: folder.posts?.length || 0,
        author: folder.authorId,
        color: folder.color || '#3B82F6'
      }
    });

    await message.save();

    // Mettre à jour la date de modification du groupe
    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });

    await message.populate({ path: 'authorId', select: 'username firstName lastName profilePicture university isStudent', options: { strictPopulate: false } });
    await message.populate({ path: 'sharedFolder.author', select: 'username firstName lastName profilePicture', options: { strictPopulate: false } });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du partage du dossier'
    });
  }
};

// Partager un PDF
exports.sharePdf = async (req, res) => {
  try {
    const { groupId, pdfData, content = '' } = req.body;
    const authorId = req.user.id;

    // Vérifier que l'utilisateur est membre du groupe
    const group = await Group.findOne({
      _id: groupId,
      members: authorId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé ou accès refusé'
      });
    }

    const message = new Message({
      groupId,
      authorId,
      content: content.trim() || 'PDF partagé',
      sharedPdf: {
        id: pdfData.id,
        name: pdfData.name,
        url: pdfData.url,
        size: pdfData.size,
        author: authorId
      }
    });

    await message.save();

    // Mettre à jour la date de modification du groupe
    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });

    await message.populate({ path: 'authorId', select: 'username firstName lastName profilePicture university isStudent', options: { strictPopulate: false } });
    await message.populate({ path: 'sharedPdf.author', select: 'username firstName lastName profilePicture', options: { strictPopulate: false } });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du partage du PDF'
    });
  }
};

// Ajouter une réaction à un message
exports.addReaction = async (req, res) => {
  try {
    const { id } = req.params; // messageId
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji requis'
      });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Vérifier que l'utilisateur est membre du groupe
    const group = await Group.findOne({
      _id: message.groupId,
      members: userId
    });

    if (!group) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    // Vérifier si l'utilisateur a déjà une réaction sur ce message
    const existingReaction = await Reaction.findOne({
      messageId: id,
      userId: userId
    });

    // Si l'utilisateur clique sur la même réaction qu'il a déjà, ne rien faire
    if (existingReaction && existingReaction.emoji === emoji) {
      return res.json({
        success: true,
        message: 'Réaction déjà présente'
      });
    }

    // Supprimer l'ancienne réaction s'il en avait une (système une réaction par utilisateur)
    let oldEmoji = null;
    if (existingReaction) {
      oldEmoji = existingReaction.emoji;
      await Reaction.deleteOne({ _id: existingReaction._id });
    }

    // Ajouter la nouvelle réaction
    await Reaction.create({
      messageId: id,
      userId: userId,
      emoji: emoji,
      groupId: message.groupId
    });

    // Émettre l'événement Socket.io
    if (req.io) {
      req.io.to(message.groupId.toString()).emit('reaction-added', {
        messageId: message._id.toString(),
        emoji,
        userId,
        groupId: message.groupId.toString()
      });

      // Si on a supprimé une ancienne réaction, l'émettre aussi
      if (oldEmoji) {
        req.io.to(message.groupId.toString()).emit('reaction-removed', {
          messageId: message._id.toString(),
          emoji: oldEmoji,
          userId,
          groupId: message.groupId.toString()
        });
      }
    }

    res.json({
      success: true,
      message: 'Réaction ajoutée avec succès'
    });
  } catch (error) {
    console.error('Erreur addReaction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la réaction'
    });
  }
};

// Supprimer une réaction d'un message
exports.removeReaction = async (req, res) => {
  try {
    const { id, emoji } = req.params; // messageId et emoji
    const userId = req.user.id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Vérifier que l'utilisateur est membre du groupe
    const group = await Group.findOne({
      _id: message.groupId,
      members: userId
    });

    if (!group) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    // Vérifier si la réaction existe
    const existingReaction = await Reaction.findOne({
      messageId: id,
      userId: userId,
      emoji: emoji
    });

    if (!existingReaction) {
      return res.status(400).json({
        success: false,
        message: 'Réaction non trouvée'
      });
    }

    // Supprimer la réaction
    await Reaction.deleteOne({ _id: existingReaction._id });

    // Émettre l'événement Socket.io
    if (req.io) {
      req.io.to(message.groupId.toString()).emit('reaction-removed', {
        messageId: message._id.toString(),
        emoji,
        userId,
        groupId: message.groupId.toString()
      });
    }

    res.json({
      success: true,
      message: 'Réaction supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur removeReaction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la réaction'
    });
  }
};

// Récupérer les derniers messages de tous les groupes de l'utilisateur
exports.getLastMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer tous les groupes de l'utilisateur
    const groups = await Group.find({
      members: userId
    }).select('_id name isPrivate historyDeletedFor');

    groups.forEach(g => {
      console.log(`   - ${g.name} (${g._id}) - ${g.isPrivate ? 'Privé' : 'Public'}`);
    });

    if (!groups || groups.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const groupIds = groups.map(group => group._id);

    // ✅ APPROCHE SIMPLIFIÉE: Récupérer les derniers messages puis filtrer selon historyDeletedFor
    const lastMessages = await Message.aggregate([
      { $match: { groupId: { $in: groupIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$groupId',
          lastMessage: { $first: '$$ROOT' }
        }
      },
      // Joindre les informations de l'auteur avec $lookup
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.authorId',
          foreignField: '_id',
          as: 'authorInfo',
          pipeline: [
            {
              $project: {
                username: 1,
                firstName: 1,
                lastName: 1,
                profilePicture: 1,
                university: 1,
                isStudent: 1,
                isDeleted: 1
              }
            }
          ]
        }
      },
      // Joindre les informations du post partagé si nécessaire
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sharedPost.author',
          foreignField: '_id',
          as: 'sharedPostAuthorInfo'
        }
      },
      // Joindre les informations du dossier partagé si nécessaire
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sharedFolder.author',
          foreignField: '_id',
          as: 'sharedFolderAuthorInfo'
        }
      }
    ]);


    // ✅ NOUVEAU: Filtrer les derniers messages selon l'historique supprimé
    const filteredLastMessages = [];
    
    for (const item of lastMessages) {
      const group = groups.find(g => g._id.toString() === item._id.toString());
      
      
      if (group && group.historyDeletedFor && group.historyDeletedFor.length > 0) {
        // Vérifier si l'utilisateur a supprimé l'historique de ce groupe
        const userHistoryDeleted = group.historyDeletedFor.find(h => 
          h.userId.toString() === userId.toString()
        );
        
        if (userHistoryDeleted) {
          // Si l'historique est supprimé, vérifier si le dernier message est après la suppression
          const messageDate = new Date(item.lastMessage.createdAt);
          const deletedAt = new Date(userHistoryDeleted.deletedAt);
          
          
          if (messageDate > deletedAt) {
            // Message après la suppression d'historique, on le garde
            filteredLastMessages.push(item);
          } else {
          }
          // Sinon, on ne garde pas ce dernier message (conversation vide)
        } else {
          // Pas de suppression d'historique pour cet utilisateur
          filteredLastMessages.push(item);
        }
      } else {
        // Pas de suppressions d'historique dans ce groupe
        filteredLastMessages.push(item);
      }
    }


    // Formater les données pour le frontend
    const formattedData = filteredLastMessages.map(item => ({
      groupId: item._id,
      lastMessage: {
        ...item.lastMessage,
        // Utiliser les données jointes avec $lookup et traiter les utilisateurs supprimés
        authorId: item.authorInfo && item.authorInfo.length > 0 ? 
          replaceDeletedUserInfo({
            _id: item.authorInfo[0]._id,
            username: item.authorInfo[0].username || 'Utilisateur inconnu',
            firstName: item.authorInfo[0].firstName || '',
            lastName: item.authorInfo[0].lastName || '',
            profilePicture: item.authorInfo[0].profilePicture || null,
            university: item.authorInfo[0].university || '',
            isStudent: item.authorInfo[0].isStudent || false,
            isDeleted: item.authorInfo[0].isDeleted
          }) : {
          _id: 'unknown',
          username: 'Utilisateur introuvable',
          firstName: '',
          lastName: '',
          profilePicture: null,
          university: '',
          isStudent: false
        },
        // Mettre à jour les infos des contenus partagés si nécessaire
        sharedPost: item.lastMessage.sharedPost ? {
          ...item.lastMessage.sharedPost,
          author: item.sharedPostAuthorInfo && item.sharedPostAuthorInfo.length > 0 ? 
            replaceDeletedUserInfo(item.sharedPostAuthorInfo[0]) : null
        } : undefined,
        sharedFolder: item.lastMessage.sharedFolder ? {
          ...item.lastMessage.sharedFolder,
          author: item.sharedFolderAuthorInfo && item.sharedFolderAuthorInfo.length > 0 ? 
            replaceDeletedUserInfo(item.sharedFolderAuthorInfo[0]) : null
        } : undefined
      }
    }));

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des derniers messages'
    });
  }
};
