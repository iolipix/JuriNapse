import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Heart, MessageCircle, Send, User, Clock, FileText, BookOpen, ChevronDown, SortAsc, SortDesc, TrendingUp, MoreVertical, Edit, Trash2, Check, X } from 'lucide-react';
import { usePost } from '../../contexts';
import { useAuth } from '../../contexts/AuthContext';
import { postsAPI } from '../../services/api';
import PostCard from './PostCard';
import PostSEO from './PostSEO';
import SimpleAdBanner from '../Ads/SimpleAdBanner';
import { WideSkyscraper } from '../Ads';

interface PostDetailPageProps {
  postId: string;
  onBack: () => void;
  onLogin: () => void;
  onViewUserProfile: (userId: string) => void;
  onTagClick: (tag: string) => void;
  onViewDecision?: (decisionNumber: string) => void;
  onViewPost?: (postId: string) => void;
}

type CommentSortType = 'newest' | 'oldest' | 'most-liked';

const PostDetailPage: React.FC<PostDetailPageProps> = ({ 
  postId, 
  onBack, 
  onLogin, 
  onViewUserProfile, 
  onTagClick,
  onViewDecision,
  onViewPost
}) => {
  const { addComment, posts, getPostBySlugOrId } = usePost();
  const { user } = useAuth();
  const [commentInput, setCommentInput] = useState('');
  const [commentSort, setCommentSort] = useState<CommentSortType>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [commentMenuOpen, setCommentMenuOpen] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  // États pour les commentaires récupérés via API
  const [commentsFromAPI, setCommentsFromAPI] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  // État pour le post chargé depuis l'API
  const [currentPost, setCurrentPost] = useState<any>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const commentMenuRef = useRef<HTMLDivElement>(null);

  // D'abord chercher le post dans le cache, puis via l'API si nécessaire
  const post = currentPost || posts.find(p => p.id === postId || p.slug === postId);

  // Fonction pour charger le post depuis l'API si pas en cache
  const loadPost = useCallback(async () => {
    // Si le post est déjà en cache, pas besoin de le recharger
    const cachedPost = posts.find(p => p.id === postId || p.slug === postId);
    if (cachedPost) {
      setCurrentPost(null); // Utiliser le cache
      return;
    }

    try {
      const postData = await getPostBySlugOrId(postId);
      if (postData) {
        setCurrentPost(postData);
      }
    } catch (error) {    }
  }, [postId, getPostBySlugOrId]); // Retirer posts des dépendances pour éviter les boucles

  // Fonction pour charger les commentaires depuis l'API
  const loadComments = useCallback(async () => {
    if (!post) return;
    
    setLoadingComments(true);
    try {
      // Utiliser l'ID MongoDB réel du post (pas le slug) pour l'API
      const realPostId = post._id || post.id;
      const response = await postsAPI.getComments(realPostId, 1, 100); // Récupérer tous les commentaires
      if (response.success) {
        setCommentsFromAPI(response.comments);
      }
    } catch (error) {    } finally {
      setLoadingComments(false);
    }
  }, [post?._id, post?.id]); // Utiliser des champs spécifiques et stables

  // Charger le post depuis l'API si nécessaire
  useEffect(() => {
    loadPost();
  }, [postId]); // Dépendre seulement de postId, pas de loadPost

  // Scroll vers le haut quand on arrive sur la page
  useEffect(() => {
    // Scroll immédiat vers le haut
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Puis un scroll plus doux après un petit délai pour s'assurer que le contenu est rendu
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
    
    return () => clearTimeout(timer);
  }, [postId]);

  // Charger les commentaires quand le post change
  useEffect(() => {
    if (!post) return;
    
    setLoadingComments(true);
    const loadCommentsData = async () => {
      try {
        const realPostId = post._id || post.id;
        const response = await postsAPI.getComments(realPostId, 1, 100);
        if (response.success) {
          setCommentsFromAPI(response.comments);
        }
      } catch (error) {    } finally {
        setLoadingComments(false);
      }
    };
    loadCommentsData();
  }, [post?._id, post?.id]); // Dépendre des champs stables du post

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [post?.comments]);

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
      if (commentMenuRef.current && !commentMenuRef.current.contains(event.target as Node)) {
        setCommentMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-hide success message
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  if (!post) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 transition-colors touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Retour</span>
        </button>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
          <div className="text-gray-400 mb-4">
            <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Publication introuvable</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Cette publication n'existe pas ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onLogin();
      return;
    }
    if (commentInput.trim()) {
      try {
        // Utiliser l'ID MongoDB réel du post
        const realPostId = post._id || post.id;
        await addComment(realPostId, commentInput.trim());
        setCommentInput('');
        // Recharger les commentaires après l'ajout
        await loadComments();
      } catch (error) {      }
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      onLogin();
      return;
    }

    try {
      // Trouver le commentaire dans la liste
      const comment = commentsFromAPI.find(c => (c._id || c.id) === commentId);
      if (!comment) return;

      const isLiked = (comment.likedBy || []).includes(user.id);
      
      // Mise à jour optimiste de l'état local
      setCommentsFromAPI(prevComments => 
        prevComments.map(c => {
          if ((c._id || c.id) === commentId) {
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
      const realPostId = post._id || post.id;
      if (isLiked) {
        await postsAPI.unlikeComment(realPostId, commentId);
      } else {
        await postsAPI.likeComment(realPostId, commentId);
      }
    } catch (error) {      // En cas d'erreur, recharger les commentaires pour restaurer l'état correct
      await loadComments();
    }
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingContent(content);
    setCommentMenuOpen(null);
  };

  const handleSaveEdit = async () => {
    if (editingCommentId && editingContent.trim()) {
      try {
        // Effectuer la requête API pour modifier le commentaire
        const realPostId = post._id || post.id;        
        await postsAPI.updateComment(realPostId, editingCommentId, editingContent.trim());
        
        // Mettre à jour l'état local des commentaires
        setCommentsFromAPI(prevComments => 
          prevComments.map(c => {
            if ((c._id || c.id) === editingCommentId) {
              return { 
                ...c, 
                content: editingContent.trim(),
                updatedAt: new Date().toISOString()
              };
            }
            return c;
          })
        );

        setEditingCommentId(null);
        setEditingContent('');
        setShowSuccessMessage('Commentaire modifié avec succès !');
      } catch (error) {        setShowSuccessMessage('Erreur lors de la modification du commentaire');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleDeleteComment = (commentId: string) => {
    setShowDeleteConfirm(commentId);
    setCommentMenuOpen(null);
  };

  const confirmDeleteComment = async () => {
    if (showDeleteConfirm) {
      try {
        // Effectuer la requête API pour supprimer le commentaire
        const realPostId = post._id || post.id;
        await postsAPI.deleteComment(realPostId, showDeleteConfirm);
        
        // Mettre à jour l'état local en retirant le commentaire supprimé
        setCommentsFromAPI(prevComments => 
          prevComments.filter(c => (c._id || c.id) !== showDeleteConfirm)
        );

        setShowDeleteConfirm(null);
        setShowSuccessMessage('Commentaire supprimé avec succès !');
      } catch (error) {        setShowSuccessMessage('Erreur lors de la suppression du commentaire');
        setShowDeleteConfirm(null);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Fonction pour trier les commentaires
  const getSortedComments = () => {
    if (!commentsFromAPI || !Array.isArray(commentsFromAPI)) {
      return [];
    }
    
    const comments = [...commentsFromAPI];
    
    switch (commentSort) {
      case 'oldest':
        return comments.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : null;
          const dateB = b.createdAt ? new Date(b.createdAt) : null;
          if (!dateA && !dateB) return 0;
          if (!dateA || isNaN(dateA.getTime())) return 1;
          if (!dateB || isNaN(dateB.getTime())) return -1;
          return dateA.getTime() - dateB.getTime();
        });
      case 'most-liked':
        return comments.sort((a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0));
      case 'newest':
      default:
        return comments.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : null;
          const dateB = b.createdAt ? new Date(b.createdAt) : null;
          if (!dateA && !dateB) return 0;
          if (!dateA || isNaN(dateA.getTime())) return 1;
          if (!dateB || isNaN(dateB.getTime())) return -1;
          return dateB.getTime() - dateA.getTime();
        });
    }
  };

  const sortedComments = getSortedComments();

  const getSortLabel = (sortType: CommentSortType) => {
    switch (sortType) {
      case 'newest': return 'Plus récents';
      case 'oldest': return 'Plus anciens';
      case 'most-liked': return 'Plus likés';
      default: return 'Plus récents';
    }
  };

  const getSortIcon = (sortType: CommentSortType) => {
    switch (sortType) {
      case 'newest': return <SortDesc className="h-4 w-4" />;
      case 'oldest': return <SortAsc className="h-4 w-4" />;
      case 'most-liked': return <TrendingUp className="h-4 w-4" />;
      default: return <SortDesc className="h-4 w-4" />;
    }
  };

  // Fonction pour obtenir des posts recommandés
  const getRecommendedPosts = () => {
    try {
      if (!post || !posts || !Array.isArray(posts)) return [];
      
      // Filtrer les posts publics et exclure le post actuel
      const availablePosts = posts.filter(p => p && p.id !== post.id && !p.isPrivate);
      
      // Algorithme de recommandation simple basé sur :
      // 1. Même type de post
      // 2. Tags similaires
      // 3. Même auteur
      // 4. Posts populaires (plus de likes)
      
      const scoredPosts = availablePosts.map(p => {
        try {
          let score = 0;
          
          // Bonus pour le même type
          if (p?.type === post?.type) score += 3;
          
          // Bonus pour les tags similaires
          const commonTags = (p?.tags && post?.tags && Array.isArray(p.tags) && Array.isArray(post.tags)) ? 
            p.tags.filter(tag => post.tags.includes(tag)) : [];
          score += commonTags.length * 2;
          
          // Bonus pour le même auteur
          if (p?.authorId === post?.authorId) score += 1;
          
          // Bonus pour la popularité (likes)
          const likes = typeof p?.likes === 'number' ? p.likes : 0;
          score += Math.min(likes / 5, 2); // Max 2 points pour les likes
          
          // Bonus pour les posts récents - avec validation sécurisée
          try {
            const postDate = p?.createdAt ? new Date(p.createdAt) : null;
            const daysSinceCreation = (postDate && !isNaN(postDate.getTime())) ? 
              (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24) : 
              Infinity;
            if (daysSinceCreation < 7) score += 1; // Bonus pour les posts de moins d'une semaine
          } catch (dateError) {
            console.warn('Error calculating post date for recommendation:', p?.id, dateError);
          }
          
          return { post: p, score: isNaN(score) || !isFinite(score) ? 0 : score };
        } catch (error) {
          console.warn('Error scoring post for recommendation:', p?.id, error);
          return { post: p, score: 0 };
        }
      });
      
      // Trier par score décroissant et prendre les 3 premiers
      const recommended = scoredPosts
        .sort((a, b) => (b?.score || 0) - (a?.score || 0))
        .slice(0, 3)
        .map(item => item?.post)
        .filter(Boolean);
      
      // Déduplication basée sur l'ID pour éviter les clés dupliquées
      const uniqueRecommended = recommended.filter((recPost, index, self) => 
        recPost && index === self.findIndex(p => p && p.id === recPost.id)
      );
      
      return Array.isArray(uniqueRecommended) ? uniqueRecommended : [];
    } catch (error) {
      console.error('Error in getRecommendedPosts:', error);
      return [];
    }
  };

  const recommendedPosts = React.useMemo(() => {
    try {
      if (!post || !posts) return [];
      return getRecommendedPosts();
    } catch (error) {
      console.error('Error in recommendedPosts useMemo:', error);
      return [];
    }
  }, [post?.id, posts]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* SEO Meta tags pour le post */}
      {post && <PostSEO post={post} />}
      
      {/* Layout avec sidebar publicitaire */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Contenu principal */}
        <div className="xl:col-span-3">
          {/* Navigation */}
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 transition-colors touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Retour</span>
          </button>

      {/* Post principal */}
      <div className="mb-6 sm:mb-8">
        <PostCard 
          post={post} 
          onLogin={onLogin} 
          onViewUserProfile={onViewUserProfile}
          onTagClick={onTagClick}
          onViewDecision={onViewDecision}
          isDetailView={true}
        />
      </div>

      {/* Section des commentaires */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 sm:mb-8">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Commentaires ({commentsFromAPI.length})</span>
            </h3>
            
            {/* Dropdown de tri des commentaires */}
            {commentsFromAPI.length > 1 && (
              <div className="relative" ref={sortDropdownRef}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors touch-manipulation"
                >
                  {getSortIcon(commentSort)}
                  <span className="hidden sm:inline">{getSortLabel(commentSort)}</span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {(['newest', 'oldest', 'most-liked'] as CommentSortType[]).map((sortType) => (
                      <button
                        key={sortType}
                        onClick={() => {
                          setCommentSort(sortType);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full flex items-center space-x-2 px-3 py-2 text-left text-xs sm:text-sm transition-colors touch-manipulation ${
                          commentSort === sortType
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {getSortIcon(sortType)}
                        <span>{getSortLabel(sortType)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Formulaire d'ajout de commentaire */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex space-x-3">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.username}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 text-sm sm:text-base touch-manipulation"
                  >
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Commenter</span>
                    <span className="sm:hidden">✓</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-blue-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
              <p className="text-blue-800 text-sm sm:text-base">
                <strong>Connectez-vous</strong> pour ajouter un commentaire
              </p>
              <button
                onClick={onLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm touch-manipulation"
              >
                Se connecter
              </button>
            </div>
          </div>
        )}

        {/* Liste des commentaires */}
        <div className="divide-y divide-gray-200">
          {loadingComments ? (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-blue-200 border-t-blue-600 mx-auto mb-3"></div>
              <p className="text-sm sm:text-base">Chargement des commentaires...</p>
            </div>
          ) : sortedComments.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-base sm:text-lg font-medium mb-1">Aucun commentaire</p>
              <p className="text-sm sm:text-base">Soyez le premier à commenter cette publication !</p>
            </div>
          ) : (
            sortedComments.map((comment) => {
              // Vérifier que l'auteur existe avant de rendre le commentaire
              // Les commentaires de l'API ont la structure comment.authorId au lieu de comment.author
              const author = comment.authorId || comment.author;
              if (!author) {                return null;
              }
              
              const commentId = comment._id || comment.id;
              const isCommentLiked = user ? (comment.likedBy || []).includes(user.id) : false;
              const isCommentAuthor = user?.id === (author._id || author.id);
              const isEditing = editingCommentId === commentId;
              const isModified = comment.updatedAt && comment.updatedAt > comment.createdAt;
              
              return (
                <div key={commentId} className="p-4 sm:p-6">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => onViewUserProfile(author._id || author.id)}
                      className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center hover:from-blue-200 hover:to-indigo-200 transition-colors flex-shrink-0 overflow-hidden touch-manipulation"
                    >
                      {author.profilePicture ? (
                        <img 
                          src={author.profilePicture} 
                          alt={author.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1">
                          <button
                            onClick={() => onViewUserProfile(author._id || author.id)}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm sm:text-base text-left touch-manipulation"
                          >
                            {author.username}
                          </button>
                          <span className="text-xs sm:text-sm text-gray-500 flex items-center space-x-1 mt-1 sm:mt-0">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(comment.createdAt)}</span>
                            {isModified && (
                              <span className="text-xs text-gray-400">(modifié)</span>
                            )}
                          </span>
                        </div>
                        
                        {/* Menu actions pour l'auteur du commentaire */}
                        {isCommentAuthor && !isEditing && (
                          <div className="relative" ref={commentMenuRef}>
                            <button
                              onClick={() => setCommentMenuOpen(commentMenuOpen === commentId ? null : commentId)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            
                            {commentMenuOpen === commentId && (
                              <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]">
                                <button
                                  onClick={() => handleEditComment(commentId, comment.content)}
                                  className="w-full flex items-center space-x-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors text-sm touch-manipulation"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>Modifier</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(commentId)}
                                  className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 transition-colors text-sm touch-manipulation"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Supprimer</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-2 mb-3">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full p-2 text-gray-900 bg-white rounded border resize-none text-sm"
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 flex items-center space-x-1 touch-manipulation"
                            >
                              <Check className="h-3 w-3" />
                              <span>Sauver</span>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-xs sm:text-sm hover:bg-gray-700 flex items-center space-x-1 touch-manipulation"
                            >
                              <X className="h-3 w-3" />
                              <span>Annuler</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 leading-relaxed mb-3 text-sm sm:text-base">
                          {comment.content}
                        </p>
                      )}
                      
                      {!isEditing && (
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLikeComment(commentId)}
                            className={`flex items-center space-x-1 text-xs sm:text-sm transition-colors touch-manipulation ${
                              isCommentLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                            }`}
                          >
                            <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isCommentLiked ? 'fill-current' : ''}`} />
                            <span>{comment.likedBy?.length || 0}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* Posts recommandés */}
      {recommendedPosts.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Publications recommandées</h2>
          </div>
          
          <div className="grid gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-1">
            {recommendedPosts.map((recommendedPost, index) => (
              <PostCard
                key={`recommended-${recommendedPost.id}-${index}`}
                post={recommendedPost}
                onLogin={onLogin}
                onViewUserProfile={onViewUserProfile}
                onTagClick={onTagClick}
                onViewDecision={onViewDecision}
                onViewPost={onViewPost || ((postId) => {
                  // Fallback si onViewPost n'est pas défini
                  window.location.hash = `#post-${postId}`;
                  window.location.reload();
                })}
              />
            ))}
          </div>
          
          {recommendedPosts.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
              <div className="text-gray-400 mb-4">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucune recommandation</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Nous n'avons pas trouvé de publications similaires à vous recommander pour le moment.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm transform transition-all">
            <div className="p-4 sm:p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Supprimer le commentaire
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium text-sm sm:text-base touch-manipulation"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteComment}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm sm:text-base touch-manipulation"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message de succès */}
      {showSuccessMessage && (
        <div className="fixed top-20 sm:top-24 right-4 sm:right-6 z-50 transform transition-all max-w-xs sm:max-w-none">
          <div className="bg-green-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg flex items-center space-x-2 sm:space-x-3">
            <div className="bg-white/20 p-1 rounded-full">
              <Check className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
            <span className="font-medium text-xs sm:text-base">{showSuccessMessage}</span>
          </div>
        </div>
      )}
        </div>

        {/* Sidebar publicitaire - visible uniquement sur grand écran */}
        <div className="hidden xl:block xl:col-span-1">
          <div className="sticky top-4 space-y-4">
            <WideSkyscraper className="mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;