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
  
  // Debug temporaire
  console.log('[SuggestedUsers] Render - user:', !!user, user?.username);
  
  // Ne pas afficher les suggestions si l'utilisateur n'est pas connecté
  if (!user) {
    console.log('[SuggestedUsers] No user - returning null');
    return (
      <div className="suggested-users">
        <h3>Suggestions pour vous</h3>
        <p className="text-red-500">Non connecté - Debug temporaire</p>
      </div>
    );
  }
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour gérer la persistance différentielle
  const [recentlyFollowed, setRecentlyFollowed] = useState<Set<string>>(new Set());
  const [recentlyUnfollowed, setRecentlyUnfollowed] = useState<Set<string>>(new Set());

  // Debug temporaire - vérifier si le composant se monte
  console.log('[SuggestedUsers] Component mounting/rendering');

  useEffect(() => {
    // Recharger quand l'utilisateur change
    if (user) {
      console.log('[SuggestedUsers] Loading users for:', user.username);
      loadUsers();
    }
  }, [user]); // Seulement quand l'utilisateur change

  const loadUsers = async () => {
    // Ne pas charger si l'utilisateur n'est pas connecté
    if (!user) {
      console.log('[SuggestedUsers] loadUsers - no user, returning');
      return;
    }
    
    console.log('[SuggestedUsers] loadUsers - starting for user:', user.username);
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await usersAPI.getAllUsers();
      console.log('[SuggestedUsers] loadUsers - API response:', data);
      
      // Vérifier si la réponse a une propriété 'data' ou si c'est directement un tableau
      const users = Array.isArray(data) ? data : (data.data || []);
      console.log('[SuggestedUsers] loadUsers - processed users:', users.length, 'users');
      setAllUsers(users);
    } catch (error) {
      console.error('[SuggestedUsers] Erreur lors du chargement des utilisateurs:', error);
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
  console.log('[SuggestedUsers] Render - suggestedUsers:', suggestedUsers.length, 'allUsers:', allUsers.length, 'isLoading:', isLoading, 'error:', error);

  return (
    <div className="suggested-users" style={{ border: '2px solid red', padding: '10px', margin: '10px' }}>
      <h3>Suggestions pour vous [DEBUG]</h3>
      <div style={{ fontSize: '12px', color: 'blue', marginBottom: '10px' }}>
        Debug: {suggestedUsers.length} suggestions, {allUsers.length} total users, Loading: {isLoading ? 'Yes' : 'No'}
      </div>
      
      {suggestedUsers.length === 0 ? (
        <p className="no-suggestions">Aucune suggestion disponible</p>
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
