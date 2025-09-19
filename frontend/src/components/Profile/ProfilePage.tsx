import React, { useState, useRef, useEffect } from 'react';
import { User, Calendar, BookOpen, Edit3, Save, X, Bookmark, FileText, Camera, Check, Folder, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePost } from '../../contexts';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useSavedPosts } from '../../contexts/SavedPostsContext';
import { authAPI, postsAPI } from '../../services/api';
import PostCard from '../Post/PostCard';
import SubscriptionModal from '../Subscription/SubscriptionModal';
import FoldersPage from '../Folder/FoldersPage';
import { 
  HalfPage,
  MediumRectangle,
  SponsoredContent
} from '../Ads';

interface ProfilePageProps {
  onLogin: () => void;
  onViewUserProfile: (userId: string) => void;
  onTagClick: (tag: string) => void;
  onViewPost: (postId: string) => void;
  onViewDecision?: (decisionNumber: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onLogin, onViewUserProfile, onTagClick, onViewPost, onViewDecision }) => {
  const { user, updateProfile, refreshUserData } = useAuth();
  const { savedPosts } = useSavedPosts();
  const { getFollowersCount, getFollowingCount, getConnections, getFollowers, getFollowing } = useSubscription();
  
  // États pour les posts avec pagination (indépendant du contexte global)
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'posts' | 'folders' | 'saved'>('posts');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<{
    isOpen: boolean;
    type: 'followers' | 'following' | 'connections';
  }>({ isOpen: false, type: 'followers' });
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    university: user?.university || '',
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.profilePicture || null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États pour la vérification du username
  const [usernameStatus, setUsernameStatus] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
  }>({ isChecking: false, isAvailable: null, message: '' });

  // États pour les statistiques indépendantes
  const [userStats, setUserStats] = useState<{totalPosts: number, totalLikes: number} | null>(null);
  const [statsLoading, setStatsLoading] = useState(true); // Pour les compteurs abonnés/abonnements/connexions
  const [postsLoading, setPostsLoading] = useState(true); // Pour les stats des posts

  // États pour le scroll infini
  const [scrollListenerReady, setScrollListenerReady] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  
  // Refs pour éviter les closures
  const loadingMoreRef = useRef(false);
  const hasMorePostsRef = useRef(true);

  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour vérifier la disponibilité du username
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus({
        isChecking: false,
        isAvailable: null,
        message: username.length > 0 ? 'Le nom d\'utilisateur doit contenir au moins 3 caractères' : ''
      });
      return;
    }

    // Ne pas vérifier si c'est le même username que l'utilisateur actuel
    if (username === user?.username) {
      setUsernameStatus({
        isChecking: false,
        isAvailable: true,
        message: 'Votre nom d\'utilisateur actuel'
      });
      return;
    }

    setUsernameStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const result = await authAPI.checkUsernameAvailability(username);
      setUsernameStatus({
        isChecking: false,
        isAvailable: result.available,
        message: result.message
      });
    } catch (error) {
      setUsernameStatus({
        isChecking: false,
        isAvailable: null,
        message: 'Erreur lors de la vérification'
      });
    }
  };

  // Debounce pour la vérification du username
  useEffect(() => {
    if (isEditing && editData.username) {
      // Annuler le timeout précédent
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }

      // Démarrer un nouveau timeout
      usernameCheckTimeoutRef.current = setTimeout(() => {
        checkUsernameAvailability(editData.username);
      }, 500); // 500ms de délai
    } else {
      // Réinitialiser le statut si on n'est pas en édition
      setUsernameStatus({ isChecking: false, isAvailable: null, message: '' });
    }

    // Cleanup
    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [editData.username, isEditing, user?.username]);

  // Synchroniser les données utilisateur au chargement
  React.useEffect(() => {
    if (user) {
      setEditData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
        bio: user?.bio || '',
        university: user?.university || '',
      });
      setProfilePicture(user?.profilePicture || null);
    }
  }, [user?.id]); // Seulement si l'ID de l'utilisateur change

  // Auto-hide success message
  React.useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // S'assurer que les posts sont chargés quand on arrive sur le profil
  useEffect(() => {
    const loadUserPosts = async (page: number = 1, reset: boolean = false) => {
      if (!user?.username) return;
      
      try {
        if (reset) {
          setLoadingPosts(true);
          setUserPosts([]);
          setCurrentPage(1);
        }
        
        const result = await postsAPI.getAllUserPostsForProfile(user.username, page, 12);
        
        if (result.success && result.posts) {
          if (reset) {
            setUserPosts(result.posts);
          } else {
            setUserPosts(prev => [...prev, ...result.posts]);
          }
          
          setHasMorePosts(result.hasMore || false);
          hasMorePostsRef.current = result.hasMore || false;
          setCurrentPage(page);
          
          // Activer le scroll listener après le premier chargement réussi
          if (reset) {
            setScrollListenerReady(true);
          }
        } else {
          setHasMorePosts(false);
          hasMorePostsRef.current = false;
        }
      } catch (error) {
        console.error('❌ [PROFIL-PERSO] Erreur lors du chargement:', error);
        setHasMorePosts(false);
        hasMorePostsRef.current = false;
      } finally {
        setLoadingPosts(false);
      }
    };

    if (user?.username && userPosts.length === 0 && loadingPosts) {
      loadUserPosts(1, true);
    }
  }, [user?.username]);

  // Détection du scroll infini automatique
  useEffect(() => {
    // Attendre que les posts soient chargés avant d'activer le scroll listener
    if (!scrollListenerReady) {
      return;
    }

    const handleScroll = () => {
      if (loadingMoreRef.current || !hasMorePostsRef.current) {
        return;
      }

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // Déclencher le chargement à 500px du bas
      if (scrollTop + clientHeight >= scrollHeight - 500) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollListenerReady, hasMorePosts]); // Dépendances importantes

  // Synchroniser les refs avec les états pour éviter les closures stales
  useEffect(() => {
    loadingMoreRef.current = loadingMorePosts;
  }, [loadingMorePosts]);

  useEffect(() => {
    hasMorePostsRef.current = hasMorePosts;
  }, [hasMorePosts]);

  if (!user) return null;

  // États pour les statistiques
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  
  // Charger les statistiques de l'utilisateur
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) return;
      
      setStatsLoading(true);
      try {
        const [followers, following, followersData, followingData] = await Promise.all([
          getFollowersCount(user.id),
          getFollowingCount(user.id),
          getFollowers(user.id),
          getFollowing(user.id)
        ]);
        
        setFollowersCount(followers);
        setFollowingCount(following);
        
        // Calculer les connexions comme dans le modal (logique robuste)
        const connectionsData = followersData.filter((follower: any) => {
          return followingData.some((following: any) => {
            // Comparaison par ID ou username pour plus de robustesse
            return (follower.id && following.id && follower.id === following.id) ||
                   (follower._id && following._id && follower._id === following._id) ||
                   (follower.username && following.username && follower.username === following.username);
          });
        });
        
        setConnectionsCount(connectionsData.length);
      } catch (error) {      } finally {
        setStatsLoading(false);
      }
    };

    loadUserStats();
  }, [user?.id, getFollowersCount, getFollowingCount, getFollowers, getFollowing]); // Ajouter toutes les dépendances

  // Charger les statistiques de posts de l'utilisateur de façon indépendante
  useEffect(() => {
    const loadPostsStats = async () => {
      if (!user?.username) return;
      
      try {
        setPostsLoading(true);
        
        const result = await postsAPI.getUserStats(user.username);
        if (result.success && result.stats) {
          setUserStats(result.stats);
        } else {
          setUserStats({ totalPosts: 0, totalLikes: 0 });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setUserStats({ totalPosts: 0, totalLikes: 0 });
      } finally {
        setPostsLoading(false);
      }
    };

    loadPostsStats();
  }, [user?.username]); // Dépendre du username
  
  // Utiliser les statistiques indépendantes plutôt que de calculer à partir des posts chargés
  const totalLikes = React.useMemo(() => {
    return userStats?.totalLikes || 0;
  }, [userStats]);

  // Fonction pour charger plus de posts
  const loadMorePosts = async () => {
    if (loadingMoreRef.current || !hasMorePostsRef.current || !user?.username) {
      return;
    }

    const nextPage = currentPage + 1;
    loadingMoreRef.current = true;
    setLoadingMorePosts(true);

    try {
      const result = await postsAPI.getAllUserPostsForProfile(user.username, nextPage, 12);
      
      if (result.success && result.posts && result.posts.length > 0) {
        setUserPosts(prev => [...prev, ...result.posts]);
        setHasMorePosts(result.hasMore || false);
        hasMorePostsRef.current = result.hasMore || false;
        setCurrentPage(nextPage);
      } else {
        hasMorePostsRef.current = false;
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des posts:', error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMorePosts(false);
    }
  };

  const handleSave = async () => {    
    // Vérifier si le username est en cours de vérification
    if (usernameStatus.isChecking) {      alert('Vérification du nom d\'utilisateur en cours...');
      return;
    }

    // Vérifier si le username n'est pas disponible (seulement si il a changé)
    if (editData.username !== user?.username && usernameStatus.isAvailable === false) {      alert('Ce nom d\'utilisateur n\'est pas disponible');
      return;
    }

    // Si le username n'a pas changé, pas besoin de vérifier la disponibilité
    if (editData.username === user?.username) {    }
    try {
      const success = await updateProfile({
        ...editData,
        profilePicture: profilePicture || undefined,
      });      
      if (success) {
        setIsEditing(false);
        setShowSuccessMessage('Profil mis à jour avec succès !');
      } else {
        alert('Erreur lors de la mise à jour du profil');
      }
    } catch (error) {      alert('Erreur lors de la mise à jour du profil');
    }
  };

  const handleCancel = () => {
    setEditData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      bio: user?.bio || '',
      university: user?.university || '',
    });
    setProfilePicture(user?.profilePicture || null);
    setIsEditing(false);
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert('La taille de l\'image ne doit pas dépasser 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        setProfilePicture(imageData);
        
        // Uploader l'image vers le backend
        await uploadProfilePicture(imageData, file.name, file.type, file.size);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePicture = async (imageData: string, originalName: string, mimeType: string, size: number) => {
    try {
      const response = await fetch('https://www.jurinapse.com/api/auth/profile-picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Pour envoyer les cookies
        body: JSON.stringify({
          imageData,
          originalName,
          mimeType,
          size
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload de la photo de profil');
      }

      const data = await response.json();
      setShowSuccessMessage('Photo de profil mise à jour avec succès !');
      
      // Forcer la synchronisation des données utilisateur depuis le serveur
      await refreshUserData();
      
      // Mettre à jour l'état local avec les nouvelles données
      setProfilePicture(data.profilePictureUrl);
      
    } catch (error) {      alert('Erreur lors de l\'upload de la photo de profil');
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      const response = await fetch('https://www.jurinapse.com/api/auth/profile-picture', {
        method: 'DELETE',
        credentials: 'include', // Pour envoyer les cookies
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la photo de profil');
      }

      setProfilePicture(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Mettre à jour le profil
      updateProfile({
        ...editData,
        profilePicture: '',
      });
      
      setShowSuccessMessage('Photo de profil supprimée avec succès !');
      
    } catch (error) {      alert('Erreur lors de la suppression de la photo de profil');
    }
  };

  const handleViewUserProfile = (userId: string) => {
    // Fermer la modal et naviguer vers le profil
    setShowSubscriptionModal({ isOpen: false, type: 'followers' });
    onViewUserProfile(userId);
  };

  const renderTabContent = () => {
    if (activeProfileTab === 'folders') {
      return (
        <FoldersPage
          onLogin={onLogin}
          onViewUserProfile={onViewUserProfile}
          onTagClick={onTagClick}
          onViewPost={onViewPost}
          onViewDecision={onViewDecision}
        />
      );
    }

    if (activeProfileTab === 'saved') {
      return (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Bookmark className="h-5 w-5" />
            <span>Publications sauvegardées</span>
          </h2>
          {savedPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Bookmark className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune publication sauvegardée</h3>
              <p className="text-gray-600">
                Sauvegardez des publications intéressantes pour les retrouver facilement ici.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {savedPosts.map((post: any, index: number) => (
                <React.Fragment key={post.id}>
                  <PostCard 
                    post={post} 
                    onLogin={onLogin}
                    onViewUserProfile={onViewUserProfile}
                    onTagClick={onTagClick}
                    onViewPost={onViewPost}
                    onViewDecision={onViewDecision}
                    tagsClickable={false}
                  />
                  {/* Publicité tous les 4 posts */}
                  {(index + 1) % 4 === 0 && index < savedPosts.length - 1 && (
                    <SponsoredContent>
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                        <div className="text-xs text-gray-500 mb-2 font-medium">
                          Contenu sponsorisé
                        </div>
                        <MediumRectangle className="mx-auto" />
                      </div>
                    </SponsoredContent>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Mes publications</span>
        </h2>
        {loadingPosts && userPosts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-blue-500 mb-4">
              <Loader2 className="h-8 w-8 mx-auto animate-spin" />
            </div>
            <p className="text-gray-600">Chargement de vos publications...</p>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <BookOpen className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune publication</h3>
            <p className="text-gray-600">
              Vous n'avez pas encore publié de contenu. Commencez par partager une fiche d'arrêt ou un conseil !
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {userPosts.map((post, index: number) => (
              <React.Fragment key={post.id}>
                <PostCard 
                  post={post} 
                  onLogin={onLogin}
                  onViewUserProfile={onViewUserProfile}
                  onTagClick={onTagClick}
                  onViewPost={onViewPost}
                  onViewDecision={onViewDecision}
                  tagsClickable={false}
                />
                {/* Publicité tous les 4 posts */}
                {(index + 1) % 4 === 0 && index < userPosts.length - 1 && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                    <div className="text-xs text-gray-500 mb-2 font-medium">
                      Contenu sponsorisé
                    </div>
                    <MediumRectangle className="mx-auto" />
                  </div>
                )}
              </React.Fragment>
            ))}
            
            {/* Indicateur de chargement pour le scroll infini */}
            {loadingMorePosts && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-blue-500 mb-4">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin" />
                </div>
                <p className="text-gray-600">Chargement de plus de publications...</p>
              </div>
            )}
            
            {/* Message fin de liste */}
            {!hasMorePosts && userPosts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-gray-500">Vous avez vu toutes vos publications ✨</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Layout avec sidebar publicitaire */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Contenu principal */}
        <div className="xl:col-span-3">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="flex items-start space-x-3 sm:space-x-6 flex-1 min-w-0">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                {(isEditing ? profilePicture : user.profilePicture) ? (
                  <img 
                    src={(() => {
                      const imageSource = isEditing ? profilePicture! : user.profilePicture!;
                      // Si c'est une URL d'API, l'utiliser directement
                      if (imageSource.startsWith('/api/') || imageSource.startsWith('http')) {
                        return imageSource;
                      }
                      // Si c'est déjà du base64 complet, l'utiliser directement
                      if (imageSource.startsWith('data:')) {
                        return imageSource;
                      }
                      // Sinon, ajouter le préfixe base64
                      return `data:image/jpeg;base64,${imageSource}`;
                    })()}
                    alt={user.username}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallbackIcon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                      if (fallbackIcon) {
                        fallbackIcon.classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}
                <User className={`h-8 w-8 sm:h-10 sm:w-10 text-blue-600 fallback-icon ${(isEditing ? profilePicture : user.profilePicture) ? 'hidden' : ''}`} />
              </div>
              
              {isEditing && (
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 sm:p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg touch-manipulation"
                    title="Changer la photo"
                  >
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Prénom"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Nom"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={editData.username}
                      onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Pseudo"
                      className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        editData.username !== user?.username && usernameStatus.isAvailable === false
                          ? 'border-red-300 bg-red-50'
                          : editData.username !== user?.username && usernameStatus.isAvailable === true
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300'
                      }`}
                    />
                    {editData.username && editData.username !== user?.username && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {usernameStatus.isChecking ? (
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        ) : usernameStatus.isAvailable === true ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : usernameStatus.isAvailable === false ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {editData.username && editData.username !== user?.username && usernameStatus.message && (
                    <p className={`text-xs -mt-2 ${
                      usernameStatus.isAvailable === false ? 'text-red-500' : 
                      usernameStatus.isAvailable === true ? 'text-green-500' : 'text-gray-500'
                    }`}>
                      {usernameStatus.message}
                    </p>
                  )}
                  {user.isStudent && (
                    <input
                      type="text"
                      value={editData.university}
                      onChange={(e) => setEditData(prev => ({ ...prev, university: e.target.value }))}
                      placeholder="Université"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  {profilePicture && (
                    <button
                      onClick={handleRemoveProfilePicture}
                      className="text-red-600 hover:text-red-700 text-sm font-medium touch-manipulation"
                    >
                      Supprimer la photo de profil
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium">
                    @{user.username}
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {user.isStudent ? 'Étudiant' : 'Professionnel'}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 mt-2 text-xs sm:text-sm text-gray-500">
                    {user.university && (
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">{user.university}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">
                        Membre depuis {new Intl.DateTimeFormat('fr-FR', {
                          month: 'long',
                          year: 'numeric'
                        }).format(new Date(user.joinedAt))}
                      </span>
                      <span className="sm:hidden">
                        {new Intl.DateTimeFormat('fr-FR', {
                          month: 'short',
                          year: 'numeric'
                        }).format(new Date(user.joinedAt))}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center justify-center space-x-1 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm touch-manipulation"
                >
                  <Save className="h-4 w-4" />
                  <span>Sauver</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center justify-center space-x-1 px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm touch-manipulation"
                >
                  <X className="h-4 w-4" />
                  <span>Annuler</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm touch-manipulation"
              >
                <Edit3 className="h-4 w-4" />
                <span>Modifier</span>
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4 sm:mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">À propos</h3>
          {isEditing ? (
            <textarea
              value={editData.bio}
              onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Parlez-nous de vous, vos domaines d'expertise, vos intérêts..."
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          ) : (
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {user.bio || 'Pas encore de description ajoutée.'}
            </p>
          )}
        </div>

        {/* Stats - Optimisé pour mobile */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-0">
            <button
              onClick={() => setShowSubscriptionModal({ isOpen: true, type: 'followers' })}
              className="text-center hover:bg-gray-50 rounded-lg p-2 sm:p-3 transition-colors touch-manipulation"
            >
              <div className="text-lg sm:text-2xl font-bold text-green-600">{statsLoading ? "-" : followersCount}</div>
              <div className="text-xs sm:text-sm text-gray-500">Abonnés</div>
            </button>
            <button
              onClick={() => setShowSubscriptionModal({ isOpen: true, type: 'following' })}
              className="text-center hover:bg-gray-50 rounded-lg p-2 sm:p-3 transition-colors touch-manipulation"
            >
              <div className="text-lg sm:text-2xl font-bold text-purple-600">{statsLoading ? "-" : followingCount}</div>
              <div className="text-xs sm:text-sm text-gray-500">Abonnements</div>
            </button>
            <button
              onClick={() => setShowSubscriptionModal({ isOpen: true, type: 'connections' })}
              className="text-center hover:bg-gray-50 rounded-lg p-2 sm:p-3 transition-colors touch-manipulation"
            >
              <div className="text-lg sm:text-2xl font-bold text-orange-600">{statsLoading ? "-" : connectionsCount}</div>
              <div className="text-xs sm:text-sm text-gray-500">Connexions</div>
            </button>
            <div className="text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-red-600">
                {statsLoading ? '...' : totalLikes}
              </div>
              <div className="text-sm text-gray-500">J'aime reçus</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs - Optimisé pour mobile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 sm:mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex px-4 sm:px-6 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveProfileTab('posts')}
              className={`py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 touch-manipulation ${
                activeProfileTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-1 sm:space-x-2">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Publications ({statsLoading ? '...' : userStats?.totalPosts || 0})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveProfileTab('folders')}
              className={`py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 touch-manipulation ${
                activeProfileTab === 'folders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Folder className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Dossiers</span>
              </div>
            </button>
            <button
              onClick={() => setActiveProfileTab('saved')}
              className={`py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 touch-manipulation ${
                activeProfileTab === 'saved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Sauvegardés ({savedPosts.length})</span>
              </div>
            </button>
          </nav>
        </div>
        
        <div className="p-4 sm:p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Modal des abonnements */}
      <SubscriptionModal
        isOpen={showSubscriptionModal.isOpen}
        onClose={() => setShowSubscriptionModal({ isOpen: false, type: 'followers' })}
        userId={user.id}
        type={showSubscriptionModal.type}
        onViewUserProfile={handleViewUserProfile}
      />

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
        </div>

        {/* Sidebar publicitaire - visible uniquement sur grand écran */}
        <div className="hidden xl:block xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Publicité Skyscraper - Ajusté pour 300x600 */}
            <SponsoredContent>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-96" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
                <div className="text-xs text-gray-500 mb-2 font-medium">
                  Contenu sponsorisé
                </div>
                <HalfPage className="mx-auto" />
              </div>
            </SponsoredContent>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;