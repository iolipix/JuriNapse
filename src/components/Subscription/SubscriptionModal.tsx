import React, { useState, useEffect } from 'react';
import { X, Users, User, UserCheck, Crown, UserPlus } from 'lucide-react';
import { useSubscriptions } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { User as UserType } from '../../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following' | 'connections';
  onViewUserProfile: (userId: string) => void;
  onProfileClick?: () => void; // Nouvelle prop pour rediriger vers le profil de l'utilisateur connecté
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userId,
  type,
  onViewUserProfile,
  onProfileClick // Nouvelle prop
}) => {
  const { user: currentUser } = useAuth();
  const {
    followers,
    followUser,
    unfollowUser,
    getFollowing,
    getFollowers,
    isConnection
  } = useSubscriptions();

  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'connections'>(type);
  const [unfollowedUsers, setUnfollowedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [connections, setConnections] = useState<UserType[]>([]);
  const [followersData, setFollowers] = useState<UserType[]>([]);
  const [initialFollowing, setInitialFollowing] = useState<UserType[]>([]);

  // Déterminer si on regarde son propre profil
  const isOwnProfile = currentUser && (
    currentUser.id === userId || 
    currentUser.username === userId
  );

  useEffect(() => {
    setActiveTab(type);
  }, [type]);

  // Charger les données quand le modal s'ouvre
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen || !userId) return;
      
      try {
        setLoading(true);
        setUnfollowedUsers(new Set());
        
        const [followersData, followingData] = await Promise.all([
          getFollowers(userId),
          getFollowing(userId)
        ]);
        
        setFollowers(Array.isArray(followersData) ? followersData : []);
        setInitialFollowing(Array.isArray(followingData) ? followingData : []);
        
        // Calculer les connexions côté frontend (abonnements mutuels)
        // Une connexion = quelqu'un qui suit ce profil ET que ce profil suit en retour
        const connectionsData = followersData.filter(follower => {
          // Chercher si ce follower est aussi dans les abonnements
          return followingData.some(following => {
            // Comparaison par ID ou username pour plus de robustesse
            return (follower.id && following.id && follower.id === following.id) ||
                   (follower.username && following.username && follower.username === following.username);
          });
        });
        
        setConnections(Array.isArray(connectionsData) ? connectionsData : []);
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setFollowers([]);
        setInitialFollowing([]);
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isOpen, userId, getFollowers, getFollowing]);

  if (!isOpen) return null;
  
  if (loading) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            (e.currentTarget as any)._mouseDownOnBackdrop = true;
          }
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && (e.currentTarget as any)._mouseDownOnBackdrop) {
            onClose();
          }
          (e.currentTarget as any)._mouseDownOnBackdrop = false;
        }}
      >
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    switch (activeTab) {
      case 'followers': return `Abonnés (${followersData?.length || 0})`;
      case 'following': return `Abonnements (${initialFollowing?.length || 0})`;
      case 'connections': return `Connexions (${connections?.length || 0})`;
      default: return 'Abonnements';
    }
  };

  const getCurrentUsers = (): UserType[] => {
    switch (activeTab) {
      case 'followers': return followersData || [];
      case 'following': return initialFollowing || []; // Utiliser la liste initiale
      case 'connections': return connections || [];
      default: return [];
    }
  };

  const currentUsers = getCurrentUsers();

  // Fonction pour gérer le désabonnement (local seulement)
  const handleUnfollow = async (targetUserId: string) => {
    try {
      // Seulement ajouter à la liste des utilisateurs "unfollowed" localement
      setUnfollowedUsers(prev => new Set([...prev, targetUserId]));
      
      // L'appel API sera fait à la fermeture de la modal
    } catch (error) {
      // Gestion d'erreur silencieuse
    }
  };

  // Fonction pour gérer le réabonnement (annuler le désabonnement local)
  const handleRefollow = async (targetUserId: string) => {
    try {
      // Si l'utilisateur était marqué pour désabonnement local, simplement annuler cette action
      if (unfollowedUsers.has(targetUserId)) {
        setUnfollowedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });
        return;
      }
      
      // Sinon, appliquer un vrai réabonnement
      await followUser(targetUserId);
    } catch (error) {
      // Gestion d'erreur silencieuse
    }
  };

  // Fonction pour gérer un nouveau suivi (pour l'onglet followers)
  const handleFollow = async (targetUserId: string) => {
    try {
      await followUser(targetUserId);
      // Mettre à jour la liste locale des following pour la cohérence UI
      setInitialFollowing(prev => {
        // Vérifier si l'utilisateur n'est pas déjà dans la liste
        const isAlreadyFollowing = prev.some(user => 
          (user.id || user.username) === targetUserId
        );
        if (!isAlreadyFollowing) {
          // Trouver l'utilisateur dans la liste des followers pour l'ajouter aux following
          const userToAdd = followers.find(user => 
            (user.id || user.username) === targetUserId
          );
          if (userToAdd) {
            return [...prev, userToAdd];
          }
        }
        return prev;
      });
    } catch (error) {
      // Gestion d'erreur silencieuse
    }
  };

  // Fonction pour appliquer les changements quand la modal se ferme
  const applyPendingChanges = async () => {
    // Appliquer tous les désabonnements en attente
    for (const userId of unfollowedUsers) {
      try {
        await unfollowUser(userId);
      } catch (error) {
        // Gestion d'erreur silencieuse
      }
    }
    
    // Recharger les données depuis le serveur pour avoir les dernières informations
    if (unfollowedUsers.size > 0) {
      try {
        const followingData = await getFollowing(userId);
        setInitialFollowing(Array.isArray(followingData) ? [...followingData] : []);
      } catch (error) {
        // En cas d'erreur, filtrer manuellement les utilisateurs désabonnés
        setInitialFollowing(prev => 
          prev.filter(user => {
            const userIdToCheck = user.id || user.username;
            return !unfollowedUsers.has(userIdToCheck);
          })
        );
      }
    }
    
    // Réinitialiser les changements en attente
    setUnfollowedUsers(new Set());
  };

  // Fonction pour fermer la modal et appliquer les changements
  const handleClose = () => {
    applyPendingChanges();
    onClose();
  };

  const getUserStatus = (user: UserType) => {
    const currentUserId = user.id || user.username;
    
    // *** NOUVELLE VÉRIFICATION: Ne jamais afficher de bouton pour son propre compte ***
    if (currentUser && (
      currentUser.id === currentUserId ||
      currentUser.username === currentUserId
    )) {
      return null; // Pas de bouton pour soi-même
    }
    
    // Si l'utilisateur a été "unfollowed" temporairement
    if (unfollowedUsers.has(currentUserId)) {
      return { 
        label: 'Suivre', 
        color: 'text-blue-600', 
        icon: UserPlus,
        action: () => handleRefollow(currentUserId)
      };
    }
    
    // Si on regarde son propre profil, comportement de gestion des abonnements
    if (isOwnProfile) {
      // Priorité à l'onglet actuel - si on est dans "following", afficher "Suivi" même si c'est une connexion
      if (activeTab === 'following') {
        return { 
          label: 'Suivi', 
          color: 'text-green-600', 
          icon: UserCheck,
          action: () => handleUnfollow(currentUserId)
        };
      }
      
      // Pour l'onglet "followers", vérifier si on suit déjà cette personne en retour
      if (activeTab === 'followers') {
        // Si c'est une connexion, afficher "Connexion"
        if (isConnection(currentUserId)) {
          return { label: 'Connexion', color: 'text-purple-600', icon: Crown, action: null };
        }
        
        // Vérifier si on suit déjà cette personne
        const isFollowing = initialFollowing.some(user => 
          (user.id || user.username) === currentUserId
        );
        
        if (isFollowing) {
          return { 
            label: 'Suivi', 
            color: 'text-green-600', 
            icon: UserCheck,
            action: () => handleUnfollow(currentUserId)
          };
        } else {
          return { 
            label: 'Suivre', 
            color: 'text-blue-600', 
            icon: UserPlus,
            action: () => handleFollow(currentUserId)
          };
        }
      }
      
      // Pour l'onglet "connections" de son propre profil, afficher "Connexion"
      if (activeTab === 'connections' && isConnection(currentUserId)) {
        return { label: 'Connexion', color: 'text-purple-600', icon: Crown, action: null };
      }
    } 
    // Si on regarde le profil de quelqu'un d'autre, pas de boutons d'action
    else {
      // Sur le profil d'un autre, on affiche seulement le statut sans possibilité de modifier
      return null; // Pas de bouton sur les profils d'autres utilisateurs
    }

    return null;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onMouseDown={(e) => {
        // Sauvegarder si le mousedown est sur le backdrop
        if (e.target === e.currentTarget) {
          (e.currentTarget as any)._mouseDownOnBackdrop = true;
        }
      }}
      onClick={(e) => {
        // Ne fermer que si mousedown ET click sont sur le backdrop
        if (e.target === e.currentTarget && (e.currentTarget as any)._mouseDownOnBackdrop) {
          handleClose();
        }
        // Nettoyer le flag
        (e.currentTarget as any)._mouseDownOnBackdrop = false;
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{getTitle()}</h3>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'followers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Abonnés ({followersData.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'following'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Abonnements ({initialFollowing.length})
          </button>
          {/* L'onglet Connexions est maintenant affiché pour tous les profils */}
          <button
            onClick={() => setActiveTab('connections')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'connections'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Connexions ({connections.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">
                {activeTab === 'followers' && 'Aucun abonné pour le moment'}
                {activeTab === 'following' && 'Aucun abonnement pour le moment'}
                {activeTab === 'connections' && 'Aucune connexion pour le moment'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentUsers.map((user, index) => {
                const status = getUserStatus(user);
                
                return (
                  <div
                    key={user.id || user.username || `user-${index}`}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <button
                      onClick={() => {
                        // Si c'est l'utilisateur connecté, rediriger vers son vrai profil
                        if (currentUser && (
                          currentUser.id === (user.id || user.username) ||
                          currentUser.username === (user.id || user.username)
                        )) {
                          if (onProfileClick) {
                            onProfileClick();
                          }
                        } else {
                          // Sinon, utiliser la navigation normale
                          onViewUserProfile(user.id || user.username);
                        }
                        handleClose();
                      }}
                      className="flex items-center space-x-3 flex-1 text-left"
                    >
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.profilePicture ? (
                          <img 
                            src={user.profilePicture} 
                            alt={user.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          @{user.username}
                        </p>
                        {user.university && (
                          <p className="text-xs text-gray-400 truncate">
                            {user.university}
                          </p>
                        )}
                      </div>
                    </button>
                    
                    {status && status.action && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          status.action();
                        }}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          status.label === 'Suivre' 
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <status.icon className="h-3 w-3" />
                        <span>{status.label}</span>
                      </button>
                    )}
                    
                    {status && !status.action && (
                      <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                        status.color === 'text-purple-600' ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        <status.icon className="h-3 w-3" />
                        <span className={status.color}>{status.label}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;