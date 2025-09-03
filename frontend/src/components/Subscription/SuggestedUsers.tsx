import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { usersAPI } from '../../services/api';
import { fixProfilePictureUrl } from '../../utils/apiUrlFixer';
import { User } from '../../types';
import '../Suggestions.css';

interface LocalUser {
  _id: string;
  username: string;
  profilePicture?: string;
  isStudent?: boolean;
  university?: string;
}

interface SuggestedUsersProps {
  onViewUserProfile?: (userId: string) => void;
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ onViewUserProfile }) => {
  const { user } = useAuth();
  const { followUser, unfollowUser, isFollowingSync, followers, getSuggestedUsers: getContextSuggestedUsers } = useSubscription();
  
  // Ne pas afficher les suggestions si l'utilisateur n'est pas connecté
  if (!user) {
    return null;
  }
  
  const [allUsers, setAllUsers] = useState<LocalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour gérer la persistance différentielle
  const [recentlyFollowed, setRecentlyFollowed] = useState<Set<string>>(new Set());
  const [recentlyUnfollowed, setRecentlyUnfollowed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Recharger quand l'utilisateur change
    if (user) {
      loadUsers();
    }
  }, [user]); // Seulement quand l'utilisateur change

  const getSuggestedUsers = () => {
    if (!user || !Array.isArray(allUsers)) return [];
    
    const filtered = allUsers.filter(suggestedUser => {
      // Exclure l'utilisateur actuel
      if (suggestedUser.username === user.username) {
        return false;
      }

      const userIdentifier = suggestedUser.username;
      
      // Calculer si l'utilisateur est actuellement suivi (selon la base de données)
      const isFollowingFromDB = isFollowingSync(userIdentifier);
      
      // Comportement différentiel :
      // - Exclure seulement les utilisateurs qu'on suit depuis la base de données (pas ceux récemment suivis)
      // - Les utilisateurs récemment suivis restent visibles jusqu'au refresh
      // - Les utilisateurs récemment unfollowés restent aussi visibles jusqu'au refresh
      
      if (isFollowingFromDB && !recentlyFollowed.has(userIdentifier) && !recentlyUnfollowed.has(userIdentifier)) {
        return false; // Cacher seulement ceux déjà suivis en base (pas les nouveaux)
      }
      return true; // Afficher tous les autres
    });
    
    // LIMITE IMPORTANTE : Maximum 5 suggestions
    return filtered.slice(0, 5);
  };

  const loadUsers = async () => {
    // Ne pas charger si l'utilisateur n'est pas connecté
    if (!user) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await usersAPI.getAllUsers();
      
      // Vérifier si la réponse a une propriété 'data' ou si c'est directement un tableau
      const users = Array.isArray(data) ? data : (data.data || []);
      setAllUsers(users);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setError('Erreur lors du chargement des utilisateurs');
      setAllUsers([]); // S'assurer qu'on a toujours un tableau
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (targetUser: User) => {
    try {
      await followUser(targetUser.username);
      
      // Mettre à jour l'état local
      setRecentlyFollowed(prev => new Set([...prev, targetUser.username]));
      setRecentlyUnfollowed(prev => {
        const updated = new Set(prev);
        updated.delete(targetUser.username);
        return updated;
      });
    } catch (error) {
    }
  };

  const handleUnfollow = async (targetUser: User) => {
    try {
      await unfollowUser(targetUser.username);
      
      // Mettre à jour l'état local
      setRecentlyUnfollowed(prev => new Set([...prev, targetUser.username]));
      setRecentlyFollowed(prev => {
        const updated = new Set(prev);
        updated.delete(targetUser.username);
        return updated;
      });
    } catch (error) {
    }
  };

  // Fonction helper pour convertir LocalUser vers User
  const convertLocalUserToUser = (localUser: LocalUser): User => {
    return {
      id: localUser._id,
      username: localUser.username,
      email: '', // Pas disponible dans LocalUser
      firstName: '', // Pas disponible dans LocalUser
      lastName: '', // Pas disponible dans LocalUser
      profilePicture: localUser.profilePicture,
      isStudent: localUser.isStudent,
      university: localUser.university,
      joinedAt: new Date(), // Date par défaut
    } as User;
  };

  // Fonction helper pour les appels follow/unfollow
  const handleFollowLocal = (localUser: LocalUser) => {
    handleFollow(convertLocalUserToUser(localUser));
  };

  const handleUnfollowLocal = (localUser: LocalUser) => {
    handleUnfollow(convertLocalUserToUser(localUser));
  };

  if (isLoading) {
    return (
      <div className="suggested-users">
        <h3>Suggestions pour vous</h3>
        <div className="suggestions-loading">
          <p>Chargement des suggestions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="suggested-users">
        <h3>Suggestions pour vous</h3>
        <div className="suggestions-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const suggestedUsers = getSuggestedUsers();

  return (
    <div className="suggested-users">
      <h3>Suggestions pour vous</h3>
      
      {suggestedUsers.length === 0 ? (
        <p className="no-suggestions">Aucune suggestion disponible</p>
      ) : (
        <div className="suggestions-list">
          {suggestedUsers.map(suggestedUser => {
            const userIdentifier = suggestedUser.username;
            const isCurrentlyFollowing = (isFollowingSync(userIdentifier) || recentlyFollowed.has(userIdentifier)) && !recentlyUnfollowed.has(userIdentifier);
            
            // Détection du follow-back - l'utilisateur nous suit mais on ne le suit pas
            const isFollowBack = followers.some(follower => 
              (follower.id === suggestedUser._id) || 
              ((follower as any)._id === suggestedUser._id)
            ) && !isCurrentlyFollowing;
            
            return (
              <div key={suggestedUser._id} className="suggestion-item">
                <div className="user-info">
                  <img 
                    src={(() => {
                      if (!suggestedUser.profilePicture) {
                        return '/default-profile.svg';
                      }
                      const fixedUrl = fixProfilePictureUrl(suggestedUser.profilePicture);
                      const imageSource = fixedUrl || suggestedUser.profilePicture;
                      // Si c'est une URL d'API, l'utiliser directement avec cache-busting
                      if (imageSource.startsWith('/api/') || imageSource.startsWith('http')) {
                        const separator = imageSource.includes('?') ? '&' : '?';
                        return `${imageSource}${separator}t=${Date.now()}`;
                      }
                      // Si c'est déjà du base64 complet, l'utiliser directement
                      if (imageSource.startsWith('data:')) {
                        return imageSource;
                      }
                      // Sinon, ajouter le préfixe base64
                      return `data:image/jpeg;base64,${imageSource}`;
                    })()} 
                    alt={`${suggestedUser.username} profile`}
                    className="profile-picture cursor-pointer"
                    onClick={() => onViewUserProfile?.(suggestedUser.username)}
                  />
                  <div className="user-details">
                    <span 
                      className="username cursor-pointer hover:text-blue-600"
                      onClick={() => onViewUserProfile?.(suggestedUser.username)}
                    >
                      {suggestedUser.username}
                    </span>
                    <span className="user-status">
                      {suggestedUser.isStudent ? 'Étudiant' : 'Professionnel'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => isCurrentlyFollowing ? handleUnfollowLocal(suggestedUser) : handleFollowLocal(suggestedUser)}
                  className={`follow-btn ${isCurrentlyFollowing ? 'following' : (isFollowBack ? 'follow-back' : 'not-following')}`}
                  disabled={false}
                >
                  {isCurrentlyFollowing ? 'Se désabonner' : (isFollowBack ? 'Suivre en retour' : 'Suivre')}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuggestedUsers;
