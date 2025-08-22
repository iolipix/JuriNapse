import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { notificationsAPI } from '../services/api';

export interface Notification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  type: 'like' | 'comment' | 'follow' | 'post_shared' | 'folder_shared' | 'collaborator_added' | 'mention' | 'system';
  message: string;
  relatedPost?: {
    _id: string;
    title: string;
    type: string;
  };
  relatedFolder?: {
    _id: string;
    name: string;
    color: string;
  };
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  loadNotifications: (page?: number, unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les notifications
  const loadNotifications = async (page: number = 1, unreadOnly: boolean = false) => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationsAPI.getNotifications(page, 5, unreadOnly); // Réduire de 20 à 5
      
      if (response.success) {
        if (page === 1) {
          setNotifications(response.data.notifications);
        } else {
          // Pagination - ajouter à la liste existante
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        setUnreadCount(response.data.unreadCount);
      } else {
        setError(response.message || 'Erreur lors du chargement des notifications');
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
      const response = await notificationsAPI.markAsRead(notificationId);
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        
        // Mettre à jour le compteur des non-lues
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour de la notification');
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour des notifications');
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await notificationsAPI.deleteNotification(notificationId);
      
      if (response.success) {
        const deletedNotification = notifications.find(n => n._id === notificationId);
        
        setNotifications(prev => prev.filter(notification => notification._id !== notificationId));
        
        // Mettre à jour le compteur si la notification n'était pas lue
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      setError('Erreur lors de la suppression de la notification');
    }
  };

  // Rafraîchir le compteur des notifications non lues
  const refreshUnreadCount = async () => {
    if (!user) return;

    try {
      const response = await notificationsAPI.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (err) {
      // Silent error handling
    }
  };

  // Charger les notifications au démarrage et rafraîchir le compteur périodiquement
  useEffect(() => {
    if (user) {
      // NE PAS charger les notifications automatiquement, seulement le compteur
      refreshUnreadCount();
      
      // Rafraîchir le compteur toutes les 5 minutes (au lieu de 2 minutes)
      const interval = setInterval(refreshUnreadCount, 300000);
      
      return () => clearInterval(interval);
    } else {
      // Reset state when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [user]);

  // Gérer les notifications en temps réel via WebSocket
  useEffect(() => {
    if (socket && user) {
      // Écouter les nouvelles notifications
      socket.on('new-notification', (notification: Notification) => {
        // Ajouter la nouvelle notification au début de la liste
        setNotifications(prev => [notification, ...prev]);
        // Incrémenter le compteur des non-lues
        setUnreadCount(prev => prev + 1);
      });

      // Écouter quand une notification est marquée comme lue (depuis un autre appareil)
      socket.on('notification-read', (notificationId: string) => {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      });

      // Cleanup lors du démontage
      return () => {
        socket.off('new-notification');
        socket.off('notification-read');
      };
    }
  }, [socket, user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
