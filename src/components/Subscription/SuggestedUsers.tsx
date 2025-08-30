// FUSED VERSION: Combine logic from legacy (direct fetch '/api/users') and frontend (usersAPI.getAllUsers)
// Provides robust debug instrumentation and a single source of truth.
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptions } from '../../contexts/SubscriptionContext';
// Attempt to import usersAPI; if not present in this build path it will be undefined.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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

  // Unified debug counters
  if (typeof window !== 'undefined') {
    (window as any).__debugSuggestedUsersWhichFile = 'src-fused';
    (window as any).__debugSuggestedUsersRenderCount = ((window as any).__debugSuggestedUsersRenderCount || 0) + 1;
  }
  console.log('[SuggestedUsers-FUSED] Render start. hasUser=', !!user, 'userKeys=', user ? Object.keys(user) : 'none');

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentlyFollowed, setRecentlyFollowed] = useState<Set<string>>(new Set());
  const [recentlyUnfollowed, setRecentlyUnfollowed] = useState<Set<string>>(new Set());

  const normalizeUsers = (raw: any): User[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as User[];
    if (Array.isArray(raw?.data)) return raw.data as User[];
    return [];
  };

  const loadUsers = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      let users: User[] = [];
      let source = 'none';
      // Try usersAPI first (frontend version)
      if (typeof usersAPI !== 'undefined' && usersAPI?.getAllUsers) {
        try {
          const data = await usersAPI.getAllUsers();
          users = normalizeUsers(data);
          source = 'usersAPI.getAllUsers';
        } catch (e) {
          console.warn('[SuggestedUsers-FUSED] usersAPI.getAllUsers failed, fallback fetch /api/users', e);
        }
      }
      // Fallback to direct fetch (legacy)
      if (!users.length) {
        const resp = await fetch('/api/users', { credentials: 'include' });
        source = '/api/users';
        if (resp.ok) {
          const data = await resp.json();
            users = normalizeUsers(data);
        } else {
          throw new Error('Fetch /api/users failed status=' + resp.status);
        }
      }
      console.log('[SuggestedUsers-FUSED] Users loaded count=', users.length, 'source=', source, 'first=', users[0]);
      setAllUsers(users);
    } catch (e: any) {
      console.error('[SuggestedUsers-FUSED] loadUsers error', e);
      setError('Erreur lors du chargement des utilisateurs');
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const displayId = (user as any).id || (user as any)._id || 'no-id';
      console.log('[SuggestedUsers-FUSED] useEffect trigger load for', user.username, 'id=', displayId);
      loadUsers();
    } else {
      console.log('[SuggestedUsers-FUSED] useEffect: no user yet');
    }
  }, [user, loadUsers]);

  const handleFollow = async (targetUser: User) => {
    try {
      await followUser(targetUser.username);
      setRecentlyFollowed(prev => new Set([...prev, targetUser.username]));
      setRecentlyUnfollowed(prev => {
        const updated = new Set(prev); updated.delete(targetUser.username); return updated; });
    } catch { /* swallow */ }
  };

  const handleUnfollow = async (targetUser: User) => {
    try {
      await unfollowUser(targetUser.username);
      setRecentlyUnfollowed(prev => new Set([...prev, targetUser.username]));
      setRecentlyFollowed(prev => { const updated = new Set(prev); updated.delete(targetUser.username); return updated; });
    } catch { /* swallow */ }
  };

  const getSuggestedUsers = (): User[] => {
    if (!user || !Array.isArray(allUsers)) return [];
    return allUsers.filter(suggestedUser => {
      if (suggestedUser.username === user.username) return false;
      const id = suggestedUser.username;
      const isFollowingFromDB = isFollowingSync(id);
      if (isFollowingFromDB && !recentlyFollowed.has(id) && !recentlyUnfollowed.has(id)) return false;
      return true;
    });
  };

  if (!user) {
    if (typeof window !== 'undefined') {
      (window as any).__debugSuggestedUsers = { reason: 'no-user-fused' };
    }
    return null;
  }

  if (isLoading) {
    return (
      <div className="suggested-users border border-yellow-300 rounded p-2">
        <h3>Suggestions pour vous</h3>
        <div className="suggestions-loading"><p>Chargement des suggestions...</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="suggested-users border border-red-300 rounded p-2">
        <h3>Suggestions pour vous</h3>
        <div className="suggestions-error"><p>{error}</p></div>
      </div>
    );
  }

  const suggestedUsers = getSuggestedUsers();
  if (typeof window !== 'undefined') {
    (window as any).__debugSuggestedUsers = {
      fused: true,
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
            const id = suggestedUser.username;
            const isCurrentlyFollowing = (isFollowingSync(id) || recentlyFollowed.has(id)) && !recentlyUnfollowed.has(id);
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
                    >{suggestedUser.username}</span>
                    <span className="user-status">{suggestedUser.isStudent ? 'Étudiant' : 'Professionnel'}</span>
                  </div>
                </div>
                <button
                  onClick={() => isCurrentlyFollowing ? handleUnfollow(suggestedUser) : handleFollow(suggestedUser)}
                  className={`follow-btn ${isCurrentlyFollowing ? 'following' : 'not-following'}`}
                >{isCurrentlyFollowing ? 'Se désabonner' : 'Suivre'}</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuggestedUsers;
