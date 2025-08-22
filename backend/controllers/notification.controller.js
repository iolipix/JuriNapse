const Notification = require('../models/notification.model');

// Obtenir toutes les notifications d'un utilisateur
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { recipient: req.user._id };
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .populate('sender', 'username firstName lastName profilePicture')
      .populate('relatedPost', '_id title slug content')
      .populate('relatedFolder', '_id name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Optimisation : une seule requête pour le total et les non lues
    const [totalCount, unreadCount] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false })
    ]);
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit
        },
        unreadCount
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des notifications'
    });
  }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }
    
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette notification'
      });
    }
    
    await notification.markAsRead();
    
    // Émettre l'événement WebSocket
    if (req.io) {
      req.io.to(`user-${req.user.id}`).emit('notification-read', id);
    }
    
    res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour de la notification'
    });
  }
};

// Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour des notifications'
    });
  }
};

// Supprimer une notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }
    
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette notification'
      });
    }
    
    await Notification.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Notification supprimée avec succès'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de la notification'
    });
  }
};

// Obtenir le nombre de notifications non lues
exports.getUnreadCount = async (req, res) => {
  try {
    // Requête optimisée directe sans passer par le modèle
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });
    
    res.json({
      success: true,
      data: { count: unreadCount }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du nombre de notifications non lues'
    });
  }
};

// Créer une notification (utilisé par d'autres controllers)
exports.createNotification = async (data, io = null) => {
  try {
    const notification = await Notification.createNotification(data);
    
    // Émettre l'événement WebSocket si io est disponible
    if (io && notification) {
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username firstName lastName profilePicture');
      
      // Émettre seulement au destinataire de la notification
      io.to(`user-${data.recipient}`).emit('new-notification', populatedNotification);
    }
    
    return notification;
  } catch (error) {
    return null;
  }
};
