import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Calendar, BookOpen, GraduationCap, Briefcase, Shield, Check, AlertTriangle, Folder, FileText, Edit3, MessageCircle } from 'lucide-react';
import { usePost } from '../../contexts';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useFolder } from '../../contexts/FolderContext';
import PostCard from '../Post/PostCard';
import FolderCard from '../Folder/FolderCard';
import FollowButton from '../Subscription/FollowButton';
import SubscriptionModal from '../Subscription/SubscriptionModal';
import ProfileSEO from '../SEO/ProfileSEO';
import DeletedUserPage from './DeletedUserPage';
import { MediumRectangle, WideSkyscraper } from '../Ads';
import useSEO from '../../hooks/useSEO';
import api, { postsAPI } from '../../services/api';
import { fixProfilePictureUrl } from '../../utils/apiUrlFixer';

interface UserProfilePageProps {
  userId: string;
  onTagClick: (tag: string) => void;
  onViewPost: (postId: string) => void;
  onViewDecision?: (decisionNumber: string) => void;
  onProfileClick?: () => void;
  onViewUserProfile?: (userId: string) => void; // Nouvelle prop pour la navigation
  onSendMessage?: (userId: string) => void; // Nouvelle prop pour les messages
  onUserNotFound?: () => void; // Nouvelle prop pour gérer les utilisateurs non trouvés
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ userId, onTagClick, onViewPost, onViewDecision, onProfileClick, onViewUserProfile, onSendMessage, onUserNotFound }) => {
  const { posts } = usePost();
  const { user: currentUser } = useAuth();
  const { 
    getFollowersCount, 
    getFollowingCount,
    getConnectionsAsync, // Utiliser seulement getConnectionsAsync
    blockUser,
    unblockUser,
    isBlocked,
    getUserById,
    subscriptions, // Ajouter subscriptions pour détecter les changements
    getUserByUsername,
    invalidateCache // Ajouter invalidateCache
  } = useSubscription();
  const { folders } = useFolder();
  const [activeTab, setActiveTab] = useState<'posts' | 'folders'>('posts');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<{
    isOpen: boolean;
    type: 'followers' | 'following' | 'connections';
  }>({ isOpen: false, type: 'followers' });
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [userFollowersCount, setUserFollowersCount] = useState(0);
  const [userFollowingCount, setUserFollowingCount] = useState(0);
  const [userConnectionsCount, setUserConnectionsCount] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollListenerReady, setScrollListenerReady] = useState(false);
  
  // États pour les statistiques indépendantes
  const [userStats, setUserStats] = useState<{totalPosts: number, totalLikes: number} | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Refs pour éviter les problèmes de closure dans les event listeners
  const loadingMoreRef = useRef(false);
  const hasMorePostsRef = useRef(true);
  
  // Récupérer les informations de l'utilisateur depuis les posts
  const targetUser = useMemo(() => {
    const result = userPosts.length > 0 ? userPosts[0].author : null;
    return result;
  }, [userPosts]);

  // Utiliser les statistiques indépendantes plutôt que de calculer à partir des posts chargés
  const totalLikes = useMemo(() => {
    return userStats?.totalLikes || 0;
  }, [userStats]);

  // Hook SEO pour l'indexation automatique de tous les profils - DOIT être avant les returns conditionnels
  const fullName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : '';
  
  const seoData = useMemo(() => ({
    title: userProfile ? `${fullName} (@${userProfile.username}) - Jurinapse` : 'Profil - Jurinapse',
    description: userProfile?.bio || `Découvrez le profil de ${fullName} sur Jurinapse`,
    type: 'profile' as const,
    url: userProfile ? `https://jurinapse.com/profile/${userProfile.username}` : undefined,
    username: userProfile?.username,
    fullName: fullName,
    shouldSubmitToGoogle: !!userProfile, // Indexation automatique pour tous les profils
    keywords: userProfile ? `${fullName}, ${userProfile.username}, jurinapse, juriste, droit, professionnel juridique` : undefined
  }), [userProfile, fullName]);

  useSEO(seoData);

  // Charger les posts de l'utilisateur avec pagination
  useEffect(() => {
    const loadUserPosts = async (pageToLoad = 1, resetPosts = true) => {
      // Si userId est un username (pas un ObjectId MongoDB), on peut l'utiliser directement
      let username = userId;
      
      // Si userId est un ObjectId MongoDB, on attend d'avoir le userProfile pour récupérer le username
      if (userId.match(/^[0-9a-fA-F]{24}$/)) {
        if (!userProfile?.username) return;
        username = userProfile.username;
      }
      
      try {
        if (pageToLoad === 1) {
          setPostsLoading(true);
        } else {
          setLoadingMore(true);
        }
        
        const result = await postsAPI.getAllUserPostsForProfile(username, pageToLoad, 12);
        
        if (result.success) {
          if (resetPosts || pageToLoad === 1) {
            setUserPosts(result.posts);
          } else {
            setUserPosts(prev => [...prev, ...result.posts]);
          }
          setHasMorePosts(result.hasMore || false);
          hasMorePostsRef.current = result.hasMore || false;
          setCurrentPage(pageToLoad);
          
          // Activer le scroll listener après le premier chargement réussi
          if (pageToLoad === 1) {
            setScrollListenerReady(true);
          }
          
        } else {
          if (resetPosts || pageToLoad === 1) {
            setUserPosts([]);
          }
          setHasMorePosts(false);
          hasMorePostsRef.current = false;
        }
        
      } catch (error) {
        console.error('[PROFIL] Erreur critique:', error);
        
        // Dernier recours : contexte global (limité à 12 posts)
        if (pageToLoad === 1 && posts) {
          const filteredPosts = userId.match(/^[0-9a-fA-F]{24}$/) 
            ? posts.filter((post: any) => post.authorId === userId)
            : posts.filter((post: any) => post.author && post.author.username === userId);
          setUserPosts(filteredPosts);
        }
        setHasMorePosts(false);
        hasMorePostsRef.current = false;
        
      } finally {
        setPostsLoading(false);
        setLoadingMore(false);
      }
    };

    // Reset et charger la première page
    loadUserPosts(1, true);
  }, [userId, userProfile?.username]);

  // Fonction pour charger plus de posts
  const loadMorePosts = async () => {
    if (loadingMoreRef.current || !hasMorePostsRef.current) return;
    
    const nextPage = currentPage + 1;
    
    // Réutiliser la même logique de chargement
    let username = userId;
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      if (!userProfile?.username) return;
      username = userProfile.username;
    }
    
    try {
      setLoadingMore(true);
      loadingMoreRef.current = true;
      const result = await postsAPI.getAllUserPostsForProfile(username, nextPage, 12);
      
      if (result.success && result.posts.length > 0) {
        setUserPosts(prev => [...prev, ...result.posts]);
        setHasMorePosts(result.hasMore || false);
        hasMorePostsRef.current = result.hasMore || false;
        setCurrentPage(nextPage);
      } else {
        setHasMorePosts(false);
        hasMorePostsRef.current = false;
      }
    } catch (error) {
      console.error('[PROFIL] Erreur chargement page suivante:', error);
      setHasMorePosts(false);
      hasMorePostsRef.current = false;
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  };

  // Détection du scroll infini automatique
  useEffect(() => {
    // Attendre que les posts soient chargés avant d'activer le scroll listener
    if (!scrollListenerReady) {
      return;
    }
    
    const handleScroll = () => {
      // Utiliser les refs pour éviter les problèmes de closure
      if (loadingMoreRef.current || !hasMorePostsRef.current) {
        return;
      }
      
      // Calculer la position du scroll
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.offsetHeight;
      
      const distanceFromBottom = docHeight - (scrollTop + windowHeight);
      
      // Si on est à moins de 300px du bas, charger plus de posts
      if (distanceFromBottom <= 300) {
        loadMorePosts();
      }
    };

    // Ajouter l'écouteur de scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    console.log('👂 [SCROLL] Event listener ajouté avec options passive:true');
    
    // Test immédiat pour vérifier si on est déjà proche du bas
    const initialScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const initialWindowHeight = window.innerHeight;
    const initialDocHeight = document.documentElement.offsetHeight;
    const initialDistanceFromBottom = initialDocHeight - (initialScrollTop + initialWindowHeight);
    
    if (initialDistanceFromBottom <= 300 && hasMorePostsRef.current && !loadingMoreRef.current) {
      setTimeout(() => loadMorePosts(), 100); // Petit délai pour éviter les conflits
    }
    
    // Nettoyer l'écouteur au démontage
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollListenerReady]); // Dépendre de scrollListenerReady

  // Charger les statistiques de l'utilisateur
  useEffect(() => {
    const loadUserStats = async () => {
      // Guard: S'assurer que nous avons userId et les fonctions nécessaires
      if (!userId || !getFollowersCount || !getFollowingCount || !getConnectionsAsync) {
        return;
      }
      
      try {
        const [followers, following, connections] = await Promise.all([
          getFollowersCount(userId),
          getFollowingCount(userId),
          getConnectionsAsync(userId) // Utiliser getConnectionsAsync au lieu de getConnections
        ]);
        setUserFollowersCount(followers);
        setUserFollowingCount(following);
        setUserConnectionsCount(connections?.length || 0);
      } catch (error) {
        // En cas d'erreur, mettre des valeurs par défaut
        setUserFollowersCount(0);
        setUserFollowingCount(0);
        setUserConnectionsCount(0);
      }
    };

    loadUserStats();
  }, [userId]); // Supprimer les dépendances sur les fonctions pour éviter les boucles

  // Charger les statistiques de posts de l'utilisateur de façon indépendante
  useEffect(() => {
    const loadPostsStats = async () => {
      // Déterminer le username à utiliser
      let username = userId;
      if (userId.match(/^[0-9a-fA-F]{24}$/)) {
        // Si c'est un ID MongoDB, attendre d'avoir le userProfile
        if (!userProfile?.username) return;
        username = userProfile.username;
      }
      
      try {
        setStatsLoading(true);
        
        const result = await postsAPI.getUserStats(username);
        if (result.success && result.stats) {
          setUserStats(result.stats);
        } else {
          setUserStats({ totalPosts: 0, totalLikes: 0 });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setUserStats({ totalPosts: 0, totalLikes: 0 });
      } finally {
        setStatsLoading(false);
      }
    };

    loadPostsStats();
  }, [userId, userProfile?.username]); // Dépendre du userId et du username

  // Charger l'utilisateur seulement quand userId change
  useEffect(() => {
    const loadUser = async () => {
      // Guard: S'assurer que nous avons userId et les fonctions nécessaires
      if (!userId || !getUserById || !getUserByUsername) {
        return;
      }
      
      try {
        setLoading(true);
        setUserProfile(null); // Reset le profil
        
        // TOUJOURS appeler l'API pour avoir les données complètes du profil (notamment l'université)
        // On ignore targetUser car il ne contient que les données de base (pas university)
        
        // Vérifier si userId est un ID MongoDB ou un username
        let foundUser;
        if (userId.match(/^[0-9a-fA-F]{24}$/)) {
          // C'est un ID MongoDB
          foundUser = await getUserById(userId);
        } else {
          // C'est un username
          foundUser = await getUserByUsername(userId);
        }
        setUserProfile(foundUser);
      } catch (error) {
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId]); // Supprimer toutes les dépendances sur les fonctions pour éviter les boucles

  // Détecter quand l'utilisateur n'est pas trouvé après le chargement
  useEffect(() => {
    if (!loading && !userProfile && onUserNotFound) {
      // Attendre un peu avant de rediriger pour éviter les faux positifs
      const timer = setTimeout(() => {
        if (!userProfile) {
          onUserNotFound();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, userProfile, onUserNotFound]);

  // Charger le statut de blocage
  // Charger le statut de blocage
  useEffect(() => {
    const loadBlockedStatus = async () => {
      // Guard: S'assurer que nous avons toutes les données nécessaires
      if (!userProfile?.id || !currentUser || !isBlocked) {
        return;
      }
      
      try {
        const isUserBlocked = await isBlocked(userProfile.id);
        setBlocked(isUserBlocked);
      } catch (error) {
        // En cas d'erreur, considérer que l'utilisateur n'est pas bloqué
        console.error('Erreur lors de la vérification du statut de blocage:', error);
        setBlocked(false);
      }
    };

    loadBlockedStatus();
  }, [userProfile?.id, currentUser?.id]); // Utiliser seulement les IDs stables

  // Auto-hide success message
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Si on ne trouve pas l'utilisateur, récupérer depuis le context des abonnements
  // Afficher un état de chargement
  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Utilisateur non trouvé</h2>
            <p className="text-sm sm:text-base text-gray-600">
              Cet utilisateur n'existe pas ou a été supprimé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur est un compte supprimé
  if (userProfile.username === 'utilisateur_supprime' || userProfile.isDeleted) {
    return <DeletedUserPage onGoBack={onProfileClick} />;
  }

  // Récupérer SEULEMENT les dossiers racine publics de l'utilisateur (pas les sous-dossiers)
  const userRootFolders = Array.isArray(folders) ? 
    folders.filter((folder: any) => folder.ownerId === userId && !folder.parentId && folder.isPublic) : 
    [];

  const isOwnProfile = currentUser && userProfile && (
    (currentUser.id === userId) || 
    (currentUser.username === userId) ||
    (currentUser.id === userProfile.id)
  );
  
  // Fonction appelée quand le statut de suivi change
  const handleFollowChange = async (_isFollowing: boolean) => {
    try {
      // Invalider le cache pour s'assurer que tout est synchronisé
      await invalidateCache();
      
      // Recharger les compteurs de followers (celui qui peut changer)
      const newFollowersCount = await getFollowersCount(userId);
      setUserFollowersCount(newFollowersCount);
    } catch (error) {
    }
  };

  const handleBlock = async () => {
    try {
      await blockUser(userId);
      setShowBlockConfirm(false);
      setBlocked(true); // Mettre à jour l'état local
      setShowSuccessMessage('Utilisateur bloqué avec succès !');
      // L'utilisateur reste sur la page après blocage
    } catch (error) {
      console.error('Erreur lors du blocage:', error);
    }
  };

  const handleUnblock = async () => {
    try {
      await unblockUser(userId);
      setShowUnblockConfirm(false);
      setBlocked(false); // Mettre à jour l'état local
      setShowSuccessMessage('Utilisateur débloqué avec succès !');
    } catch (error) {
      console.error('Erreur lors du déblocage:', error);
    }
  };

  const handleSendMessage = async () => {
    try {
      if (onSendMessage) {
        // Utiliser le callback personnalisé si fourni
        onSendMessage(userId);
      } else {
        // Utiliser directement le contexte de messagerie
        // Utiliser l'ID réel de l'utilisateur (pas le username)
        const realUserId = userProfile?.id || userProfile?._id;
        
        if (!realUserId) {
          console.error('❌ ID utilisateur réel introuvable');
          setShowSuccessMessage('Erreur: Impossible de trouver l\'utilisateur');
          return;
        }
        
        // Rediriger immédiatement vers la messagerie avec le paramètre utilisateur
        window.location.href = `/messages?user=${realUserId}`;
        
        // Note: La création/recherche de conversation se fera automatiquement 
        // dans MessagingPage grâce au paramètre URL
      }
    } catch (error) {
      console.error('❌ Erreur lors de la redirection:', error);
      setShowSuccessMessage('Erreur lors de l\'ouverture de la conversation');
    }
  };

  const handleViewUserProfile = (viewUserId: string) => {
    // Fermer la modal
    setShowSubscriptionModal({ isOpen: false, type: 'followers' });
    
    // Ne naviguer vers un autre profil que si c'est différent du profil actuel
    if (viewUserId !== userId) {
      // Utiliser la fonction de navigation du parent si elle est disponible
      if (onViewUserProfile) {
        onViewUserProfile(viewUserId);
      } else {
        // Fallback: log pour debug
      }
    }
  };

  const handleOpenFolder = (folderId: string) => {
    // TODO: Implémenter la navigation vers le dossier
    // Pour l'instant, on peut ouvrir dans un nouvel onglet
    window.open(`/folder/${folderId}`, '_blank');
  };

  if (blocked) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
          <div className="text-red-400 mb-4">
            <Shield className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Utilisateur bloqué</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Vous avez bloqué cet utilisateur. Vous ne pouvez pas voir son profil.
          </p>
          <button
            onClick={() => setShowUnblockConfirm(true)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
          >
            Débloquer cet utilisateur
          </button>
        </div>
        
        {/* Modal de confirmation de déblocage (répétée ici car le reste du composant n'est pas rendu) */}
        {showUnblockConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Débloquer cet utilisateur
                </h3>
                <p className="text-gray-600 mb-6">
                  Cet utilisateur pourra à nouveau voir votre profil et interagir avec vous.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUnblockConfirm(false)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUnblock}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                  >
                    Débloquer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Message de succès */}
        {showSuccessMessage && (
          <div className="fixed top-6 right-6 z-50 transform transition-all">
            <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3">
              <div className="bg-white/20 p-1 rounded-full">
                <Check className="h-4 w-4" />
              </div>
              <span className="font-medium">{showSuccessMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderTabContent = () => {
    if (activeTab === 'folders') {
      return (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Folder className="h-5 w-5" />
            <span>Dossiers publics de {userProfile.username}</span>
          </h2>
          
          {userRootFolders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Folder className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun dossier public</h3>
              <p className="text-gray-600">
                {userProfile.username} n'a pas encore créé de dossiers publics.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-6">
                Affichage des dossiers principaux uniquement. Les sous-dossiers sont accessibles en naviguant dans chaque dossier.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userRootFolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onOpen={handleOpenFolder}
                    isOwner={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isOwnProfile ? 'Mes publications' : `Publications de ${userProfile.username}`}
        </h2>
        
        {userPosts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <BookOpen className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune publication</h3>
            <p className="text-gray-600">
              {isOwnProfile 
                ? 'Vous n\'avez pas encore publié de contenu. Commencez par partager une fiche d\'arrêt ou un conseil !'
                : `${userProfile.username} n'a pas encore publié de contenu.`
              }
            </p>
          </div>
        ) : (
          <div>
            <div className="space-y-6">
              {userPosts.map((post, index) => (
                <React.Fragment key={post.id}>
                  <PostCard 
                    post={post} 
                    onLogin={() => {}} 
                    onViewUserProfile={handleViewUserProfile}
                    onTagClick={onTagClick}
                    onViewPost={onViewPost}
                    onViewDecision={onViewDecision}
                    tagsClickable={false}
                  />
                  {/* Ajouter une pub tous les 4 posts */}
                  {(index + 1) % 4 === 0 && index < userPosts.length - 1 && (
                    <div className="flex justify-center my-6">
                      <MediumRectangle className="mx-auto" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* Indicateur de chargement automatique ou bouton manuel */}
            {loadingMore && (
              <div className="flex justify-center mt-8">
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-3 rounded-xl font-medium flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-700 border-t-transparent"></div>
                  <span>Chargement des posts suivants...</span>
                </div>
              </div>
            )}
            
            {/* Bouton Charger plus (manuel) - affiché seulement s'il n'y a pas de chargement en cours */}
            {hasMorePosts && !loadingMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMorePosts}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2 group"
                >
                  <svg className="w-5 h-5 transform group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>Charger plus de posts</span>
                </button>
              </div>
            )}
            
            {/* Message de fin */}
            {!hasMorePosts && userPosts.length > 12 && !postsLoading && (
              <div className="flex justify-center mt-8">
                <div className="text-gray-500 font-medium">
                  ✨ Vous avez vu tous les posts !
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen">
      <ProfileSEO
        user={userProfile}
        postsCount={userPosts.length}
        followersCount={userFollowersCount}
        followingCount={userFollowingCount}
        connectionsCount={userConnectionsCount}
        totalLikes={totalLikes}
      />
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Contenu principal */}
          <div className="xl:col-span-3">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 lg:p-10 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            {/* Main content */}
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-8">
                {/* Avatar amélioré avec bordure et ombre */}
                <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center overflow-hidden shadow-xl ring-2 sm:ring-4 ring-white">
                    {userProfile.profilePicture ? (
                      <img 
                        src={(() => {
                          const fixedUrl = fixProfilePictureUrl(userProfile.profilePicture);
                          const imageSource = fixedUrl || userProfile.profilePicture;
                          
                          // Debug temporaire
                          console.log('🔍 DEBUG Profile Picture UserProfile:', {
                            originalUrl: userProfile.profilePicture,
                            fixedUrl: fixedUrl,
                            finalImageSource: imageSource
                          });
                          
                          // Si c'est une URL d'API, l'utiliser directement avec cache-busting
                          if (imageSource.startsWith('/api/') || imageSource.startsWith('http')) {
                            const separator = imageSource.includes('?') ? '&' : '?';
                            const finalUrl = `${imageSource}${separator}t=${Date.now()}`;
                            console.log('🔍 Final URL (API):', finalUrl);
                            return finalUrl;
                          }
                          // Si c'est déjà du base64 complet, l'utiliser directement
                          if (imageSource.startsWith('data:')) {
                            console.log('🔍 Final URL (Base64):', imageSource.substring(0, 50) + '...');
                            return imageSource;
                          }
                          // Sinon, ajouter le préfixe base64
                          const finalUrl = `data:image/jpeg;base64,${imageSource}`;
                          console.log('🔍 Final URL (Added Base64):', finalUrl.substring(0, 50) + '...');
                          return finalUrl;
                        })()} 
                        alt={userProfile.username}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          console.error('❌ Image failed to load in UserProfile:', e.currentTarget.src);
                          e.currentTarget.style.display = 'none';
                          const fallbackIcon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                          if (fallbackIcon) {
                            fallbackIcon.classList.remove('hidden');
                          }
                        }}
                        onLoad={() => {
                          console.log('✅ Image loaded successfully in UserProfile');
                        }}
                      />
                    ) : (
                      <User className="h-16 w-16 text-white" />
                    )}
                  </div>
                </div>
              
                <div className="flex-1 space-y-3">
                  {/* Nom et badges */}
                  <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {userProfile.firstName} {userProfile.lastName}
                    </h1>
                    {isOwnProfile && (
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-semibold shadow-md">
                        Votre profil
                      </span>
                    )}
                  </div>
                  
                  {/* Username avec style amélioré */}
                  <p className="text-xl text-gray-600 font-medium flex items-center space-x-2">
                    <span>@{userProfile.username}</span>
                  </p>
                  
                  {/* Statut avec université intégrée - Design amélioré */}
                  <div className="flex items-center space-x-3">
                    {userProfile.isStudent ? (
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl shadow-lg">
                        <div className="bg-white/20 rounded-full p-1">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <span className="font-semibold">Étudiant</span>
                        {userProfile.university && userProfile.university.trim() !== '' ? (
                          <>
                            <span className="text-emerald-100">•</span>
                            <span className="text-emerald-50 font-medium">
                              {userProfile.university.replace(/^Université de\s+/i, '')}
                            </span>
                          </>
                        ) : (
                          <span className="text-red-200 text-sm">[DBG: uni="{userProfile.university}"]</span>
                        )}
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-600 to-gray-700 text-white rounded-xl shadow-lg">
                        <div className="bg-white/20 rounded-full p-1">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <span className="font-semibold">Professionnel</span>
                        {userProfile.university && (
                          <>
                            <span className="text-slate-200">•</span>
                            <span className="text-slate-100 font-medium">{userProfile.university}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Date d'inscription avec style amélioré */}
                  <div className="flex items-center space-x-2 text-base text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="bg-gray-200 rounded-full p-1">
                      <Calendar className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="font-medium">
                      Membre depuis {new Intl.DateTimeFormat('fr-FR', {
                        month: 'long',
                        year: 'numeric'
                      }).format(new Date(userProfile.joinedAt || userProfile.createdAt || Date.now()))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions - Positioned in top right */}
            <div className="flex items-start space-x-3 ml-6">
              {isOwnProfile && (
                <button
                  onClick={() => {
                    // Rediriger vers le profil principal avec fonctionnalité d'édition
                    if (onProfileClick) {
                      onProfileClick();
                    }
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <Edit3 className="h-5 w-5" />
                  <span>Modifier le profil</span>
                </button>
              )}
              
              {!isOwnProfile && currentUser && (
                <div className="flex flex-col space-y-3">
                  <div className="flex space-x-3">
                    <FollowButton 
                      userId={userId} 
                      size="lg" 
                      showBlockButton={false}
                      onFollowChange={handleFollowChange}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>Message</span>
                    </button>
                  </div>
                  {blocked ? (
                    <button
                      onClick={() => setShowUnblockConfirm(true)}
                      className="px-4 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      Débloquer
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowBlockConfirm(true)}
                      className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      Bloquer
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio améliorée */}
          {userProfile.bio && (
            <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-1">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span>À propos</span>
              </h3>
              <p className="text-gray-700 leading-relaxed text-base font-medium">
                {userProfile.bio}
              </p>
            </div>
          )}

          {/* Stats avec design moderne */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setShowSubscriptionModal({ isOpen: true, type: 'followers' })}
                className="group bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 border border-emerald-100"
              >
                <div className="text-3xl font-bold text-emerald-600 mb-1 group-hover:text-emerald-700">{userFollowersCount}</div>
                <div className="text-sm font-medium text-emerald-700">Abonnés</div>
              </button>
              <button
                onClick={() => setShowSubscriptionModal({ isOpen: true, type: 'following' })}
                className="group bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 border border-blue-100"
              >
                <div className="text-3xl font-bold text-blue-600 mb-1 group-hover:text-blue-700">{userFollowingCount}</div>
                <div className="text-sm font-medium text-blue-700">Abonnements</div>
              </button>
              <button
                onClick={() => setShowSubscriptionModal({ isOpen: true, type: 'connections' })}
                className="group bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 border border-purple-100"
              >
                <div className="text-3xl font-bold text-purple-600 mb-1 group-hover:text-purple-700">{userConnectionsCount}</div>
                <div className="text-sm font-medium text-purple-700">Connexions</div>
              </button>
              <div className="group bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-6 border border-rose-100">
                <div className="text-3xl font-bold text-rose-600 mb-1">
                  {statsLoading ? '...' : totalLikes}
                </div>
                <div className="text-sm font-medium text-rose-700">J'aime reçus</div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs avec design moderne */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
            <nav className="flex space-x-2 px-8 py-2">
              <button
                onClick={() => setActiveTab('posts')}
                className={`relative py-4 px-6 font-semibold text-base transition-all duration-300 rounded-xl ${
                  activeTab === 'posts'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5" />
                  <span>Publications ({statsLoading ? '...' : userStats?.totalPosts || 0})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('folders')}
                className={`relative py-4 px-6 font-semibold text-base transition-all duration-300 rounded-xl ${
                  activeTab === 'folders'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Folder className="h-5 w-5" />
                  <span>Dossiers ({userRootFolders.length})</span>
                </div>
              </button>
            </nav>
          </div>
          
          <div className="p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {/* Sidebar avec publicités */}
      <div className="hidden xl:block xl:col-span-1">
        <div className="sticky top-20 space-y-6">
          {/* Publicité Skyscraper */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <WideSkyscraper className="mx-auto" />
          </div>
        </div>
      </div>
    </div>

      {/* Modal des abonnements */}
      <SubscriptionModal
        isOpen={showSubscriptionModal.isOpen}
        onClose={() => setShowSubscriptionModal({ isOpen: false, type: 'followers' })}
        userId={userId}
        type={showSubscriptionModal.type}
        onViewUserProfile={handleViewUserProfile}
        onProfileClick={onProfileClick} // Permet de rediriger vers le vrai profil de l'utilisateur connecté
      />

      {/* Modal de confirmation de blocage */}
      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Bloquer cet utilisateur
              </h3>
              <p className="text-gray-600 mb-6">
                Cet utilisateur ne pourra plus voir votre profil ni interagir avec vous. 
                Vous serez automatiquement désabonné de cet utilisateur et ne pourrez plus voir ses publications.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleBlock}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Bloquer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de déblocage */}
      {showUnblockConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Débloquer cet utilisateur
              </h3>
              <p className="text-gray-600 mb-6">
                Cet utilisateur pourra à nouveau voir votre profil et interagir avec vous.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUnblockConfirm(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUnblock}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                >
                  Débloquer
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
      </div>
    </div>
  );
};

export default UserProfilePage;
