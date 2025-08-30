import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptions } from '../../contexts/SubscriptionContext';
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

  // DEBUG rendu initial à chaque render (legacy src version)
  if (typeof window !== 'undefined') {
    (window as any).__debugSuggestedUsersLegacyRenderCount = ((window as any).__debugSuggestedUsersLegacyRenderCount || 0) + 1;
  }
  console.log('[SuggestedUsers-LEGACY] Render start user?', !!user, user ? Object.keys(user) : 'no-user');
  // On retarde le early-return après instrumentation (plus bas)
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour gérer la persistance différentielle
  const [recentlyFollowed, setRecentlyFollowed] = useState<Set<string>>(new Set());
  const [recentlyUnfollowed, setRecentlyUnfollowed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      const displayId = (user as any).id || (user as any)._id || 'no-id';
      console.log('[SuggestedUsers-LEGACY] useEffect load users for', user.username, 'id=', displayId);
      loadUsers();
    } else {
      console.log('[SuggestedUsers-LEGACY] useEffect: no user yet');
    }
  }, [user]);

  const loadUsers = async () => {
    // Ne pas charger si l'utilisateur n'est pas connecté
    if (!user) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users', { credentials: 'include' });
      console.log('[SuggestedUsers-LEGACY] /api/users status', response.status);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      console.log('[SuggestedUsers-LEGACY] Raw users response', data);
      const users = Array.isArray(data) ? data : (data?.data || []);
      setAllUsers(users);
      console.log('[SuggestedUsers-LEGACY] Users loaded count=', users.length, 'first=', users[0]);
    } catch (error) {
      console.error('[SuggestedUsers-LEGACY] Load error', error);
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

  // Early return si utilisateur finalement absent (après instrumentation)
  if (!user) {
    if (typeof window !== 'undefined') {
      (window as any).__debugSuggestedUsers = { reason: 'no-user-legacy' };
    }
    return null;
  }

  if (isLoading) {
    return (
      <div className="suggested-users border border-yellow-300 rounded p-2">
        <h3>Suggestions pour vous</h3>
        <div className="suggestions-loading">
          <p>Chargement des suggestions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="suggested-users border border-red-300 rounded p-2">
        <h3>Suggestions pour vous</h3>
        <div className="suggestions-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const suggestedUsers = getSuggestedUsers();
  if (typeof window !== 'undefined') {
    (window as any).__debugSuggestedUsers = {
      legacy: true,
      allUsers: allUsers.length,
      suggested: suggestedUsers.length,
      isLoading,
      error,
      user: user?.username,
      renderCount: (window as any).__debugSuggestedUsersLegacyRenderCount
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
