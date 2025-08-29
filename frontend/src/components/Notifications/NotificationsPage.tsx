import React, { useEffect, useState } from 'react';
import { Bell, Check, User, MessageCircle, Heart, UserPlus, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsAPI } from '../../services/api';

interface NotificationsPageProps {
  onViewUserProfile?: (userId: string) => void;
  onViewPost?: (postId: string) => void;
  onViewFolder?: (folderId: string) => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onViewUserProfile,
  onViewPost,
  onViewFolder
}) => {
  const { user } = useAuth();
  
  // État local pour les notifications (plus de context global)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Charger les notifications à la demande seulement
  const loadNotifications = async (onlyUnread = false) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationsAPI.getNotifications(1, 20, onlyUnread);
      
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      } else {
        setError('Erreur lors du chargement des notifications');
      }
    } catch (err) {
      setError('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      // Erreur silencieuse
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      // Erreur silencieuse
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
    } catch (err) {
      // Erreur silencieuse
    }
  };

  // Charger les notifications au montage du composant
  useEffect(() => {
    if (user) {
      loadNotifications(showUnreadOnly);
    }
  }, [user, showUnreadOnly]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'à l\'instant';
    if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `il y a ${Math.floor(diffInSeconds / 86400)} j`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (err) {
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (err) {
    }
  };

  const handleNotificationHover = async (notification: any) => {
    // Marquer comme lu si pas encore lu
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Rediriger selon le type de notification
    switch (notification.type) {
      case 'follow':
        // Rediriger vers le profil de la personne qui s'est abonnée
        if (onViewUserProfile && notification.sender._id) {
          onViewUserProfile(notification.sender._id);
        }
        break;
        
      case 'like':
      case 'comment':
        // Rediriger vers le post concerné
        const postIdentifier = notification.relatedPost?.slug || notification.relatedPost?.id || notification.relatedPost?._id;
        if (onViewPost && postIdentifier) {
          onViewPost(postIdentifier);
        } else {
        }
        break;
        
      case 'post_shared':
        // Rediriger vers le post partagé
        const sharedPostIdentifier = notification.relatedPost?.slug || notification.relatedPost?.id || notification.relatedPost?._id;
        if (onViewPost && sharedPostIdentifier) {
          onViewPost(sharedPostIdentifier);
        } else {
        }
        break;
        
      case 'folder_shared':
      case 'collaborator_added':
        // Rediriger vers le dossier concerné
        if (onViewFolder && notification.relatedFolder?._id) {
          onViewFolder(notification.relatedFolder._id);
        }
        break;
        
      case 'mention':
        // Rediriger vers le post où l'utilisateur a été mentionné
        const mentionPostIdentifier = notification.relatedPost?.slug || notification.relatedPost?.id || notification.relatedPost?._id;
        if (onViewPost && mentionPostIdentifier) {
          onViewPost(mentionPostIdentifier);
        }
        break;
        
      default:
        break;
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="text-center py-6 sm:py-8">
          <p className="text-sm sm:text-base text-gray-500">Vous devez être connecté pour voir vos notifications.</p>
        </div>
      </div>
    );
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Non lues seulement</span>
          </label>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>Tout marquer comme lu</span>
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Notifications list */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showUnreadOnly ? 'Aucune notification non lue' : 'Aucune notification'}
            </h3>
            <p className="text-gray-500">
              {showUnreadOnly 
                ? 'Vous n\'avez aucune notification non lue.'
                : 'Vous n\'avez encore reçu aucune notification.'
              }
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-lg border p-4 transition-all hover:shadow-md cursor-pointer ${
                !notification.isRead ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleNotificationClick(notification)}
              onMouseEnter={() => handleNotificationHover(notification)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {notification.sender.profilePicture ? (
                        <img
                          src={notification.sender.profilePicture}
                          alt={notification.sender.username}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900">
                        @{notification.sender.username}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification._id);
                    }}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
