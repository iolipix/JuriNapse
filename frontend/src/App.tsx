import React, { useState, useEffect } from 'react';
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
import AuthForm from './components/Auth/AuthForm';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import BetaBanner from './components/Layout/BetaBanner';
import FeedPage from './components/Feed/FeedPage';
import ProfilePage from './components/Profile/ProfilePage';
import UserProfilePage from './components/Profile/UserProfilePage';
import NotificationsPage from './components/Notifications/NotificationsPage';
import MessagingPage from './components/Messaging/MessagingPage';
import PostDetailPage from './components/Post/PostDetailPage';
import CreatePostModal from './components/Post/CreatePostModal';
import SettingsPage from './components/Settings/SettingsPage';
import SettingsMenu from './components/Settings/SettingsMenu';
import SuggestedUsers from './components/Subscription/SuggestedUsers';
import DecisionPage from './components/Decision/DecisionPage';
import TermsOfService from './components/Legal/TermsOfService';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import CookieConsent from './components/Common/CookieConsent';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { posts, getPostBySlugOrId } = usePost();
  const { getTotalUnreadMessagesCount } = useMessaging();
  
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Gérer la navigation avec les boutons du navigateur
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      
      console.log('Navigation vers:', path); // Pour debug
      
      // Réinitialiser tous les états
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setTargetMessageUserId(null);
      setSettingsTab(null);
      setSelectedTag(null);
      
      // Route en fonction du path
      if (path === '/' || path === '') {
        setActiveTab('feed');
      } else if (path === '/messages') {
        setActiveTab('messages');
        const userParam = searchParams.get('user');
        if (userParam) {
          setTargetMessageUserId(userParam);
        }
      } else if (path === '/notifications') {
        setActiveTab('notifications');
      } else if (path === '/conditions-utilisation') {
        setActiveTab('terms');
      } else if (path.startsWith('/post/')) {
        const postId = path.replace('/post/', '');
        setViewingPostId(postId);
        setActiveTab('post-detail');
      } else if (path.startsWith('/decision/')) {
        const decisionNumber = path.replace('/decision/', '');
        setViewingDecision(decisionNumber);
        setActiveTab('decision');
      } else if (path.startsWith('/settings/')) {
        const tab = path.replace('/settings/', '');
        setSettingsTab(tab);
        setActiveTab('settings');
      } else if (path === '/settings') {
        setActiveTab('settings-menu');
        setSettingsTab(null);
      } else if (path.startsWith('/')) {
        // Profil utilisateur
        const username = path.substring(1);
        if (username && user && username === user.username) {
          setActiveTab('profile');
        } else if (username) {
          setViewingUserId(username);
          setActiveTab('user-profile');
        }
      }
    };

    // Écouter les événements de navigation
    window.addEventListener('popstate', handlePopState);

    // Initial route handling au chargement
    handlePopState();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user, isLoading]); // Ajout de isLoading comme dépendance

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
    
    // Utiliser la nouvelle fonction de navigation
    navigateTo('/');
    
    scrollToTop(); // Défiler vers le haut
  };

  const handleProfileClick = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setActiveTab('profile');
    setViewingUserId(null);
    setViewingPostId(null);
    setViewingDecision(null);
    setSelectedTag(null);
    
    // Utiliser le username dans l'URL si disponible
    if (user.username) {
      navigateTo(`/${user.username}`);
    } else {
      navigateTo('/');
    }
    
    scrollToTop(); // Défiler vers le haut
  };

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
    
    window.location.hash = `#user-${userId}`;
    window.history.pushState(null, '', `/messages?user=${userId}`);
    scrollToTop();
  };

  const handleViewUserProfile = (userId: string) => {
    // 🔧 CORRECTION : Vérifier si c'est son propre profil
    if (user && userId === user.id) {
      // Rediriger vers son propre profil
      handleProfileClick();
      return;
    }

    // Essayer de récupérer le username depuis les posts (synchrone)
    const userPost = posts.find(post => post.authorId === userId);
    if (userPost && userPost.author && userPost.author.username) {
      handleViewUserProfileByUsername(userPost.author.username);
    } else {
      // Fallback sur l'ID - utiliser une URL propre
      setViewingUserId(userId);
      setActiveTab('user-profile');
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      
      // URL propre sans hash
      window.history.pushState({}, '', `/${userId}`);
      scrollToTop();
    }
  };

  const handleViewUserProfileByUsername = (username: string) => {
    // Rediriger vers le profil par username
    setViewingUserId(username); // On utilisera username comme identifiant
    setActiveTab('user-profile');
    setViewingPostId(null);
    setViewingDecision(null);
    setSelectedTag(null);
    
    
    // URL propre sans hash
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
    let post = posts.find(p => p.id === postId || p._id === postId);
    
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
    
    // Réinitialiser l'onglet de paramètres quand on change de page
    // ou quand on va vers la page principale des paramètres
    if (tab !== 'settings') {
      setSettingsTab(null);
    } else {
      // Si on va vers 'settings', aller vers le menu principal (pas d'onglet spécifique)
      setSettingsTab(null);
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
      case 'terms':
        window.history.pushState(null, '', '/conditions-utilisation');
        break;
      case 'privacy':
      case 'privacy-policy':
        window.history.pushState(null, '', '/politique-confidentialite');
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

  // Gestion du routage basé sur l'URL - VERSION SIMPLIFIÉE
  const handleRouting = () => {
    const path = window.location.pathname;
    
    // Route racine - retour à l'accueil
    if (path === '/' || path === '') {
      setActiveTab('feed');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      // Forcer le scroll vers le haut
      setTimeout(() => {
        scrollToTop();
      }, 100);
      return;
    }
    
    // Gestion des routes spécifiques
    if (path === '/auth' || path === '/login') {
      setIsAuthOpen(true);
      return;
    }
    
    // Route pour la messagerie
    if (path === '/messages') {
      setActiveTab('messages');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
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
      return;
    }
    
    if (path === '/publications') {
      setActiveTab('publications');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      return;
    }
    
    if (path === '/cours') {
      setActiveTab('cours');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      return;
    }
    
    if (path === '/protocole') {
      setActiveTab('protocole');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
      return;
    }
    
    if (path === '/trending') {
      setActiveTab('trending');
      setViewingUserId(null);
      setViewingPostId(null);
      setViewingDecision(null);
      setSelectedTag(null);
      setSettingsTab(null);
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
    
    // Gestion des routes de posts /post/slug-ou-id
    if (path.startsWith('/post/')) {
      const postIdentifier = path.substring(6); // Enlever "/post/"
      if (postIdentifier) {
        setActiveTab('post-detail');
        setViewingPostId(postIdentifier);
        setViewingUserId(null);
        setViewingDecision(null);
        setSelectedTag(null);
        
        return;
      }
    }
    
    // Vérifier si c'est un profil utilisateur par username
    if (path.length > 1 && path.startsWith('/')) {
      const username = path.substring(1); // Enlever le "/" initial
      // Vérifier si c'est un username valide (pas une autre route)
      if (username && !username.includes('/') && username !== 'auth' && username !== 'login' && username !== 'messages' && username !== 'fiches' && username !== 'publications' && username !== 'cours' && username !== 'protocole' && username !== 'trending' && username !== 'notifications' && username !== 'post' && username !== 'settings' && username !== 'conditions-utilisation') {
        // Si l'utilisateur n'est pas encore chargé, attendre
        if (isLoading) {
          return; // Attendre que l'utilisateur soit chargé
        }
        
        // Vérifier si c'est son propre profil
        if (user && (username === user.username || username === user.id)) {
          // C'est son propre profil, aller vers l'onglet profile
          setActiveTab('profile');
          setViewingUserId(null);
          setViewingPostId(null);
          setViewingDecision(null);
          setSelectedTag(null);
          
          // Garder l'URL du profil pour maintenir la cohérence
          // Ne pas rediriger vers '/', garder l'URL actuelle
        } else {
          // C'est le profil d'un autre utilisateur
          setViewingUserId(username);
          setActiveTab('user-profile');
          setViewingPostId(null);
          setViewingDecision(null);
          setSelectedTag(null);
          
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
    if (user && !isLoading) {
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
      
      // Pour les autres cas, exécuter le routage normal
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

  // Si l'authentification est en cours de chargement, afficher un écran de chargement
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
      case 'terms':
        return <TermsOfService onBack={handleBackToFeed} />;
      case 'privacy':
      case 'privacy-policy':
        return <PrivacyPolicy />;
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

  const renderMainContent = () => {
    // Pour les pages qui n'ont pas besoin de suggestions (profil utilisateur, détail post, etc.)
    const noSuggestionsPages = ['profile', 'user-profile', 'post-detail', 'messages', 'notifications', 'settings', 'decision', 'terms'];
    
    if (noSuggestionsPages.includes(activeTab) || !user) {
      return (
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      );
    }

    // Pour les autres pages, afficher les suggestions à droite (seulement si l'utilisateur est connecté)
    return (
      <div className="flex-1 flex">
        <main className="flex-1 p-6 pr-0">
          {renderContent()}
        </main>
        
        {/* Sidebar droite avec suggestions (seulement si utilisateur connecté) */}
        <aside className="w-80 p-6">
          <div className="sticky top-36">
            <SuggestedUsers onViewUserProfile={handleViewUserProfile} />
          </div>
        </aside>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {renderMainContent()}
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
              </PostProvider>
            </SubscriptionProvider>
          </SocketProvider>
        </AuthProvider>
      </CookieProvider>
    </ThemeProvider>
  );
}

export default App;
