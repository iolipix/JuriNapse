import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Tag, User as UserIcon, LogIn, MoreHorizontal, Edit, Trash2, Check, X, Download, Eye, FileText, Lock, Globe, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Post, Group } from '../../types';
import { useAuth, usePost, useMessaging } from '../../contexts';
import { useSavedPosts } from '../../contexts/SavedPostsContext';
import CommentsList from './CommentsList';
import LikesList from './LikesList';
import { getUserDisplayInfo, handleProfileClick } from '../../utils/deletedUserUtils';
import UserNotFoundPage from '../Error/UserNotFoundPage';

interface PostCardProps {
  post: Post;
  onLogin: () => void;
  onViewUserProfile: (userId: string) => void;
  onTagClick: (tag: string) => void;
  onViewPost?: (postId: string) => void;
  isDetailView?: boolean;
  onViewDecision?: (decisionNumber: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLogin, 
  onViewUserProfile, 
  onTagClick, 
  onViewPost, 
  isDetailView = false,
  onViewDecision 
}) => {
  const { user } = useAuth();
  const { toggleLike, deletePost, updatePost } = usePost();
  const { groups, lastMessages } = useMessaging();
  const { savePost, unsavePost, isPostSaved } = useSavedPosts();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editDecisionNumber, setEditDecisionNumber] = useState(post.decisionNumber || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showDownloadWarning, setShowDownloadWarning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUserNotFoundModal, setShowUserNotFoundModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shareModalRef = useRef<HTMLDivElement>(null);
  
  const isLiked = user ? post.likedBy.includes(user.id) : false;
  const isSaved = isPostSaved(post.id);
  const isAuthor = user?.id === post.authorId;
  
  // Un post est considéré comme modifié seulement si lastUserEdit existe et est différent de createdAt
  let isModified = false;
  
  if (post.lastUserEdit && post.createdAt) {
    const timeDiff = post.lastUserEdit.getTime() - post.createdAt.getTime();
    // Seuil de 30 secondes pour considérer qu'un post est modifié
    isModified = timeDiff > 30000; // 30 secondes = 30000 millisecondes
  }

  // Limite de caractères pour le contenu tronqué
  const CONTENT_LIMIT = 300;
  const shouldTruncate = !isDetailView && post.content.length > CONTENT_LIMIT;
  const displayContent = shouldTruncate && !isExpanded 
    ? post.content.substring(0, CONTENT_LIMIT) + '...'
    : post.content;

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (shareModalRef.current && !shareModalRef.current.contains(event.target as Node)) {
        setShowShareModal(false);
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Récupérer les groupes de l'utilisateur pour le partage
  const userGroups = user ? groups.filter(g => g.members.some(m => m.id === user.id)) : [];

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'fiche-arret': return 'Fiche d\'arrêt';
      case 'cours': return 'Cours';
      case 'protocole': return 'Protocole';
      case 'conseil':
      case 'question': 
      case 'discussion': 
        return 'Publication';
      default: return 'Publication';
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'fiche-arret': return 'bg-blue-100 text-blue-800';
      case 'cours': return 'bg-orange-100 text-orange-800';
      case 'protocole': return 'bg-green-100 text-green-800';
      case 'conseil':
      case 'question':
      case 'discussion':
        return 'bg-purple-100 text-purple-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  // Helper function to get the other participant in a private conversation
  const getOtherParticipant = (group: Group) => {
    if (group.isPrivate && group.members && group.members.length === 2) {
      return group.members.find(member => member.id !== user?.id);
    }
    return null;
  };

  // Helper function to format private chat display
  const getPrivateChatDisplay = (group: Group) => {
    const otherParticipant = getOtherParticipant(group);
    if (otherParticipant) {
      const lastMessage = lastMessages[group.id];
      const lastMessageText = lastMessage ? 
        (lastMessage.content?.length > 30 ? 
          lastMessage.content.substring(0, 30) + "..." : 
          lastMessage.content) : 
        "Aucun message";
      
      return {
        name: `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim() || 'Utilisateur',
        profilePicture: otherParticipant.profilePicture,
        lastMessage: lastMessageText
      };
    }
    return null;
  };

  // Fonction pour déterminer si un post est tendance
  const handleInteraction = (action: () => Promise<void> | void) => {
    if (!user) {
      onLogin();
      return;
    }
    
    try {
      const result = action();
      if (result instanceof Promise) {
        result.catch(_ => {          // Ne pas faire planter l'interface en cas d'erreur
        });
      }
    } catch (_) {      // Ne pas faire planter l'interface en cas d'erreur
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleSaveEdit = async () => {
    if (updatePost) {
      await updatePost(post.id, {
        title: editTitle,
        content: editContent,
        decisionNumber: editDecisionNumber || undefined
      });
    }
    setIsEditing(false);
    setShowSuccessMessage('Publication modifiée avec succès !');
  };

  const handleCancelEdit = () => {
    setEditContent(post.content);
    setEditTitle(post.title);
    setEditDecisionNumber(post.decisionNumber || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
    setIsMenuOpen(false);
  };

  const confirmDelete = () => {
    deletePost(post.id);
    setShowDeleteConfirm(false);
    setShowSuccessMessage('Publication supprimée avec succès !');
  };

  const handleTogglePrivacy = () => {
    // Fonctionnalité privacy à implémenter
    // Toggle privacy for post
    setIsMenuOpen(false);
    setShowSuccessMessage(post.isPrivate ? 'Publication rendue publique !' : 'Publication rendue privée !');
  };

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTagClick(tag);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onLogin();
      return;
    }
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    try {
      const postUrl = `${window.location.origin}/post/${post.slug || post.id}`;
      await navigator.clipboard.writeText(postUrl);
      setShowSuccessMessage('Lien copié dans le presse-papiers !');
      setShowShareModal(false);
      setTimeout(() => setShowSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  const handleShareToGroup = async (groupId: string) => {
    try {
      if (!user) {
        onLogin();
        return;
      }
      
      // Appeler l'API de partage de message
      const response = await fetch('/api/messages/share-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          groupId: groupId,
          postId: post.id,
          content: 'Post partagé'
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du partage');
      }
      
      setShowSuccessMessage(`Post partagé dans le groupe !`);
      setShowShareModal(false);
      setTimeout(() => setShowSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      setShowSuccessMessage('Erreur lors du partage');
      setTimeout(() => setShowSuccessMessage(null), 3000);
    }
  };

  const handleViewPost = () => {
    if (onViewPost && !isDetailView) {
      onViewPost(post.id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Ne pas déclencher la navigation si on clique sur des éléments interactifs
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest('button') || 
                                target.closest('a') || 
                                target.closest('input') || 
                                target.closest('textarea') ||
                                target.closest('[role="button"]');
    
    if (!isInteractiveElement && !isDetailView && onViewPost) {
      handleViewPost();
    }
  };

  const handleExpandContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleDownloadPdf = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDownloadWarning(true);
  };

  const confirmDownloadPdf = () => {
    if (post.pdfFile) {
      const link = document.createElement('a');
      link.href = post.pdfFile.url || '';
      link.download = post.pdfFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowSuccessMessage('Téléchargement démarré !');
    }
    setShowDownloadWarning(false);
  };

  const handleSavePost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      onLogin();
      return;
    }

    setSavingPost(true);
    try {
      if (isSaved) {
        await unsavePost(post.id);
        setShowSuccessMessage('Post retiré des favoris !');
      } else {
        await savePost(post.id);
        setShowSuccessMessage('Post ajouté aux favoris !');
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      setShowSuccessMessage(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingPost(false);
    }
  };

  const handlePdfViewer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPdfViewer(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleShowLikes = async (e: React.MouseEvent) => {
    e.stopPropagation();    setShowLikesModal(true);
  };

  const handleDecisionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.decisionNumber && onViewDecision) {
      onViewDecision(post.decisionNumber);
    }
  };

  return (
    <article 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${
        !isDetailView ? 'cursor-pointer' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {(() => {
              const authorDisplayInfo = getUserDisplayInfo(post.author);
              
              return (
                <>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProfileClick(
                        post.author,
                        onViewUserProfile,
                        () => setShowUserNotFoundModal(true)
                      );
                    }}
                    className={`h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center hover:from-blue-200 hover:to-indigo-200 transition-colors overflow-hidden ${
                      authorDisplayInfo.isClickable ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    {authorDisplayInfo.displayProfilePicture ? (
                      <img 
                        src={(() => {
                          const imageSource = authorDisplayInfo.displayProfilePicture;
                          // Si c'est une URL d'API, l'utiliser directement avec cache-busting
                          if (imageSource.startsWith('/api/') || imageSource.startsWith('http')) {
                            // Ajouter un paramètre timestamp pour forcer le rechargement
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
                        alt={authorDisplayInfo.displayUsername}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick(
                          post.author,
                          onViewUserProfile,
                          () => setShowUserNotFoundModal(true)
                        );
                      }}
                      className={`font-semibold transition-colors ${
                        authorDisplayInfo.isClickable 
                          ? 'text-gray-900 hover:text-blue-600 cursor-pointer'
                          : 'text-gray-500 cursor-default'
                      }`}
                    >
                      {authorDisplayInfo.displayUsername}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {!authorDisplayInfo.isDeleted && post.author.isStudent && post.author.university && (
                        <>
                          <span>{post.author.university}</span>
                          <span>•</span>
                        </>
                      )}
                      <span className="flex items-center space-x-1">
                        <span>{formatDate(post.createdAt)}</span>
                        {isModified && (
                          <span className="text-xs text-gray-400">(modifié)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPostTypeColor(post.type)}`}>
              {getPostTypeLabel(post.type)}
            </span>
            
            {/* Badges de tendance supprimés - maintenant gérés par FeedPage.tsx */}
            
            {/* Indicateur de visibilité */}
            {isAuthor && post.isPrivate && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 flex items-center space-x-1">
                <Lock className="h-3 w-3" />
                <span>Privé</span>
              </span>
            )}
            
            {/* Menu Actions (visible seulement pour l'auteur) */}
            {isAuthor && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePrivacy();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {post.isPrivate ? (
                        <>
                          <Globe className="h-4 w-4" />
                          <span>Rendre public</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Rendre privé</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-xl font-bold text-gray-900 mb-3 leading-tight border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
            {post.title}
          </h2>
        )}

        {/* Numéro de décision pour les fiches d'arrêt - Style discret */}
        {post.type === 'fiche-arret' && (
          <div className="mb-4">
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de la décision
                </label>
                <input
                  type="text"
                  value={editDecisionNumber}
                  onChange={(e) => setEditDecisionNumber(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Ex: 93-18.632"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ce numéro permettra de regrouper toutes les fiches d'arrêt sur cette décision
                </p>
              </div>
            ) : post.decisionNumber ? (
              <p className="text-sm text-gray-600">
                <span className="text-gray-500">Décision n° </span>
                <span
                  onClick={handleDecisionClick}
                  className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium cursor-pointer"
                >
                  {post.decisionNumber}
                </span>
              </p>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Aucun numéro de décision renseigné
              </p>
            )}
          </div>
        )}

      </div>

      {/* PDF Preview for cours type */}
      {post.type === 'cours' && post.pdfFile && !isEditing && (
        <div className="px-6 pb-4">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{post.pdfFile.name}</h4>
                  <p className="text-sm text-gray-600">
                    Fichier PDF • {formatFileSize(post.pdfFile.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePdfViewer}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>Consulter</span>
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 pb-4">
        {isEditing ? (
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Sauvegarder
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-gray-700">
            {displayContent ? displayContent.split('\n').map((paragraph, index) => {
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return (
                  <p key={index} className="font-semibold text-gray-900 mt-4 mb-2">
                    {paragraph.replace(/\*\*/g, '')}
                  </p>
                );
              }
              return paragraph.trim() ? (
                <p key={index} className="mb-2 leading-relaxed">
                  {paragraph}
                </p>
              ) : null;
            }) : null}
            
            {/* Bouton "Voir plus" / "Voir moins" */}
            {shouldTruncate && (
              <div
                onClick={handleExpandContent}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm mt-2 transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <span>Voir moins</span>
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>Voir plus</span>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tags - Cliquables */}
        {!isEditing && post.tags && post.tags.length > 0 && (
          <div className="flex items-center space-x-1 mt-4">
            <Tag className="h-4 w-4 text-gray-400" />
            {/* 🔥 FORCE DEPLOY v4.0 - Tags limités à 3 sur posts 🔥 */}
            <div className="flex flex-wrap gap-1" style={{ border: '1px solid transparent' }}>
              {/* DEPLOY TEST v4.0 - {post.tags.length} tags totaux → max 3 sur posts */}
              {post.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  onClick={(e) => handleTagClick(tag, e)}
                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">
                  +{post.tags.length - 3} TAGS LIMITÉS v4.0
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInteraction(() => toggleLike(post.id));
                  }}
                  className={`flex items-center space-x-2 transition-colors ${
                    isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <span
                  onClick={(e) => {
                    e.stopPropagation();                    handleShowLikes(e);
                  }}
                  className={`text-sm font-medium ${post.likes > 0 ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
                >
                  {post.likes}
                </span>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (user) {
                    setShowCommentsModal(true);
                  } else {
                    onLogin();
                  }
                }}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{post.comments.length}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors"
                title="Partager"
              >
                <Share2 className="h-5 w-5" />
              </button>

            </div>

            <button 
              onClick={handleSavePost}
              disabled={savingPost}
              className={`flex items-center space-x-2 transition-colors disabled:opacity-50 ${
                isSaved ? 'text-yellow-600' : 'text-gray-500 hover:text-yellow-600'
              }`}
              title={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.savesCount || 0}</span>
            </button>
          </div>

          {!user && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-800">
                  <strong>Connectez-vous</strong> pour interagir avec cette publication
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogin();
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                >
                  <LogIn className="h-3 w-3" />
                  <span>Se connecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Likes Modal */}
      <LikesList
        postId={post.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        onViewUserProfile={onViewUserProfile}
      />

      {/* PDF Viewer Modal */}
      {showPdfViewer && post.pdfFile && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            // Fermer le modal si on clique sur la zone noire (background)
            if (e.target === e.currentTarget) {
              e.stopPropagation(); // Empêcher l'événement de remonter
              setShowPdfViewer(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()} // Empêcher les clics sur le contenu de fermer le modal
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">{post.pdfFile.name}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger</span>
                </button>
                <button
                  onClick={() => setShowPdfViewer(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={post.pdfFile.url}
                className="w-full h-full rounded-lg border border-gray-300"
                title={post.pdfFile.name}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal d'avertissement de téléchargement */}
      {showDownloadWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Avertissement de sécurité
              </h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Vous vous apprêtez à télécharger un fichier depuis Internet. 
                Assurez-vous que ce fichier provient d'une source fiable avant de l'ouvrir. 
                Les fichiers malveillants peuvent endommager votre ordinateur ou compromettre vos données.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDownloadWarning(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDownloadPdf}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium"
                >
                  Télécharger quand même
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Supprimer la publication
              </h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
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
        <div className="fixed top-24 right-6 z-50 transform transition-all">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3">
            <div className="bg-white/20 p-1 rounded-full">
              <Check className="h-4 w-4" />
            </div>
            <span className="font-medium">{showSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* Modal de partage */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div ref={shareModalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Partager cette publication</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Share2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Copier le lien</p>
                    <p className="text-sm text-gray-500">Partager via un lien direct</p>
                  </div>
                </button>

                {user && userGroups.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 my-4"></div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Partager dans un groupe :</p>
                    {userGroups.map((group) => {
                      const privateDisplay = group.isPrivate ? getPrivateChatDisplay(group) : null;
                      
                      return (
                        <button
                          key={group.id}
                          onClick={() => handleShareToGroup(group.id)}
                          className="w-full flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                            {privateDisplay?.profilePicture ? (
                              <img 
                                src={privateDisplay.profilePicture} 
                                alt={privateDisplay.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Share2 className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {privateDisplay ? privateDisplay.name : group.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {privateDisplay ? privateDisplay.lastMessage : `${group.members.length} membres`}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      <CommentsList
        postId={post.id}
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        onViewUserProfile={onViewUserProfile}
      />

      {/* User Not Found Modal */}
      {showUserNotFoundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <UserNotFoundPage 
            onGoHome={() => {
              setShowUserNotFoundModal(false);
              window.location.href = '/';
            }}
            onBackToFeed={() => setShowUserNotFoundModal(false)}
          />
        </div>
      )}
    </article>
  );
};

export default PostCard;