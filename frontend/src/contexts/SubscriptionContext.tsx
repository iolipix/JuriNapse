import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { subscriptionsAPI, usersAPI } from '../services/api';

// Import nécessaire pour le hook useAuth  
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  subscriptions: User[];
  followers: User[];
  blockedUsers: User[];
  followingCount: number;
  followersCount: number;
  followUser: (userId: string) => Promise<boolean>;
  unfollowUser: (userId: string) => Promise<boolean>;
  blockUser: (userId: string) => Promise<boolean>;
  unblockUser: (userId: string) => Promise<boolean>;
  isFollowing: (userId: string) => Promise<boolean>;
  isFollowingSync: (userId: string) => boolean; // Version synchrone pour utiliser le cache
  isBlocked: (userId: string) => Promise<boolean>;
  refreshSubscriptions: () => Promise<void>;
  isLoading: boolean;
  // Méthodes de compatibilité avec l'ancien contexte
  getFollowersCount: (userId: string) => Promise<number>;
  getFollowingCount: (userId: string) => Promise<number>;
  getConnections: (userId: string) => User[];
  getConnectionsAsync: (userId: string) => Promise<User[]>;
  isConnection: (userId: string) => boolean;
  
  // Additional methods for legacy compatibility
  getFollowers: (userId: string) => Promise<User[]>;
  getFollowing: (userId: string) => Promise<User[]>;
  getUserById: (userId: string) => Promise<User>;
  getUserByUsername: (username: string) => Promise<User>;
  getBlockedUsers: () => Promise<User[]>;
  getSuggestedUsers: () => Promise<User[]>;
  
  // Nouvelle méthode pour forcer la mise à jour
  invalidateCache: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscriptions = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return context;
};

// Maintenir la compatibilité avec l'ancien hook
export const useSubscription = () => {
  return useSubscriptions();
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestionsCacheKey, setSuggestionsCacheKey] = useState(Date.now()); // Clé pour forcer le rechargement des suggestions

  // S'assurer de ne charger qu'une seule fois par session utilisateur
  const loadedForUser = React.useRef<string | null>(null);

  // Charger les données des abonnements
  const refreshSubscriptions = React.useCallback(async () => {
    if (!user) return; // Ne pas charger si l'utilisateur n'est pas connecté
    
    setIsLoading(true);
    try {
      const response = await subscriptionsAPI.getUserSubscriptions();
      if (response.success) {
        setSubscriptions(response.subscriptions || []);
        setFollowers(response.followers || []);
        setFollowingCount(response.followingCount || 0);
        setFollowersCount(response.followersCount || 0);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Charger les utilisateurs bloqués
  const loadBlockedUsers = React.useCallback(async () => {
    if (!user) return; // Ne pas charger si l'utilisateur n'est pas connecté
    
    try {
      const response = await subscriptionsAPI.getBlockedUsers();
      if (response.success) {
        setBlockedUsers(response.blockedUsers || []);
      }
    } catch (error) {    }
  }, [user]);

  useEffect(() => {
    // Charger les données à chaque changement d'utilisateur
    if (user) {      loadedForUser.current = user.id;
      refreshSubscriptions();
      loadBlockedUsers();
    } else {
      loadedForUser.current = null;
      // Réinitialiser les données quand l'utilisateur se déconnecte
      setSubscriptions([]);
      setFollowers([]);
      setBlockedUsers([]);
      setFollowingCount(0);
      setFollowersCount(0);
    }
  }, [user]); // Enlever les fonctions qui causent des boucles infinies

  const followUser = React.useCallback(async (userId: string): Promise<boolean> => {
    if (!user) return false; // Vérifier si l'utilisateur est connecté
    
    // Vérifier si l'utilisateur n'est pas déjà suivi (par ID ou username)
    const isAlreadyFollowing = subscriptions.some(sub => 
      sub.id === userId || sub.username === userId
    );
    if (isAlreadyFollowing) {
      return true; // Retourner true car l'utilisateur est déjà suivi
    }
    
    try {
      const response = await subscriptionsAPI.followUser(userId);
      if (response.success) {
        // Mettre à jour l'état local SEULEMENT - pas de refresh pour éviter le clignotement
        setSubscriptions(prev => [...prev, response.user]);
        setFollowingCount(prev => prev + 1);
        
        return true;
      }
      return false;
    } catch (error: any) {      
      // Si l'utilisateur est déjà suivi (erreur 400), c'est considéré comme un succès
      if (error?.response?.status === 400) {
        return true;
      }
      
      return false;
    }
  }, [user, subscriptions]);

  const unfollowUser = React.useCallback(async (userId: string): Promise<boolean> => {
    if (!user) return false; // Vérifier si l'utilisateur est connecté
    
    // Vérifier si l'utilisateur est actuellement suivi (par ID ou username)
    const isFollowing = subscriptions.some(sub => 
      sub.id === userId || sub.username === userId
    );
    if (!isFollowing) {
      return true; // Retourner true car l'utilisateur n'est déjà plus suivi
    }
    
    try {
      const response = await subscriptionsAPI.unfollowUser(userId);
      if (response.success) {
        // Mettre à jour l'état local SEULEMENT - pas de refresh pour éviter le clignotement
        setSubscriptions(prev => prev.filter(sub => 
          sub.id !== userId && sub.username !== userId
        ));
        setFollowingCount(prev => Math.max(0, prev - 1));
        
        // Forcer l'invalidation des suggestions pour que la personne réapparaisse dans les suggestions
        setSuggestionsCacheKey(Date.now());
        
        return true;
      }
      return false;
    } catch (error: any) {      
      return false;
    }
  }, [user, subscriptions]);

  const blockUser = React.useCallback(async (userId: string): Promise<boolean> => {
    if (!user) return false; // Vérifier si l'utilisateur est connecté
    
    try {
      const response = await subscriptionsAPI.blockUser(userId);
      if (response.success) {
        // Mettre à jour l'état local
        setSubscriptions(prev => prev.filter(user => user.id !== userId));
        setFollowers(prev => prev.filter(user => user.id !== userId));
        setFollowingCount(prev => Math.max(0, prev - 1));
        setFollowersCount(prev => Math.max(0, prev - 1));
        // Recharger les utilisateurs bloqués
        loadBlockedUsers();
        return true;
      }
      return false;
    } catch (error) {      return false;
    }
  }, [user, loadBlockedUsers]);

  const unblockUser = React.useCallback(async (userId: string): Promise<boolean> => {
    if (!user) return false; // Vérifier si l'utilisateur est connecté
    
    try {
      const response = await subscriptionsAPI.unblockUser(userId);
      
      if (response.success) {
        // Mettre à jour l'état local avec un filtrage robuste
        setBlockedUsers(prev => {
          const filtered = prev.filter((user: any) => {
            const userIdMatch = user.id !== userId;
            const userIdStrMatch = user._id && user._id.toString() !== userId;
            const usernameMatch = user.username !== userId;
            
            // Garder l'utilisateur seulement si tous les champs ne correspondent pas
            return userIdMatch && userIdStrMatch && usernameMatch;
          });
          
          return filtered;
        });
        return true;
      }
      return false;
    } catch (error) {
      throw error; // Propager l'erreur pour que le composant puisse l'afficher
    }
  }, [user]);

  const isFollowing = React.useCallback(async (userId: string): Promise<boolean> => {
    if (!user) return false; // Vérifier si l'utilisateur est connecté
    
    try {
      const response = await subscriptionsAPI.isFollowing(userId);
      return response.success ? response.isFollowing : false;
    } catch (error) {      return false;
    }
  }, [user]);

  // Version synchrone qui utilise le cache local
  const isFollowingSync = React.useCallback((userId: string): boolean => {
    if (!user) return false;
    
    // Rechercher par ID ou par username pour gérer les incohérences
    const matchingSubscription = subscriptions.find(sub => 
      sub.id === userId || 
      sub.username === userId
    );
    
    const result = !!matchingSubscription;
    return result;
  }, [user, subscriptions]);

  const isBlocked = React.useCallback(async (userId: string): Promise<boolean> => {
    if (!user) return false; // Vérifier si l'utilisateur est connecté
    
    try {
      const response = await subscriptionsAPI.isBlocked(userId);
      return response.success ? response.isBlocked : false;
    } catch (error) {      return false;
    }
  }, [user]);

  // Méthodes de compatibilité avec l'ancien contexte
  const getFollowersCount = React.useCallback(async (userId: string): Promise<number> => {
    if (userId === 'current' || (user && userId === user.id)) {
      return followersCount;
    }
    
    try {
      const response = await usersAPI.getUserStats(userId);
      const count = response.stats?.followersCount || 0;
      return count;
    } catch (error) {
      return 0;
    }
  }, [followersCount, user]);

  const getFollowingCount = React.useCallback(async (userId: string): Promise<number> => {
    if (userId === 'current' || (user && userId === user.id)) {
      return followingCount;
    }
    
    try {
      const response = await usersAPI.getUserStats(userId);
      const count = response.stats?.followingCount || 0;
      return count;
    } catch (error) {
      return 0;
    }
  }, [followingCount, user]);

  const getConnections = React.useCallback((userId: string): User[] => {
    // Connexions = abonnements mutuels pour l'utilisateur courant uniquement
    if (userId === 'current' || (user && userId === user.id)) {
      if (!subscriptions || !followers) return [];
      return subscriptions.filter(sub => 
        followers.some(follower => follower.id === sub.id)
      );
    }
    return [];
  }, [subscriptions, followers, user]);

  const getConnectionsAsync = React.useCallback(async (userId: string): Promise<User[]> => {
    // Connexions = abonnements mutuels
    if (userId === 'current' || (user && userId === user.id)) {
      if (!subscriptions || !followers) return [];
      return subscriptions.filter(sub => 
        followers.some(follower => follower.id === sub.id)
      );
    }
    
    // Pour les autres utilisateurs, on doit récupérer leurs connexions via l'API
    try {
      const [userFollowers, userFollowing] = await Promise.all([
        subscriptionsAPI.getUserFollowers(userId),
        subscriptionsAPI.getUserFollowing(userId)
      ]);
      
      if (userFollowers.success && userFollowing.success) {
        // Trouver les connexions mutuelles
        const connections = userFollowing.data.filter((following: User) => 
          userFollowers.data.some((follower: User) => 
            (follower.id || (follower as any)._id) === (following.id || (following as any)._id)
          )
        );
        return connections;
      }
    } catch (error) {    }
    
    return [];
  }, [subscriptions, followers, user]);

  const isConnection = React.useCallback((userId: string): boolean => {
    // Vérifier si c'est une connexion mutuelle
    const isFollowingUser = subscriptions.some(sub => sub.id === userId || sub.username === userId);
    const isFollowedBy = followers.some(follower => follower.id === userId || follower.username === userId);
    return isFollowingUser && isFollowedBy;
  }, [subscriptions, followers]);

  // Additional methods for legacy compatibility
  const getFollowers = React.useCallback(async (userId: string): Promise<User[]> => {
    if (!user) return []; // Vérifier si l'utilisateur est connecté
    
    if (userId === 'current' || userId === user.id) {
      return followers;
    }
    
    try {
      const response = await subscriptionsAPI.getUserFollowers(userId);
      return response.data || [];
    } catch (error) {      return [];
    }
  }, [user, followers]);

  const getFollowing = React.useCallback(async (userId: string): Promise<User[]> => {
    if (!user) return []; // Vérifier si l'utilisateur est connecté
    
    if (userId === 'current' || userId === user.id) {
      return subscriptions;
    }
    
    try {
      const response = await subscriptionsAPI.getUserFollowing(userId);
      return response.data || [];
    } catch (error) {      return [];
    }
  }, [user, subscriptions]);

  const getUserById = React.useCallback(async (userId: string): Promise<User> => {
    try {
      const response = await usersAPI.getUserById(userId);
      // L'API getUserById retourne { success: true, user: {...} }
      return response.user || response;
    } catch (error) {      throw error;
    }
  }, []);

  const getUserByUsername = React.useCallback(async (username: string): Promise<User> => {
    try {
      const response = await usersAPI.getUserByUsername(username);
      return response;
    } catch (error) {      throw error;
    }
  }, []);

  const getBlockedUsers = React.useCallback(async (): Promise<User[]> => {
    if (!user) return []; // Vérifier si l'utilisateur est connecté
    return blockedUsers;
  }, [user, blockedUsers]);

  const getSuggestedUsers = React.useCallback(async (): Promise<User[]> => {
    if (!user) {      return [];
    }
    
    try {      // Récupérer tous les utilisateurs
      const allUsersResponse = await usersAPI.getAllUsers();
      
      // DEBUG: Afficher la réponse brute pour diagnostiquer le format      
      // Gérer les trois formats de réponse possibles
      let allUsers: User[] = [];
      if (Array.isArray(allUsersResponse)) {
        // Format ancien : directement un tableau        allUsers = allUsersResponse;
      } else if (allUsersResponse && allUsersResponse.success && allUsersResponse.users) {
        // Format nouveau : objet avec success et users        allUsers = allUsersResponse.users;
      } else if (allUsersResponse && allUsersResponse.success && allUsersResponse.data) {
        // Format alternatif : objet avec success et data        allUsers = allUsersResponse.data;
      } else {        return [];
      }      
      // Filtrer pour exclure :
      // 1. L'utilisateur actuel
      // 2. Les utilisateurs déjà suivis
      // 3. Les utilisateurs bloqués
      const followedUserIds = new Set(subscriptions ? subscriptions.map(sub => sub.id) : []);
      const followedUsernames = new Set(subscriptions ? subscriptions.map(sub => sub.username).filter(Boolean) : []);
      const blockedUserIds = new Set(blockedUsers ? blockedUsers.map(blocked => blocked.id) : []);
      const blockedUsernames = new Set(blockedUsers ? blockedUsers.map(blocked => blocked.username).filter(Boolean) : []);      
      
      const suggestedUsers = allUsers.filter((suggestedUser: User) => {
        const isCurrentUser = suggestedUser.id === user.id || suggestedUser.username === user.username;
        const isFollowed = followedUserIds.has(suggestedUser.id) || 
                          (suggestedUser.username && followedUsernames.has(suggestedUser.username));
        const isBlocked = blockedUserIds.has(suggestedUser.id) || 
                         (suggestedUser.username && blockedUsernames.has(suggestedUser.username));
        
        const shouldExclude = isCurrentUser || isFollowed || isBlocked;
        
        if (shouldExclude) {        }
        
        return !shouldExclude;
      });      
      return suggestedUsers;
    } catch (error) {      return [];
    }
  }, [user, subscriptions, blockedUsers, suggestionsCacheKey]);

  // Méthode pour invalider le cache et forcer une mise à jour SEULEMENT si nécessaire
  const invalidateCache = React.useCallback(async () => {
    if (user) {
      // Forcer la régénération des suggestions seulement
      setSuggestionsCacheKey(Date.now());
      
      // NE PAS recharger les abonnements automatiquement pour éviter le clignotement
      // Le rechargement se fera au prochain mount de composant si nécessaire
    }
  }, [user]);

  const value: SubscriptionContextType = {
    subscriptions,
    followers,
    blockedUsers,
    followingCount,
    followersCount,
    followUser,
    unfollowUser,
    blockUser,
    unblockUser,
    isFollowing,
    isFollowingSync,
    isBlocked,
    refreshSubscriptions,
    isLoading,
    getFollowersCount,
    getFollowingCount,
    getConnections,
    getConnectionsAsync,
    isConnection,
    getFollowers,
    getFollowing,
    getUserById,
    getUserByUsername,
    getBlockedUsers,
    getSuggestedUsers,
    invalidateCache,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};