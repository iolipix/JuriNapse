import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'lucide-react';
import { postsAPI } from '../../services/api';

interface LikeUser {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  university?: string;
  isStudent: boolean;
  bio?: string;
  profilePicture?: string;
  likedAt?: string;
}

interface LikesListProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onViewUserProfile: (userId: string) => void;
}

const LikesListSimple: React.FC<LikesListProps> = ({ 
  postId, 
  isOpen, 
  onClose, 
  onViewUserProfile 
}) => {
  const [users, setUsers] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayedUsers, setDisplayedUsers] = useState<LikeUser[]>([]);
  const [displayCount, setDisplayCount] = useState(12);

  // Fonction pour charger tous les utilisateurs qui ont liké
  const loadUsers = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await postsAPI.getLikes(postId);
      
      if (response.success) {
        const allUsers = response.users || [];
        setUsers(allUsers);
        setDisplayedUsers(allUsers.slice(0, 12));
        setDisplayCount(12);
      } else {
        setError(response.message || 'Erreur lors du chargement des likes');
      }
    } catch (err) {
      setError('Erreur lors du chargement des likes');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour afficher plus d'utilisateurs
  const showMoreUsers = useCallback(() => {
    const newDisplayCount = displayCount + 12;
    setDisplayedUsers(users.slice(0, newDisplayCount));
    setDisplayCount(newDisplayCount);
  }, [users, displayCount]);

  // Gestionnaire de scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Déclencher le chargement quand on est à 200px du bas ET qu'il y a encore du contenu
    if (scrollHeight - scrollTop <= clientHeight + 200 && displayCount < users.length) {
      showMoreUsers();
    }
  }, [showMoreUsers, displayCount, users.length]);

  // Charger les utilisateurs au premier rendu
  useEffect(() => {
    if (isOpen) {
      setUsers([]);
      setDisplayedUsers([]);
      setDisplayCount(12);
      setError(null);
      loadUsers();
    }
  }, [isOpen, postId]);

  // Fonction pour formater la date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  if (!isOpen) return null;

  const hasMore = displayCount < users.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Likes</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Users List */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-3"
          onScroll={handleScroll}
        >
          {error && (
            <div className="text-red-500 text-center py-4">
              {error}
            </div>
          )}

          {displayedUsers.map((user) => (
            <div 
              key={user._id} 
              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              onClick={() => onViewUserProfile(user._id)}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {user.profilePicture ? (
                  <img
                    src={`data:image/jpeg;base64,${user.profilePicture}`}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900 truncate">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.username
                    }
                  </h4>
                  {user.isStudent && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Étudiant
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>@{user.username}</span>
                  {user.university && (
                    <span>• {user.university}</span>
                  )}
                  {user.likedAt && (
                    <span>• {formatDate(user.likedAt)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* No more users message */}
          {!hasMore && users.length > 0 && (
            <div className="text-center text-gray-500 py-4 text-sm">
              {users.length === 1 ? 'Seul utilisateur ayant liké' : `Tous les ${users.length} utilisateurs chargés`}
            </div>
          )}

          {/* No users message */}
          {users.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-8">
              Aucun like pour le moment
            </div>
          )}
        </div>

        {/* Load more button (fallback) */}
        {hasMore && !loading && users.length > 0 && (
          <div className="p-4 border-t">
            <button
              onClick={showMoreUsers}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Charger plus d'utilisateurs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikesListSimple;
