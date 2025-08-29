import React, { useState, useEffect } from 'react';
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

const LikesList: React.FC<LikesListProps> = ({ 
  postId, 
  isOpen, 
  onClose, 
  onViewUserProfile 
}) => {
  const [users, setUsers] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [allUsersLoaded, setAllUsersLoaded] = useState<LikeUser[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Fonction pour charger TOUS les utilisateurs qui ont liké (une seule fois)
  const loadAllUsers = async () => {
    if (loading || initialLoadDone) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await postsAPI.getLikes(postId);
      
      if (response.success) {
        const allUsers = response.users || [];
        setAllUsersLoaded(allUsers);
        setInitialLoadDone(true);
        
        // Afficher la première page
        const usersPerPage = 12;
        const paginatedUsers = allUsers.slice(0, usersPerPage);
        setUsers(paginatedUsers);
        setHasMore(usersPerPage < allUsers.length);
        setPage(1);
      } else {
        setError(response.message || 'Erreur lors du chargement des likes');
        setHasMore(false);
      }
    } catch (err) {
      setError('Erreur lors du chargement des likes');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger la page suivante depuis les données déjà chargées
  const loadNextPage = () => {
    if (!initialLoadDone || loading || !hasMore) {
      return;
    }
    
    const usersPerPage = 12;
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const paginatedUsers = allUsersLoaded.slice(startIndex, endIndex);
    
    if (paginatedUsers.length === 0) {
      setHasMore(false);
    } else {
      setUsers(prev => [...prev, ...paginatedUsers]);
      setHasMore(endIndex < allUsersLoaded.length);
      setPage(nextPage);
    }
  };

  // Charger plus d'utilisateurs
  const loadMoreUsers = () => {
    if (hasMore && !loading) {
      loadNextPage();
    }
  };

  // Gestionnaire de scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Déclencher le chargement quand on est à 200px du bas ET qu'il y a encore du contenu
    if (scrollHeight - scrollTop <= clientHeight + 200 && hasMore && !loading) {
      loadMoreUsers();
    }
  };

  // Reset quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setUsers([]);
      setAllUsersLoaded([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      setInitialLoadDone(false);
    }
  }, [isOpen]);

  // Charger les données au premier rendu
  useEffect(() => {
    if (isOpen && !initialLoadDone) {
      loadAllUsers();
    }
  }, [isOpen, initialLoadDone]);

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

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        // Fermer la modal si on clique sur l'overlay (pas sur le contenu)
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
      onMouseDown={(e) => {
        // Empêcher la propagation des événements de souris
        if (e.target === e.currentTarget) {
          e.stopPropagation();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[70vh] flex flex-col"
        onClick={(e) => {
          // Empêcher la propagation du clic depuis le contenu de la modal
          e.stopPropagation();
        }}
      >
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

          {users.map((user) => {
            return (
              <div 
                key={user._id} 
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                onClick={() => onViewUserProfile(user._id)}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture.startsWith('data:') ? user.profilePicture : `data:image/jpeg;base64,${user.profilePicture}`}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center ${user.profilePicture ? 'hidden' : ''}`}>
                    <User className="h-6 w-6 text-white" />
                  </div>
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
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* No more users message */}
          {!hasMore && users.length > 0 && (
            <div className="text-center text-gray-500 py-4 text-sm">
              {users.length > 1 ? `Tous les ${users.length} utilisateurs chargés` : 'Tous les utilisateurs chargés'}
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
              onClick={loadMoreUsers}
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

export default LikesList;
