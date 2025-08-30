import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptions } from '../../contexts/SubscriptionContext';
import { usersAPI } from '../../services/api';
import '../Suggestions.css';

interface User {
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
  const { followUser, unfollowUser, isFollowingSync } = useSubscriptions();
  // DEBUG rendu initial à chaque render
  if (typeof window !== 'undefined') {
    (window as any).__debugSuggestedUsersRenderCount = ((window as any).__debugSuggestedUsersRenderCount || 0) + 1;
  }
  console.log('[SuggestedUsers] Render start user?', !!user, user ? Object.keys(user) : 'no-user');
  
  // On décale le early-return plus bas après instrumentation pour confirmer le montage
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour gérer la persistance différentielle
  const [recentlyFollowed, setRecentlyFollowed] = useState<Set<string>>(new Set());
  const [recentlyUnfollowed, setRecentlyUnfollowed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      // Essayer plusieurs identifiants possibles (id / _id)
      const displayId = (user as any).id || (user as any)._id || 'no-id';
      console.log('[SuggestedUsers] useEffect déclenché – chargement utilisateurs pour', user.username, 'id=', displayId);
      loadUsers();
    } else {
      console.log('[SuggestedUsers] useEffect: pas d\'utilisateur (attente)');
    }
  // Dépendre de l'objet user entier pour éviter le cas où user.id est undefined
  }, [user]);

  const loadUsers = async () => {
    // Ne pas charger si l'utilisateur n'est pas connecté
    if (!user) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
  const data = await usersAPI.getAllUsers();
  console.log('[SuggestedUsers] Réponse brute getAllUsers =', data);
  const users = Array.isArray(data) ? data : (data?.data || []);
  setAllUsers(users);
  console.log('[SuggestedUsers] Utilisateurs chargés:', users.length, 'ex first=', users[0]);
    } catch (error) {
      console.error('[SuggestedUsers] Erreur lors du chargement des utilisateurs:', error);
      setError('Erreur lors du chargement des utilisateurs');
      setAllUsers([]);
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

  const getSuggestedUsers = () => {
    if (!user || !Array.isArray(allUsers)) return [];
    
    return allUsers.filter(suggestedUser => {
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

  // Si l'utilisateur est finalement absent, on arrête ici (après instrumentation précédente)
  if (!user) {
    if (typeof window !== 'undefined') {
      (window as any).__debugSuggestedUsers = { reason: 'no-user-after-instrumentation' };
    }
    return null;
  }

  const suggestedUsers = getSuggestedUsers();
  if (typeof window !== 'undefined') {
    (window as any).__debugSuggestedUsers = {
      allUsers: allUsers.length,
      suggested: suggestedUsers.length,
      isLoading,
      error,
      user: user?.username,
      renderCount: (window as any).__debugSuggestedUsersRenderCount
    };
  }

  return (
  <div className="suggested-users border border-blue-200 rounded-lg">
      <h3>Suggestions pour vous</h3>
      
      {suggestedUsers.length === 0 ? (
  <p className="no-suggestions text-sm text-gray-500">Aucune suggestion disponible (debug: all={allUsers.length})</p>
      ) : (
        <div className="suggestions-list">
          {suggestedUsers.map(suggestedUser => {
            const userIdentifier = suggestedUser.username;
            const isCurrentlyFollowing = (isFollowingSync(userIdentifier) || recentlyFollowed.has(userIdentifier)) && !recentlyUnfollowed.has(userIdentifier);
            
            return (
              <div key={suggestedUser._id} className="suggestion-item">
                <div className="user-info">
                  <img 
                    src={suggestedUser.profilePicture || '/default-profile.svg'} 
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
                  onClick={() => isCurrentlyFollowing ? handleUnfollow(suggestedUser) : handleFollow(suggestedUser)}
                  className={`follow-btn ${isCurrentlyFollowing ? 'following' : 'not-following'}`}
                  disabled={false}
                >
                  {isCurrentlyFollowing ? 'Se désabonner' : 'Suivre'}
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
