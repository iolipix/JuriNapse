import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = '/api'; // Utiliser le proxy Vite au lieu de localhost:5000

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Pour envoyer les cookies avec les requêtes
});

// Add auth token to requests - utiliser les cookies HTTP au lieu de localStorage
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Les cookies HTTP sont automatiquement envoyés avec withCredentials: true
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Ne déclencher l'événement que si ce n'est pas une vérification d'authentification initiale ou une tentative de connexion
      const url = error.config?.url || '';
      const isAuthCheck = url.includes('/auth/profile');
      const isLoginAttempt = url.includes('/auth/login');
      const isRegisterAttempt = url.includes('/auth/register');
      
      if (!isAuthCheck && !isLoginAttempt && !isRegisterAttempt) {
        // Émettre un événement custom pour ouvrir le modal d'authentification
        window.dispatchEvent(new CustomEvent('auth-required'));
      }
    }
    return Promise.reject(error);
  }
);

// Export the api instance
export { api };

// Auth API methods
export const authAPI = {
  login: async (emailOrUsername: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { emailOrUsername, password });
      return response.data;
    } catch (error) {
      // Retourner un objet d'erreur standardisé pour les erreurs d'authentification
      return { success: false, message: 'Email/pseudo ou mot de passe incorrect' };
    }
  },

  register: async (userData: any, password: string) => {
    try {
      const response = await api.post('/auth/register', { ...userData, password });
      return response.data;
    } catch (error) {
      return { success: false, message: 'Erreur lors de l\'inscription' };
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      return { success: false, message: 'Non authentifié' };
    }
  },

  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      return { success: false, message: 'Erreur lors de la déconnexion' };
    }
  },

  updateProfile: async (userData: any) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  updateNotificationSettings: async (settings: any) => {
    try {
      const response = await api.put('/users/notification-settings', settings);
      return response.data;
    } catch (error) {
      console.error('Erreur API updateNotificationSettings:', error);
      return { success: false, message: 'Erreur lors de la sauvegarde des paramètres' };
    }
  },

  getNotificationSettings: async () => {
    const response = await api.get('/users/notification-settings');
    return response.data;
  },

  checkUsernameAvailability: async (username: string) => {
    const response = await api.get(`/auth/check-username/${username}`);
    return response.data;
  },

  deleteAccount: async () => {
    try {
      const response = await api.delete('/users/delete-account');
      return response.data;
    } catch (error) {
      return { success: false, message: 'Erreur lors de la suppression du compte' };
    }
  },
};

// Users API methods
export const usersAPI = {
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getUserById: async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  getUserByUsername: async (username: string) => {
    const response = await api.get(`/users/username/${username}`);
    return response.data;
  },

  getUserStats: async (userId: string) => {
    const response = await api.get(`/users/${userId}/stats`);
    return response.data;
  },
  getRecentEmojis: async () => {
    const response = await api.get('/users/recent-emojis');
    return response.data;
  },
  updateRecentEmojis: async (emojis: string[]) => {
    const response = await api.post('/users/recent-emojis', { emojis });
    return response.data;
  }
};

// Posts API methods
export const postsAPI = {
  getPostBySlugOrId: async (slugOrId: string) => {
    const response = await api.get(`/posts/${slugOrId}`);
    return response.data;
  },
  
  getLikes: async (postId: string) => {
    const response = await api.get(`/posts/${postId}/likes`);
    return response.data;
  },
  
  getComments: async (postId: string, page: number = 1, limit: number = 12) => {
    const response = await api.get(`/posts/${postId}/comments`, {
      params: { page, limit }
    });
    return response.data;
  },

  likeComment: async (postId: string, commentId: string) => {
    const response = await api.post(`/posts/${postId}/comments/${commentId}/like`);
    return response.data;
  },

  unlikeComment: async (postId: string, commentId: string) => {
    const response = await api.delete(`/posts/${postId}/comments/${commentId}/like`);
    return response.data;
  },

  updateComment: async (postId: string, commentId: string, content: string) => {
    const response = await api.put(`/posts/${postId}/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (postId: string, commentId: string) => {
    const response = await api.delete(`/posts/${postId}/comments/${commentId}`);
    return response.data;
  },
};

// Groups API methods
export const groupsAPI = {
  getAllGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  createGroup: async (groupData: { name: string; description: string; isPrivate?: boolean; selectedMembers?: string[] }) => {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  getGroup: async (groupId: string) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  updateGroup: async (groupId: string, groupData: { name?: string; description?: string }) => {
    const response = await api.put(`/groups/${groupId}`, groupData);
    return response.data;
  },

  deleteGroup: async (groupId: string) => {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  },

  addMember: async (groupId: string, userId: string) => {
    const response = await api.post(`/groups/${groupId}/members`, { userId });
    return response.data;
  },

  removeMember: async (groupId: string, userId: string) => {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
  },

  leaveGroup: async (groupId: string) => {
    const response = await api.post(`/groups/${groupId}/leave`);
    return response.data;
  },

  toggleNotifications: async (groupId: string, enabled: boolean) => {
    const response = await api.post(`/groups/${groupId}/notifications`, { enabled });
    return response.data;
  },

  hideGroup: async (groupId: string) => {
    const response = await api.post(`/groups/${groupId}/hide`);
    return response.data;
  },

  deleteHistory: async (groupId: string) => {
    const response = await api.post(`/groups/${groupId}/delete-history`);
    return response.data;
  },

  showGroup: async (groupId: string) => {
    const response = await api.post(`/groups/${groupId}/show`);
    return response.data;
  },

  // Nouvelles fonctions de modération
  promoteModerator: async (groupId: string, userId: string) => {
    const response = await api.post(`/groups/${groupId}/moderators`, { userId });
    return response.data;
  },

  demoteModerator: async (groupId: string, userId: string) => {
    const response = await api.delete(`/groups/${groupId}/moderators`, { data: { userId } });
    return response.data;
  },

  kickMember: async (groupId: string, userId: string) => {
    const response = await api.post(`/groups/${groupId}/kick`, { userId });
    return response.data;
  },

  updateGroupPicture: async (groupId: string, profilePicture: string) => {
    const response = await api.put(`/groups/${groupId}/picture`, { profilePicture });
    return response.data;
  },
};

// Messages API methods
export const messagesAPI = {
  getMessages: async (groupId: string, page: number = 1, limit: number = 50) => {
    const response = await api.get(`/messages/group/${groupId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  getLastMessages: async () => {
    const response = await api.get('/messages/last-messages');
    return response.data;
  },

  createMessage: async (messageData: { groupId: string; content: string; replyToId?: string }) => {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  updateMessage: async (messageId: string, content: string) => {
    const response = await api.put(`/messages/${messageId}`, { content });
    return response.data;
  },

  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  addReaction: async (messageId: string, emoji: string) => {
    const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
    return response.data;
  },

  removeReaction: async (messageId: string, emoji: string) => {
    const response = await api.delete(`/messages/${messageId}/reactions/${emoji}`);
    return response.data;
  },

  sharePost: async (groupId: string, postId: string, content?: string) => {
    const response = await api.post('/messages/share-post', { groupId, postId, content });
    return response.data;
  },

  shareFolder: async (groupId: string, folderId: string, content?: string) => {
    const response = await api.post('/messages/share-folder', { groupId, folderId, content });
    return response.data;
  },

  sharePdf: async (groupId: string, pdfData: any, content?: string) => {
    const response = await api.post('/messages/share-pdf', { groupId, pdfData, content });
    return response.data;
  },
};

// Subscriptions API methods
export const subscriptionsAPI = {
  getUserSubscriptions: async () => {
    const response = await api.get('/subscriptions');
    return response.data;
  },

  followUser: async (userId: string) => {
    const response = await api.post(`/subscriptions/follow/${userId}`);
    return response.data;
  },

  unfollowUser: async (userId: string) => {
    const response = await api.delete(`/subscriptions/unfollow/${userId}`);
    return response.data;
  },

  getFollowers: async () => {
    const response = await api.get('/subscriptions/followers');
    return response.data;
  },

  getFollowing: async () => {
    const response = await api.get('/subscriptions/following');
    return response.data;
  },

  // Nouvelles méthodes pour récupérer les abonnés/abonnements d'un utilisateur spécifique
  getUserFollowers: async (userId: string) => {
    const response = await api.get(`/subscriptions/user/${userId}/followers`);
    return response.data;
  },

  getUserFollowing: async (userId: string) => {
    const response = await api.get(`/subscriptions/user/${userId}/following`);
    return response.data;
  },

  getUserConnections: async (userId: string) => {
    const response = await api.get(`/subscriptions/user/${userId}/connections`);
    return response.data;
  },

  isFollowing: async (userId: string) => {
    const response = await api.get(`/subscriptions/is-following/${userId}`);
    return response.data;
  },

  getBlockedUsers: async () => {
    const response = await api.get('/subscriptions/blocked');
    return response.data;
  },

  blockUser: async (userId: string) => {
    const response = await api.post(`/subscriptions/block/${userId}`);
    return response.data;
  },

  unblockUser: async (userId: string) => {
    const response = await api.delete(`/subscriptions/unblock/${userId}`);
    return response.data;
  },

  isBlocked: async (userId: string) => {
    const response = await api.get(`/subscriptions/is-blocked/${userId}`);
    return response.data;
  },
};

// Notifications API methods
export const notificationsAPI = {
  getNotifications: async (page: number = 1, limit: number = 20, unreadOnly: boolean = false) => {
    const response = await api.get('/notifications', {
      params: { page, limit, unreadOnly }
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }
};

// API pour les posts sauvegardés
export const savedPostsAPI = {
  getSavedPosts: async () => {
    const response = await api.get('/users/saved-posts');
    return response.data;
  },

  savePost: async (postId: string) => {
    const response = await api.post(`/posts/${postId}/save`);
    return response.data;
  },

  unsavePost: async (postId: string) => {
    const response = await api.delete(`/posts/${postId}/save`);
    return response.data;
  },

  isPostSaved: async (postId: string) => {
    const response = await api.get(`/posts/${postId}/is-saved`);
    return response.data;
  }
};

export default api;