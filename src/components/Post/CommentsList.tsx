import React, { useState, useEffect, useCallback } from 'react';
import { Heart, User } from 'lucide-react';
import { postsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Author {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  university?: string;
  isStudent: boolean;
  bio?: string;
  profilePicture?: string;
}

interface CommentData {
  _id: string;
  content: string;
  authorId: Author;
  createdAt: string;
  likedBy?: string[]; // Array des IDs des utilisateurs qui ont liké
}

interface CommentsListProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onViewUserProfile?: (userId: string) => void;
}

const CommentsList: React.FC<CommentsListProps> = ({ 
  postId, 
  isOpen, 
  onClose,
  onViewUserProfile
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Fonction pour charger les commentaires
  const loadComments = useCallback(async (pageNumber: number = 1, reset: boolean = false) => {
    if (loading || (initialLoadDone && pageNumber === 1)) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await postsAPI.getComments(postId, pageNumber, 12);
      
      if (response.success) {
        const newComments = response.comments;
        
        // Marquer le chargement initial comme terminé
        if (pageNumber === 1) {
          setInitialLoadDone(true);
        }
        
        // Si aucun nouveau commentaire, arrêter le chargement
        if (newComments.length === 0) {
          setHasMore(false);
          return;
        }
        
        if (reset) {
          setComments(newComments);
        } else {
          setComments(prev => [...prev, ...newComments]);
        }
        
        setHasMore(response.pagination.hasMore);
        setPage(pageNumber);
      } else {
        setError(response.message || 'Erreur lors du chargement des commentaires');
        setHasMore(false);
        if (pageNumber === 1) {
          setInitialLoadDone(true);
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement des commentaires');
      setHasMore(false);
      if (pageNumber === 1) {
        setInitialLoadDone(true);
      }
    } finally {
      setLoading(false);
    }
  }, [postId, loading, initialLoadDone]);

  // Fonction pour liker/déliker un commentaire
  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    try {
      const comment = comments.find(c => c._id === commentId);
      if (!comment) return;

      const isLiked = (comment.likedBy || []).includes(user.id);
      
      // Mise à jour optimiste de l'état local
      setComments(prevComments => 
        prevComments.map(c => {
          if (c._id === commentId) {
            const newLikedBy = [...(c.likedBy || [])];
            if (isLiked) {
              // Retirer le like
              const index = newLikedBy.indexOf(user.id);
              if (index > -1) {
                newLikedBy.splice(index, 1);
              }
            } else {
              // Ajouter le like
              newLikedBy.push(user.id);
            }
            return { ...c, likedBy: newLikedBy };
          }
          return c;
        })
      );

      // Effectuer la requête API en arrière-plan
      if (isLiked) {
        await postsAPI.unlikeComment(postId, commentId);
      } else {
        await postsAPI.likeComment(postId, commentId);
      }
    } catch (error) {
      // En cas d'erreur, recharger les commentaires pour restaurer l'état correct
      loadComments(1, true);
    }
  };

  // Charger plus de commentaires
  const loadMoreComments = useCallback(() => {
    if (hasMore && !loading) {
      loadComments(page + 1, false);
    }
  }, [hasMore, loading, page, loadComments]);

  // Gestionnaire de scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Déclencher le chargement quand on est à 200px du bas ET qu'il y a encore du contenu
    if (scrollHeight - scrollTop <= clientHeight + 200 && hasMore && !loading) {
      loadMoreComments();
    }
  }, [loadMoreComments, hasMore, loading]);

  // Charger les commentaires au premier rendu
  useEffect(() => {
    if (isOpen && !initialLoadDone) {
      loadComments(1, true);
    }
  }, [isOpen, loadComments, initialLoadDone]);

  // Réinitialiser l'état quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setComments([]);
      setInitialLoadDone(false);
      setHasMore(true);
      setPage(1);
      setError(null);
    }
  }, [isOpen]);

  // Fonction pour naviguer vers le profil utilisateur
  const handleUserClick = (userId: string) => {
    if (onViewUserProfile) {
      onViewUserProfile(userId);
      onClose(); // Fermer le modal après navigation
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Fermer le modal seulement si on clique sur le backdrop
        if (e.target === e.currentTarget) {
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col transform transition-all"
        onClick={(e) => {
          // Empêcher la propagation du clic depuis le contenu de la modal
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Commentaires</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments List */}
        <div 
          className="flex-1 overflow-y-auto px-6 py-4"
          onScroll={handleScroll}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment._id} className="flex space-x-3 items-center">
                {/* Avatar aligné avec le centre du cadre gris - cliquable */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleUserClick(comment.authorId._id)}
                    className="block rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {comment.authorId.profilePicture ? (
                      <img
                        src={comment.authorId.profilePicture}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-2 ring-gray-100">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Comment Content avec nouvelle mise en page */}
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-2xl px-4 py-3 relative">
                    {/* Header avec nom d'utilisateur et bouton like en haut à droite */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUserClick(comment.authorId._id)}
                          className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors focus:outline-none focus:text-blue-600"
                        >
                          {comment.authorId.firstName && comment.authorId.lastName
                            ? `${comment.authorId.firstName} ${comment.authorId.lastName}`
                            : comment.authorId.username
                          }
                        </button>
                        {comment.authorId.isStudent && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            Étudiant
                          </span>
                        )}
                      </div>
                      
                      {/* Bouton like en haut à droite du cadre gris */}
                      <button
                        onClick={() => handleLikeComment(comment._id)}
                        className={`flex items-center space-x-1 text-sm transition-colors ${
                          user && (comment.likedBy || []).includes(user.id) 
                            ? 'text-red-600' 
                            : 'text-gray-500 hover:text-red-600'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${
                          user && (comment.likedBy || []).includes(user.id) ? 'fill-current' : ''
                        }`} />
                        <span>{(comment.likedBy || []).length}</span>
                      </button>
                    </div>
                    
                    {/* Contenu du commentaire */}
                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                      {comment.content}
                    </p>
                    
                    {/* Date et université en bas à droite du cadre gris */}
                    <div className="flex justify-end">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="font-medium">
                          {formatDate(comment.createdAt)}
                        </span>
                        {comment.authorId.university && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{comment.authorId.university}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
            </div>
          )}

          {/* No comments message */}
          {comments.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun commentaire</h3>
              <p className="text-gray-500 text-sm">Soyez le premier à commenter cette publication</p>
            </div>
          )}
        </div>

        {/* Load more button (fallback) */}
        {hasMore && !loading && comments.length > 0 && (
          <div className="px-6 pb-6">
            <button
              onClick={loadMoreComments}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-sm"
            >
              Charger plus de commentaires
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsList;
