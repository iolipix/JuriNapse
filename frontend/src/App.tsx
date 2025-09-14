import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PostProvider, usePost } from './contexts/PostContext';
import { MessagingProvider, useMessaging } from './contexts';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { FolderProvider } from './contexts/FolderContext';
import { SocketProvider } from './contexts/SocketContext';
import { SavedPostsProvider } from './contexts/SavedPostsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CookieProvider } from './hooks/useCookieConsent';
import { AdProvider } from './components/Ads';
import AuthForm from './components/Auth/AuthForm';
import EmailVerificationPage from './components/Auth/EmailVerificationPage';
import VerificationRequiredPage from './components/Auth/VerificationRequiredPage';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import BetaBanner from './components/Layout/BetaBanner';
import FeedPage from './components/Feed/FeedPage';
import ProfilePage from './components/Profile/ProfilePage';
import { hasRole } from './utils/roles';
import UserProfilePage from './components/Profile/UserProfilePage';
import NotificationsPage from './components/Notifications/NotificationsPage';
import MessagingPage from './components/Messaging/MessagingPage';
import PostDetailPage from './components/Post/PostDetailPage';
import { usersAPI } from './services/api';
import CreatePostModal from './components/Post/CreatePostModal';
import SettingsPage from './components/Settings/SettingsPage';
import SettingsMenu from './components/Settings/SettingsMenu';
import SuggestedUsers from './components/Subscription/SuggestedUsers';
import DecisionPage from './components/Decision/DecisionPage';
import LegalPage from './components/Legal/LegalPage';
import CookieConsent from './components/Common/CookieConsent';
import AdminPage from './components/Admin/AdminPage';
import AdminMenu from './components/Admin/AdminMenu';
import ModeratorsManagement from './components/Admin/ModeratorsManagement';
import ModeratorMenu from './components/Moderator/ModeratorMenu';

const MainApp: React.FC = () => {
  const { user, isLoading, needsEmailVerification, pendingVerificationUserId } = useAuth();
  const { posts, getPostBySlugOrId } = usePost();
  const { getTotalUnreadMessagesCount } = useMessaging();

  // CRITICAL FIX: Check isLoading BEFORE declaring any useState hooks to fix React error #310
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const userRef = useRef(user);
  
  // Synchroniser le ref avec l'utilisateur actuel
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  const [activeTab, setActiveTab] = useState('feed');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [_selectedTag, setSelectedTag] = useState<string | null>(null); // TODO: Utiliser pour le filtrage par tag
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const [viewingDecision, setViewingDecision] = useState<string | null>(null);
  const [targetMessageUserId, setTargetMessageUserId] = useState<string | null>(null);
  const [settingsTab, setSettingsTab] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showVerificationRequired, setShowVerificationRequired] = useState(false);

  // Détecter automatiquement le besoin de vérification d'email
  useEffect(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    // Si on a un token dans l'URL, afficher la page de vérification
    if (searchParams.has('token')) {
      setShowEmailVerification(true);
      return;
    }
    
    // Si l'utilisateur doit vérifier son email
    if (needsEmailVerification && !user) {
      setShowVerificationRequired(true);
      return;
    }
    
    // Réinitialiser les états si tout est OK
    setShowEmailVerification(false);
    setShowVerificationRequired(false);
  }, [needsEmailVerification, user]);

  // Gérer l'URL au chargement initial
  useEffect(() => {
    handleRouting();
  }, []);

  // Gérer la navigation avec les boutons du navigateur
  useEffect(() => {
    const handlePopState = () => {
      handleRouting();
    };

    // Écouter les événements de navigation
    window.addEventListener('popstate', handlePopState);

    // Initial route handling au chargement - TOUJOURS exécuter pour gérer F5
    handleRouting();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // Supprimer les dépendances pour éviter les re-rendus

  // Relancer le routage quand l'authentification est prête
  useEffect(() => {
    if (!isLoading) {
      handleRouting();
    }
  }, [isLoading]);

  // Surveiller les changements d'URL directement (pour les cas où popstate ne se déclenche pas)
  useEffect(() => {
    const checkUrlChange = () => {
      const currentPath = window.location.pathname;
      // Vérifier si on est sur une route admin et si l'état ne correspond pas
      if (currentPath === '/admin' && adminTab !== null) {
        console.log('🔧 URL /admin détectée mais adminTab pas null, correction...');
        setAdminTab(null);
      } else if (currentPath.startsWith('/admin/') && adminTab !== currentPath.substring(7)) {
        console.log('🔧 URL admin sous-route détectée, mise à jour adminTab...');
        setAdminTab(currentPath.substring(7));
      }
    };

    // Vérifier toutes les 100ms (léger polling pour détecter les changements d'URL)
    const interval = setInterval(checkUrlChange, 100);

    return () => clearInterval(interval);
  }, [adminTab]); // Dépendre de adminTab pour réagir aux changements

  // Écoute globale pour forcer l'affichage de la vérification (déclenché depuis AuthForm via window.setGlobalVerificationFlag)
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        // @ts-ignore - CustomEvent avec detail
        const detail = e.detail || (e as any).detail;
        if (detail?.v) {
          // Forcer l'affichage immédiat
            setShowVerificationRequired(true);
          // Normaliser l'URL pour cohérence/navigation
          if (window.location.pathname !== '/verification-required') {
            window.history.pushState({}, '', '/verification-required');
          }
        }
      } catch (_) {}
    };
    window.addEventListener('force-verification', handler as any);
    return () => window.removeEventListener('force-verification', handler as any);
  }, []);

  // Re-vérifier la route quand l'utilisateur se charge
  useEffect(() => {
    if (!isLoading && user) {
      const path = window.location.pathname;
      
      // Seulement pour les routes de profil, vérifier si c'est le profil de l'utilisateur connecté
      if (path.startsWith('/') && path.length > 1) {
        const username = path.substring(1);
        if (username === user.username && activeTab !== 'profile') {
          setActiveTab('profile');
          setViewingUserId(null);
        }
      }
    }
  }, [isLoading, user, activeTab]);

  // Fonction utilitaire pour la navigation programmée
  const navigateTo = (url: string) => {
    window.history.pushState({}, '', url);
    // Déclencher manuellement l'événement popstate pour que notre handler le traite
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Fonction pour faire défiler vers le haut
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreatePost = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setIsCreatePostOpen(true);
  };

  const handleLogin = () => {
    // Ne pas ouvrir le modal si on est encore en train de charger l'état d'authentification
    if (isLoading) {
      return;
    }
    setIsAuthOpen(true);
  };

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Fonction utilitaire pour ouvrir le modal de manière sécurisée
  const openAuthModal = () => {
    if (!isLoading && !user) {
      setIsAuthOpen(true);
    }
  };

  const handleHome = () => {
    setActiveTab('feed');
    setViewingUserId(null);
    setViewingPostId(null);
    setViewingDecision(null);
    setSearchQuery('');
    setSelectedTag(null);
    setSettingsTab(null);
    setAdminTab(null);
    
    // Utiliser la nouvelle fonction de navigation
    navigateTo('/');
    
    scrollToTop(); // Défiler vers le haut
  };

  const handleProfileClick = useCallback(() => {
    if (!user) {
      openAuthModal();
      return;
    }
    
    // Réinitialiser tous les états de vue
    setViewingUserId(null);
    setViewingPostId(null);
    setViewingDecision(null);
    setSelectedTag(null);
    
  // Forcer l'onglet profile et naviguer vers la route dédiée
  setActiveTab('profile');
  navigateTo('/profile');
    scrollToTop(); // Défiler vers le haut
  }, [user, activeTab, openAuthModal, navigateTo, scrollToTop]);

  const handleMessagesClick = () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setActiveTab('messages');
    setViewingUserId(null);
    setViewingPostId(null);
    setViewingDecision(null);
    setSelectedTag(null);
    
    // Utiliser la nouvelle fonction de navigation
    navigateTo('/messages');
    scrollToTop(); // Défiler vers le haut
  };

  const handleSendMessage = (userId: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    // Rediriger vers la messagerie avec l'utilisateur spécifique
    setTargetMessageUserId(userId);
    setActiveTab('messages');
    setViewingUserId(null);
    setViewingPostId(null);
    setViewingDecision(null);
    setSelectedTag(null);
  // Utiliser la navigation unifiée pour déclencher handleRouting immédiatement
  navigateTo(`/messages?user=${userId}`);
    scrollToTop();
  };

  const handleViewUserProfile = async (userId: string) => {
    // 🔧 CORRECTION : Vérifier si c'est son propre profil
    if (user && userId === user.id) {
      // Rediriger vers son propre profil
      handleProfileClick();
      return;
    }

    // Essayer de récupérer le username depuis les posts (synchrone)
    const userPost = posts ? posts.find(post => post.authorId === userId) : null;
    const cachedUsername = userPost?.author?.username;

    // Si pas trouvé dans le cache, tenter via API pour garantir username-only
    let usernameToUse = cachedUsername;
    if (!usernameToUse) {
      try {
        const resp = await usersAPI.getUserById(userId);
        if (resp && resp.user && resp.user.username) {
          usernameToUse = resp.user.username;
        }
      } catch (_) {}
    }

    // Si on a un username, naviguer en /:username uniquement
    if (usernameToUse) {
      handleViewUserProfileByUsername(usernameToUse);
      return;
    }

    // En dernier recours, rester sur l'onglet profil utilisateur sans changer l'URL vers un ID
    setViewingUserId(userId);
    setActiveTab('user-profile');
    setViewingPostId(null);
    setViewingDecision(null);
    setSelectedTag(null);
    // Ne pas pousser d'URL /:id; garder l'URL courante
    scrollToTop();
  };

  const handleViewUserProfileByUsername = (username: string) => {
    // Rediriger vers le profil par username
    setViewingUserId(username); // On utilisera username comme identifiant
    setActiveTab('user-profile');
    setViewingPostId(null);
    setViewingDecision(null);
    setSelectedTag(null);
    
    
  // URL canonique sans hash: /:username (jamais /profile/:username ni /:id)
  window.history.pushState({}, '', `/${username}`);
    
    scrollToTop(); // Défiler vers le haut
  };

  const handleViewPost = async (postId: string) => {
    setViewingPostId(postId);
    setActiveTab('post-detail');
    setViewingUserId(null);
    setViewingDecision(null);
    setSelectedTag(null);
    
    
    // Si on vient des notifications, on quitte la page notifications
    if (activeTab === 'notifications') {
      // Navigation silencieuse
    }
    
    // D'abord chercher dans le cache
    let post = posts ? posts.find(p => p.id === postId || p._id === postId) : null;
    
    // Si pas trouvé dans le cache, chercher via l'API
    if (!post) {
      try {
        const apiPost = await getPostBySlugOrId(postId);
        if (apiPost) {
          post = apiPost;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du post:', error);
      }
    }
    
    // Naviguer vers l'URL du post (sans hash) pour une navigation propre
    const identifier = post?.slug || postId;
    window.history.pushState(null, '', `/post/${identifier}`);
    
    // Scroll immédiat pour éviter le problème de timing
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Puis un scroll plus doux après un petit délai
    setTimeout(() => {
      scrollToTop();
    }, 100);
  };

  const handleViewDecision = (decisionNumber: string) => {
    setViewingDecision(decisionNumber);
    setActiveTab('decision');
    setViewingUserId(null);
    setViewingPostId(null);
    setSelectedTag(null);
    
    window.location.hash = `decision-${decisionNumber}`;
    scrollToTop(); // Défiler vers le haut
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setActiveTab('feed');
    setViewingUserId(null);
    setViewingPostId(null);
    setViewingDecision(null);
    setSearchQuery('');
    
    window.location.hash = '';
    scrollToTop(); // Défiler vers le haut
  };

  const handleBackToFeed = () => {
    setViewingUserId(null);
    setViewingPostId(null);
    setViewingDecision(null);
    setActiveTab('feed');
    setSelectedTag(null);
    
    // Réinitialiser le titre à JuriNapse
    document.title = 'JuriNapse';
    
    window.location.hash = '';
    window.history.pushState(null, '', '/');
    scrollToTop(); // Défiler vers le haut
  };

  // Gérer les changements d'onglet depuis la sidebar
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setViewingUserId(null);
    setViewingPostId(null);
    setViewingDecision(null);
    setSelectedTag(null);
    window.location.hash = '';
    
    // Réinitialiser le titre à JuriNapse pour les pages principales
    document.title = 'JuriNapse';
    
    // Réinitialiser l'onglet de paramètres quand on change de page
    // ou quand on va vers la page principale des paramètres
    if (tab !== 'settings') {
      setSettingsTab(null);
    } else {
      // Si on va vers 'settings', aller vers le menu principal (pas d'onglet spécifique)
      setSettingsTab(null);
    }

    // Réinitialiser l'onglet d'administration quand on change de page
    // ou quand on va vers la page principale d'administration
    if (tab !== 'admin') {
      setAdminTab(null);
    } else {
      // Si on va vers 'admin', aller vers le menu principal (pas d'onglet spécifique)
      setAdminTab(null);
    }
    
    // Mettre à jour l'URL selon l'onglet
    switch (tab) {
      case 'fiches':
        window.history.pushState(null, '', '/fiches');
        break;
      case 'publications':
        window.history.pushState(null, '', '/publications');
        break;
      case 'cours':
        window.history.pushState(null, '', '/cours');
        break;
      case 'protocole':
        window.history.pushState(null, '', '/protocole');
        break;
      case 'trending':
        window.history.pushState(null, '', '/trending');
        break;
      case 'notifications':
        if (!user) {
          setIsAuthOpen(true);
          return;
        }
        window.history.pushState(null, '', '/notifications');
        break;
      case 'feed':
        window.history.pushState(null, '', '/');
        break;
      case 'settings':
        window.history.pushState(null, '', '/settings');
        break;
      case 'admin':
        if (!user || !hasRole(user, 'administrator')) {
          return;
        }
        window.history.pushState(null, '', '/admin');
        break;
      case 'moderator':
        if (!user || !hasRole(user, 'moderator')) {
          return;
        }
        window.history.pushState(null, '', '/moderator');
        break;
      case 'legal':
        window.history.pushState(null, '', '/conditions-utilisation');
        break;
      default:
        break;
    }
    
    scrollToTop(); // Défiler vers le haut
  };

  // Navigation vers un onglet spécifique de paramètres
  const handleSettingsTabNavigation = (settingsTabId: string) => {
    setActiveTab('settings');
    setSettingsTab(settingsTabId);
    window.history.pushState(null, '', `/settings/${settingsTabId}`);
  };

  // Retour au menu principal des paramètres
  const handleBackToSettingsMenu = () => {
    setSettingsTab(null);
    setActiveTab('settings-menu');
    window.history.pushState(null, '', '/settings');
  };

  // Navigation vers un onglet spécifique d'administration
  const handleAdminTabNavigation = (adminTabId: string) => {
    if (!user || !hasRole(user, 'administrator')) {
      return;
    }
    setActiveTab('admin');
    setAdminTab(adminTabId);
    window.history.pushState(null, '', `/admin/${adminTabId}`);
  };

  // Retour au menu principal d'administration
  const handleBackToAdminMenu = () => {
    if (!user || !hasRole(user, 'administrator')) {
      return;
    }
    setAdminTab(null);
    setActiveTab('admin');
    window.history.pushState(null, '', '/admin');
  };

  // Gestion du routage basé sur l'URL - VERSION SIMPLIFIÉE
  const handleRouting = () => {
    const path = window.location.pathname;
    
    // Attendre que l'authentification soit prête pour les routes admin, MAIS seulement si on n'a vraiment pas d'utilisateur
    if (path.startsWith('/admin') && isLoading && !user) {
      return;
    }
    
    // Route racine - retour à l'accueil
    if (path === '/' || path === '') {
      setActiveTab('feed');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      setAdminTab(null);
      // Forcer le scroll vers le haut
      setTimeout(() => {
        scrollToTop();
      }, 100);
      return;
    }

    // Route profil privé
  if (path === '/profile') {
      if (!user) {
        openAuthModal();
        return;
      }
      setActiveTab('profile');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      setAdminTab(null);
      setTimeout(() => scrollToTop(), 100);
      return;
    }
    
    // Gestion des routes spécifiques
    if (path === '/auth' || path === '/login') {
      setIsAuthOpen(true);
      return;
    }
    
    // Route pour la messagerie
    if (path === '/messages') {
      console.log('🔀 Route /messages détectée dans handleRouting');
      setActiveTab('messages');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      setAdminTab(null);
      
      // Gérer le paramètre 'user' pour ouvrir une conversation spécifique
      const searchParams = new URLSearchParams(window.location.search);
      const targetUserId = searchParams.get('user');
      console.log('🔍 Paramètre URL "user":', targetUserId);
      
      if (targetUserId) {
        console.log('🎯 Setting targetMessageUserId:', targetUserId);
        setTargetMessageUserId(targetUserId);
      } else {
        console.log('🔄 Resetting targetMessageUserId to null');
        setTargetMessageUserId(null);
      }
      
      return;
    }
    
    // Routes pour les différentes sections
    if (path === '/fiches') {
      setActiveTab('fiches');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      setAdminTab(null);
      return;
    }
    
    if (path === '/publications') {
      setActiveTab('publications');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      setAdminTab(null);
      return;
    }
    
    if (path === '/cours') {
      setActiveTab('cours');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      setAdminTab(null);
      return;
    }
    
    if (path === '/protocole') {
      setActiveTab('protocole');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      setAdminTab(null);
      return;
    }
    
    if (path === '/trending') {
      setActiveTab('trending');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      setAdminTab(null);
      return;
    }
    
    if (path === '/notifications') {
      if (!user) {
        setIsAuthOpen(true);
        return;
      }
      setActiveTab('notifications');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      setAdminTab(null);
      return;
    }
    
    // Routes pour les paramètres
    if (path === '/settings') {
      if (!user) {
        setIsAuthOpen(true);
        return;
      }
      setActiveTab('settings');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null); // Menu principal des paramètres
      return;
    }
    
    if (path.startsWith('/settings/')) {
      if (!user) {
        setIsAuthOpen(true);
        return;
      }
      const settingsPath = path.substring(10); // Enlever "/settings/"
      setActiveTab('settings');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(settingsPath);
      return;
    }

    // Routes pour l'administration
    if (path === '/admin') {
      if (!user) {
        setIsAuthOpen(true);
        return;
      }
      // Vérifier si l'utilisateur est admin
      if (!hasRole(user, 'administrator')) {
        // Rediriger vers l'accueil si pas admin
        window.history.replaceState(null, '', '/');
        setActiveTab('feed');
        return;
      }
      setActiveTab('admin');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setAdminTab(null); // Menu principal d'administration
      console.log('🔄 adminTab réinitialisé à null pour menu principal');
      return;
    }
    
    if (path.startsWith('/admin/')) {
      if (!user) {
        setIsAuthOpen(true);
        return;
      }
      // Vérifier si l'utilisateur est admin
      if (!hasRole(user, 'administrator')) {
        // Rediriger vers l'accueil si pas admin
        window.history.replaceState(null, '', '/');
        setActiveTab('feed');
        return;
      }
      const adminPath = path.substring(7); // Enlever "/admin/"
      setActiveTab('admin');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setAdminTab(adminPath);
      return;
    }

    // Routes pour la modération
    if (path === '/moderator') {
      if (!user) {
        setIsAuthOpen(true);
        return;
      }
      // Vérifier si l'utilisateur est modérateur
      const isModerator = hasRole(user, 'moderator');
      if (!isModerator) {
        // Rediriger vers l'accueil si pas modérateur
        window.history.replaceState(null, '', '/');
        setActiveTab('feed');
        return;
      }
      setActiveTab('moderator');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setAdminTab(null);
      return;
    }
    
    // Gestion des routes de posts /post/slug-ou-id
    if (path.startsWith('/post/')) {
      const postIdentifier = path.substring(6); // Enlever "/post/"
      if (postIdentifier) {
        setActiveTab('post-detail');
        setViewingPostId(postIdentifier);
        setViewingUserId(null);
        setViewingDecision(null);
        setSelectedTag(null);
        setSettingsTab(null);
        setAdminTab(null);
        
        return;
      }
    }
    
    // Gestion des routes légales
    if (path === '/conditions-utilisation' || path === '/charte-confidentialite') {
      setActiveTab('legal');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      setAdminTab(null);
      return;
    }
    
    // Normaliser /profile/:username -> /:username
    if (path.startsWith('/profile/')) {
      const username = path.substring('/profile/'.length);
      if (username) {
        window.history.replaceState({}, '', `/${username}`);
        // Continuer le routing avec le nouveau path
      }
    }

    // Vérifier si c'est un profil utilisateur par username (canonique)
    if (path.length > 1 && path.startsWith('/')) {
      const username = path.substring(1); // Enlever le "/" initial
      // Vérifier si c'est un username valide (pas une autre route)
  if (username && !username.includes('/') && username !== 'auth' && username !== 'login' && username !== 'messages' && username !== 'fiches' && username !== 'publications' && username !== 'cours' && username !== 'protocole' && username !== 'trending' && username !== 'notifications' && username !== 'post' && username !== 'settings' && username !== 'admin' && username !== 'conditions-utilisation' && username !== 'charte-confidentialite' && username !== 'profile') {
        // Vérifier si c'est son propre profil (seulement si l'utilisateur est connecté)
        if (user && (username === user.username)) {
          // C'est son propre profil, aller vers l'onglet profile
          setActiveTab('profile');
          setViewingUserId(null);
          setViewingPostId(null);
          setViewingDecision(null);
          setSelectedTag(null);
          setSettingsTab(null);
          setAdminTab(null);
          
          // Garder l'URL du profil pour maintenir la cohérence
          // Ne pas rediriger vers '/', garder l'URL actuelle
        } else {
          // C'est le profil d'un autre utilisateur (ou l'utilisateur n'est pas connecté)
          setViewingUserId(username);
          setActiveTab('user-profile');
          setViewingPostId(null);
          setViewingDecision(null);
          setSelectedTag(null);
          setSettingsTab(null);
          setAdminTab(null);
          
        }
        return;
      }
    }
    
    // Gérer le hash après la route
    const hash = window.location.hash.substring(1);
    
    if (hash.startsWith('user-')) {
      const userId = hash.replace('user-', '');
      handleViewUserProfile(userId);
    } else if (hash.startsWith('post-')) {
      const postId = hash.replace('post-', '');
      handleViewPost(postId); // Pas d'await ici pour éviter de bloquer la navigation
    } else if (hash.startsWith('decision-')) {
      const decisionNumber = hash.replace('decision-', '');
      handleViewDecision(decisionNumber);
    }
  };

  // Gérer la navigation via hash et URL - VERSION SIMPLIFIÉE
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      
      if (hash.startsWith('user-')) {
        const userId = hash.replace('user-', '');
        handleViewUserProfile(userId);
      } else if (hash.startsWith('decision-')) {
        const decisionNumber = hash.replace('decision-', '');
        handleViewDecision(decisionNumber);
      }
      // Supprimé la gestion des hash pour les posts car on utilise maintenant des URLs directes
    };

    // Écouter les changements de hash et popstate
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleRouting);
    
    // Écouter l'événement d'authentification requis
    const handleAuthRequired = () => {
      setIsAuthOpen(true);
    };
    window.addEventListener('auth-required', handleAuthRequired);
    
    // Vérifier le hash initial et la route - SEULEMENT au montage
    handleRouting();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleRouting);
      window.removeEventListener('auth-required', handleAuthRequired);
    };
  }, []);

  // Re-exécuter le routage quand l'utilisateur change ou que le chargement se termine
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Vérifier spécifiquement si on est sur le profil de l'utilisateur connecté
        const path = window.location.pathname;
        if (path.length > 1 && path.startsWith('/')) {
          const username = path.substring(1);
          // Si l'URL correspond au nom d'utilisateur ou ID de l'utilisateur connecté
          if (username === user.username || username === user.id) {
            // S'assurer qu'on est sur l'onglet profile
            setActiveTab('profile');
            setViewingUserId(null);
            setViewingPostId(null);
            setViewingDecision(null);
            setSelectedTag(null);
            
            return;
          }
        }
      }
      
      // Pour tous les autres cas (utilisateur connecté ou non), exécuter le routage normal
      handleRouting();
    }
  }, [user, isLoading]);

  // Fermer le modal d'authentification quand l'utilisateur se connecte
  useEffect(() => {
    if (user && isAuthOpen) {
      setIsAuthOpen(false);
    }
  }, [user, isAuthOpen]);

  // Réinitialiser targetMessageUserId après avoir passé à la messagerie
  useEffect(() => {
    if (activeTab === 'messages' && targetMessageUserId) {
      // Attendre un peu pour laisser le temps à MessagingPage de traiter l'userId
      const timer = setTimeout(() => {
        setTargetMessageUserId(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeTab, targetMessageUserId]);

  const renderContent = () => {
    if (activeTab === 'decision' && viewingDecision) {
      return <DecisionPage decisionNumber={viewingDecision} onBack={handleBackToFeed} onLogin={handleLogin} onViewUserProfile={handleViewUserProfile} onTagClick={handleTagClick} onViewPost={handleViewPost} />;
    }

    if (activeTab === 'post-detail' && viewingPostId) {
      return <PostDetailPage postId={viewingPostId} onBack={handleBackToFeed} onLogin={handleLogin} onViewUserProfile={handleViewUserProfile} onTagClick={handleTagClick} onViewDecision={handleViewDecision} onViewPost={handleViewPost} />;
    }

    if (activeTab === 'user-profile' && viewingUserId) {
      return <UserProfilePage 
        userId={viewingUserId} 
        onTagClick={handleTagClick} 
        onViewPost={handleViewPost} 
        onViewDecision={handleViewDecision} 
        onProfileClick={handleProfileClick} 
        onViewUserProfile={handleViewUserProfile} 
        onSendMessage={handleSendMessage}
        onUserNotFound={() => {
          // Rediriger vers l'accueil si l'utilisateur n'est pas trouvé
          handleHome();
        }}
      />;
    }

    switch (activeTab) {
      case 'notifications':
        return (
          <NotificationsPage 
            onViewUserProfile={handleViewUserProfile}
            onViewPost={handleViewPost}
            onViewFolder={(_folderId) => {
              // TODO: Implémenter la navigation vers les dossiers
            }}
          />
        );
      case 'messages':
        return <MessagingPage onViewPost={handleViewPost} onViewUserProfile={handleViewUserProfile} targetUserId={targetMessageUserId || undefined} />;
  case 'profile':
        if (!user) {
          setIsAuthOpen(true);
          setActiveTab('feed');
          return <FeedPage activeTab={activeTab} searchQuery={searchQuery} selectedTag={_selectedTag || ''} onTagClick={handleTagClick} onViewUserProfile={handleViewUserProfile} onViewPost={handleViewPost} onViewDecision={handleViewDecision} />;
        }
        return <ProfilePage onLogin={handleLogin} onViewUserProfile={handleViewUserProfile} onTagClick={handleTagClick} onViewPost={handleViewPost} onViewDecision={handleViewDecision} />;
      case 'settings':
        if (settingsTab) {
          // Page d'onglet spécifique (ex: /settings/notifications)
          return <SettingsPage 
            settingsTab={settingsTab as any} 
            onBack={handleBackToSettingsMenu}
            onTagClick={handleTagClick} 
            onViewPost={handleViewPost} 
            onViewUserProfile={handleViewUserProfile} 
          />;
        } else {
          // Menu principal des paramètres (/settings)
          return <SettingsMenu onNavigateToTab={handleSettingsTabNavigation} />;
        }
      case 'settings-menu':
        // Menu principal des paramètres (/settings) - même logique que settings sans settingsTab
        return <SettingsMenu onNavigateToTab={handleSettingsTabNavigation} />;
      case 'admin':
        // Vérifier que l'utilisateur est admin
        if (!user || !hasRole(user, 'administrator')) {
          setActiveTab('feed');
          return <FeedPage activeTab={activeTab} searchQuery={searchQuery} selectedTag={_selectedTag || ''} onTagClick={handleTagClick} onViewUserProfile={handleViewUserProfile} onViewPost={handleViewPost} onViewDecision={handleViewDecision} />;
        }
        if (adminTab) {
          // Page d'onglet spécifique d'administration (ex: /admin/moderators)
          switch (adminTab) {
            case 'moderators':
              return <ModeratorsManagement onBack={handleBackToAdminMenu} />;
            default:
              return <AdminMenu onNavigateToTab={handleAdminTabNavigation} />;
          }
        } else {
          // Menu principal d'administration (/admin)
          return <AdminMenu onNavigateToTab={handleAdminTabNavigation} />;
        }
      case 'moderator':
        // Vérifier que l'utilisateur est modérateur
  const isModerator = hasRole(user || undefined, 'moderator');
        if (!user || !isModerator) {
          setActiveTab('feed');
          return <FeedPage activeTab={activeTab} searchQuery={searchQuery} selectedTag={_selectedTag || ''} onTagClick={handleTagClick} onViewUserProfile={handleViewUserProfile} onViewPost={handleViewPost} onViewDecision={handleViewDecision} />;
        }
        return <ModeratorMenu user={user} />;
      case 'administrateur':
        // Backward compatibility - redirect to admin
        if (!user || !hasRole(user, 'administrator')) {
          setActiveTab('feed');
          return <FeedPage activeTab={activeTab} searchQuery={searchQuery} selectedTag={_selectedTag || ''} onTagClick={handleTagClick} onViewUserProfile={handleViewUserProfile} onViewPost={handleViewPost} onViewDecision={handleViewDecision} />;
        }
        return <AdminMenu onNavigateToTab={handleAdminTabNavigation} />;
      case 'legal':
        return <LegalPage />;
      case 'feed':
      case 'fiches':
      case 'publications':
      case 'cours':
      case 'protocole':
      case 'trending':
      case 'saved':
        return <FeedPage activeTab={activeTab} searchQuery={searchQuery} selectedTag={_selectedTag || ''} onTagClick={handleTagClick} onViewUserProfile={handleViewUserProfile} onViewPost={handleViewPost} onViewDecision={handleViewDecision} />;
      default:
        return <FeedPage activeTab={activeTab} searchQuery={searchQuery} selectedTag={_selectedTag || ''} onTagClick={handleTagClick} onViewUserProfile={handleViewUserProfile} onViewPost={handleViewPost} onViewDecision={handleViewDecision} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
  {/* Expose global helper for triggering verification page without reload */}
  <script dangerouslySetInnerHTML={{ __html: `window.setGlobalVerificationFlag = function(v, uid, email){ try { window.dispatchEvent(new CustomEvent('force-verification',{ detail:{ v, uid, email }})); } catch(_) {} };` }} />
      {/* Pages de vérification d'email */}
      {showEmailVerification && (
        <EmailVerificationPage 
          onBack={() => {
            setShowEmailVerification(false);
            window.history.pushState(null, '', '/');
            handleRouting();
          }}
          onVerificationSuccess={() => {
            setShowEmailVerification(false);
            window.history.pushState(null, '', '/');
            handleRouting();
          }}
        />
      )}
      
      {showVerificationRequired && (
        <VerificationRequiredPage 
          onBack={() => {
            setShowVerificationRequired(false);
            window.history.pushState(null, '', '/');
            handleRouting();
          }}
          onLogin={handleLogin}
          userEmail={typeof pendingVerificationUserId === 'string' && pendingVerificationUserId.includes('@') 
            ? pendingVerificationUserId 
            : user?.email
          }
        />
      )}
      
      {/* Interface principale */}
      {!showEmailVerification && !showVerificationRequired && (
        <>
          <Navbar 
            onCreatePost={handleCreatePost}
            onLogin={handleLogin}
            onHome={handleHome}
            onProfileClick={handleProfileClick}
            onMessagesClick={handleMessagesClick}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onViewUserProfile={handleViewUserProfile}
            onViewPost={handleViewPost}
            onViewDecision={handleViewDecision}
            unreadMessagesCount={user ? getTotalUnreadMessagesCount() : 0}
            onToggleMobileMenu={handleToggleMobileMenu}
          />
          
          {/* Bandeau Bêta */}
          <BetaBanner variant="animated" />
          
          <div className="relative min-h-[calc(100vh-128px)]">
            <Sidebar 
              activeTab={activeTab} 
              onTabChange={handleTabChange}
              onLogin={handleLogin}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
            
            <div className="lg:ml-64 min-h-full">
              <div className="flex">
                <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  {renderContent()}
                </div>
                
                {/* SUGGESTIONS SIDEBAR - REAL COMPONENT */}
                {(() => {
                  const noSuggestionsPages = ['post-detail', 'messages', 'settings-menu', 'admin', 'profile', 'user-profile'];
                  const shouldShow = !noSuggestionsPages.includes(activeTab) && !!user;
                  
                  if (!shouldShow) return null;
                  
                  return (
                    <aside className="w-80 p-6 hidden lg:block">
                      <div className="sticky top-36">
                        <SuggestedUsers onViewUserProfile={handleViewUserProfile} />
                      </div>
                    </aside>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Auth Modal */}
          {isAuthOpen && !isLoading && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onMouseDown={(e) => {
                // Sauvegarder si le mousedown est sur le backdrop
                if (e.target === e.currentTarget) {
                  (e.currentTarget as any)._mouseDownOnBackdrop = true;
                }
              }}
              onClick={(e) => {
                // Ne fermer que si mousedown ET click sont sur le backdrop
                if (e.target === e.currentTarget && (e.currentTarget as any)._mouseDownOnBackdrop) {
                  setIsAuthOpen(false);
                }
                // Nettoyer le flag
                (e.currentTarget as any)._mouseDownOnBackdrop = false;
              }}
            >
              <AuthForm onClose={() => setIsAuthOpen(false)} />
            </div>
          )}

          {/* Create Post Modal */}
          <CreatePostModal
            isOpen={isCreatePostOpen}
            onClose={() => setIsCreatePostOpen(false)}
          />
        </>
      )}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <CookieProvider>
        <AuthProvider>
          <SocketProvider>
            <SubscriptionProvider>
              <PostProvider>
                <AdProvider>
                  <SavedPostsProvider>
                    <FolderProvider>
                      <MessagingProvider>
                        <NotificationProvider>
                          <MainApp />
                          <CookieConsent />
                        </NotificationProvider>
                      </MessagingProvider>
                    </FolderProvider>
                  </SavedPostsProvider>
                </AdProvider>
              </PostProvider>
            </SubscriptionProvider>
          </SocketProvider>
        </AuthProvider>
      </CookieProvider>
    </ThemeProvider>
  );
}

export default App;
