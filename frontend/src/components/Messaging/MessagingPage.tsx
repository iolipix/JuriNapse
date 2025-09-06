import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { subscriptionsAPI } from '../../services/api';
import { User as UserType } from '../../types';
import { Plus, Users, Send, Search, MoreVertical, UserPlus, X, User as UserIcon, Edit, Trash2, ExternalLink, Check, EyeOff, Folder, FileText, Reply, Smile, Camera, Bell, BellOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../services/api';
import { useMessaging } from '../../contexts';
import { usePost } from '../../contexts';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { ReactionModal } from './ReactionModal';
import ChatItem from './ChatItem';

interface MessagingPageProps {
  onViewPost?: (postId: string) => void;
  onViewUserProfile?: (userId: string) => void;
  targetUserId?: string; // ID de l'utilisateur avec qui démarrer une conversation
}

const MessagingPage: React.FC<MessagingPageProps> = ({ onViewPost, onViewUserProfile, targetUserId }) => {
  const { user } = useAuth();
  const { getConnections } = useSubscription();
  const messagingContext = useMessaging();
  const { 
    groups,
    getVisibleGroups, 
    messages, 
    lastMessages, 
    loadMessages, 
    loadMoreMessages, 
    canLoadMoreMessages, 
    isLoadingMessages, 
    createGroup, 
    sendMessage, 
    addMemberToGroup, 
    toggleGroupNotifications, 
    createPrivateChat,
    updateMessage, 
    deleteMessage, 
    addReaction, 
    removeReaction, 
    getCurrentUserReaction, 
    getReactionDetails, 
    getBlockedMembersInGroup, 
    deleteHistory,
    leaveGroup, 
    deleteGroup, 
    getAvailableUsersForGroup, 
    canManageGroup, 
    isGroupAdmin, 
    isGroupModerator, 
    promoteModerator, 
    demoteModerator, 
    kickMember, 
    getMessageDeletionInfo, 
    updateGroup, 
    updateGroupPicture,
    markGroupAsRead,
    getUnreadMessagesCount
  } = messagingContext;
  
  // Accès explicite à isUserMemberOfGroup pour éviter l'erreur TypeScript
  const isUserMemberOfGroup = messagingContext.isUserMemberOfGroup;
  
  const { posts } = usePost();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  
  // Mémoriser le résultat pour éviter les appels pendant le rendu
  const canSendMessage = useMemo(() => {
    return activeGroupId ? isUserMemberOfGroup(activeGroupId) : false;
  }, [activeGroupId, isUserMemberOfGroup]);
  const [messageInput, setMessageInput] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionSearchQuery, setConnectionSearchQuery] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<string | null>(null);
  const [showDeleteHistoryConfirm, setShowDeleteHistoryConfirm] = useState<string | null>(null);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionModal, setShowReactionModal] = useState<string | null>(null); // messageId pour lequel afficher le modal
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [editingGroupDescription, setEditingGroupDescription] = useState(false);
  const [tempGroupName, setTempGroupName] = useState('');
  const [tempGroupDescription, setTempGroupDescription] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]); // Emojis récents (session seulement)
  
  // État pour forcer le rechargement des images de profil
  const [imageRefreshKey, setImageRefreshKey] = useState<{[chatId: string]: number}>({});
  
  // États pour les mentions
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Le handleNewMessage pour la réactivation automatique est géré dans MessagingContext_new.tsx
  // Plus besoin de polling - on utilise uniquement Socket.io pour les notifications

  // Auto-suppression des notifications de succès après 4 secondes
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(null);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Auto-suppression des notifications d'erreur après 5 secondes (un peu plus long pour les erreurs)
  useEffect(() => {
    if (showErrorMessage) {
      const timer = setTimeout(() => {
        setShowErrorMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showErrorMessage]);

  // Surveiller les changements de replyingToMessage
  useEffect(() => {
    // Effet vide pour supprimer les anciens logs
  }, [replyingToMessage]);

  // Charger depuis le serveur après authentification (toujours, même si recentEmojis n'est pas vide)
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await usersAPI.getRecentEmojis();

        if (!cancelled && resp?.success && Array.isArray(resp.recentEmojis)) {
          setRecentEmojis(resp.recentEmojis.slice(0, 32));
        } else {
        }
      } catch (e) { }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Ecouter les réactions ajoutées (event dispatch depuis context)
  useEffect(() => {
    const handler = (e: any) => {
      const emoji = e?.detail?.emoji;
      if (!emoji) return;
      setRecentEmojis(prev => [emoji, ...prev.filter(x => x !== emoji)].slice(0,32));
      try { usersAPI.updateRecentEmojis([emoji, ...recentEmojisRef.current.filter(x => x !== emoji)].slice(0,32)); } catch(_) {}
    };
    window.addEventListener('emoji-used', handler);
    return () => window.removeEventListener('emoji-used', handler);
  }, []);

  // Écouter les mises à jour de photos de groupe
  useEffect(() => {
    const handler = (e: any) => {
      const { groupId } = e?.detail || {};
      if (!groupId) return;
      
      console.log('📸 Événement groupPhotoUpdated reçu pour:', groupId);
      setImageRefreshKey(prev => {
        const newKey = (prev[groupId] || 0) + 1;
        console.log('📸 Nouvelle clé de rafraîchissement:', newKey);
        return {
          ...prev,
          [groupId]: newKey
        };
      });
    };
    window.addEventListener('groupPhotoUpdated', handler);
    return () => window.removeEventListener('groupPhotoUpdated', handler);
  }, []); // Supprimer imageRefreshKey des dépendances pour éviter les boucles

  // Sauvegarde côté serveur (debounce)
  const recentEmojisRef = useRef(recentEmojis);
  recentEmojisRef.current = recentEmojis;
  useEffect(() => {
    if (!user?.id) return;
    if (recentEmojis.length === 0) return;
    const t = setTimeout(async () => {
      try { await usersAPI.updateRecentEmojis(recentEmojisRef.current); } catch (e) { }
    }, 800); // debounce plus long
    return () => clearTimeout(t);
  }, [recentEmojis, user?.id]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const messageMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true); // Pour tracker si l'utilisateur est en bas
  const previousMessagesCountRef = useRef<number>(0); // Pour tracker le nombre de messages précédents
  // const scrollPositionRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null); // (supprimé - inutilisé)
  const hasInitializedScrollRef = useRef<string | null>(null); // Pour tracker si on a déjà initialisé le scroll pour ce groupe
  
  // 🚫 PROTECTION TOTALE CONTRE LE SCROLL AUTOMATIQUE
  const allowAutoScrollRef = useRef(false); // Flag pour autoriser le scroll (seulement via bouton utilisateur)
  
  // Intercepter et bloquer tous les scrollIntoView automatiques (sauf pagination et ouverture)
  useEffect(() => {
    if (messagesEndRef.current) {
      const originalScrollIntoView = messagesEndRef.current.scrollIntoView;
      messagesEndRef.current.scrollIntoView = function(options?: ScrollIntoViewOptions | boolean) {
        if (!allowAutoScrollRef.current) {
          return; // Bloquer le scroll automatique
        }
        allowAutoScrollRef.current = false; // Reset après utilisation
        originalScrollIntoView.call(this, options);
      };
    }
  }, [activeGroupId]);

  // SUPPRIMÉ: handleScrollAdjustment - plus besoin de logique automatique de scroll

  // Utiliser un effet séparé avec des refs pour éviter les boucles
  const messagesLengthRef = useRef(0);
  const isLoadingRef = useRef(false);
  const lastActiveGroupRef = useRef<string | null>(null);
  
  // Effet simple qui ne se déclenche que sur le changement de groupe
  useEffect(() => {
    if (activeGroupId && activeGroupId !== lastActiveGroupRef.current) {
      lastActiveGroupRef.current = activeGroupId;
      messagesLengthRef.current = 0; // Reset pour le nouveau groupe
      isLoadingRef.current = false;
    }
  }, [activeGroupId]);

  // Réinitialiser le compteur quand on change de groupe
  useEffect(() => {
    if (activeGroupId) {
      previousMessagesCountRef.current = 0;
      isLoadingRef.current = false; // Reset du flag de loading
    }
  }, [activeGroupId]);

  // Marquer automatiquement les messages comme lus quand on change de groupe actif
  useEffect(() => {
    if (activeGroupId) {
      // Utiliser un délai pour éviter setState pendant le rendu
      const timer = setTimeout(() => {
        markGroupAsRead(activeGroupId);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [activeGroupId]); // SUPPRIMÉ markGroupAsRead pour éviter la boucle

  // Utiliser une ref pour throttling
  const lastMarkAsReadRef = useRef<string | null>(null);

  // Handler de scroll pour charger plus de messages et tracker la position
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Détecter si l'utilisateur scrolle vers le haut (scroll manuel)
    if (scrollTop < scrollHeight - clientHeight - 100) {
      userScrolledRef.current = true;
    }
    
    // Tracker si l'utilisateur est en bas (avec une marge de 50px)
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
    isAtBottomRef.current = isAtBottom;
    
    // Si on scroll vers le bas et qu'on atteint le bas, désactiver le flag de scroll manuel
    if (isAtBottom) {
      userScrolledRef.current = false;
    }
    
    // Si on scroll vers le bas, masquer la notification de nouveaux messages
    if (isAtBottom && hasUnreadMessages) {
      setHasUnreadMessages(false);
      setUnreadMessageCount(0);
    }
    
    // Si l'utilisateur arrive en bas, marquer les messages comme lus (avec throttling)
    if (isAtBottom && activeGroupId && lastMarkAsReadRef.current !== activeGroupId) {
      // Utiliser setTimeout pour éviter setState pendant le rendu
      setTimeout(() => {
        markGroupAsRead(activeGroupId);
      }, 0);
      lastMarkAsReadRef.current = activeGroupId;
      
      // Réinitialiser après un délai pour permettre de futures mises à jour
      setTimeout(() => {
        lastMarkAsReadRef.current = null;
      }, 1000);
    }
    
    // VERIFICATION CRITIQUE : Ne rien faire si on ne peut plus charger
    if (activeGroupId && !canLoadMoreMessages(activeGroupId)) {
      return; // Arrêt total - ne pas charger
    }
    
    // Si on arrive en haut ET qu'on peut charger, charger plus de messages
    const triggerZone = 50;
    if (scrollTop < triggerZone && activeGroupId) {
      // Vérifier qu'on n'est pas déjà en train de charger
      if (!isLoadingMessages(activeGroupId)) {
        // Sauvegarder la position actuelle avant le chargement
        const currentScrollHeight = scrollHeight;
        
        loadMoreMessages(activeGroupId)
          .then(() => {
            // ✅ Ajuster la position après le chargement de pagination (nécessaire pour UX)
            setTimeout(() => {
              if (messagesContainerRef.current) {
                const newScrollHeight = messagesContainerRef.current.scrollHeight;
                const heightDifference = newScrollHeight - currentScrollHeight;
                messagesContainerRef.current.scrollTop = scrollTop + heightDifference;
              }
            }, 100);
          });
      }
    }
  };

  // Fermer les modales en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Fermer les modals principaux
      if (modalRef.current && !modalRef.current.contains(target)) {
        setShowCreateGroup(false);
        setShowGroupSettings(false);
        setShowNewChat(false);
        setShowAddMemberModal(false);
        setConnectionSearchQuery('');
      }
      
      // Fermer le picker d'emojis (en bas)
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(target) && showEmojiPicker) {
        // Vérifier que ce n'est pas le bouton emoji qui a été cliqué
        const emojiButton = (target as HTMLElement)?.closest('[data-emoji-button="true"]');
        if (!emojiButton) {
          setShowEmojiPicker(false);
        }
      }
      
      // Fermer le menu de réaction (3 petits points)
      if (messageMenuOpen && !(target as HTMLElement)?.closest?.('[data-emoji-menu="true"]')) {
        // Vérifier que ce n'est pas un bouton de menu qui a été cliqué
        const menuButton = (target as HTMLElement)?.closest('[data-menu-trigger="true"]');
        if (!menuButton) {
          setMessageMenuOpen(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, messageMenuOpen]);

  // Le handleNewMessage pour la réactivation automatique est géré dans MessagingContext_new.tsx
  // Plus besoin de le dupliquer ici

  // Effet pour détecter les nouvelles conversations créées et les ouvrir automatiquement (désactivé)

  // Mémo des derniers messages par groupe (si nécessaire ailleurs)
  const computedLastMessages = useMemo(() => lastMessages || {}, [lastMessages]);

  // Messages du groupe actif
  const groupMessages = useMemo(() => {
    if (!activeGroupId || !messages) return [] as any[];
    return messages
      .filter(m => m.groupId === activeGroupId)
      .sort((a, b) => {
        try {
          const dateA = a?.createdAt ? new Date(a.createdAt) : null;
          const dateB = b?.createdAt ? new Date(b.createdAt) : null;
          if (!dateA && !dateB) return 0;
          if (!dateA || isNaN(dateA.getTime())) return 1;
          if (!dateB || isNaN(dateB.getTime())) return -1;
          return dateA.getTime() - dateB.getTime();
        } catch (error) {
          console.warn('Error sorting messages:', error);
          return 0;
        }
      });
  }, [messages, activeGroupId]);

  const getLastMessage = (chatId: string) => computedLastMessages[chatId] || null;

  // Effet pour traiter le targetUserId quand le composant se charge
  useEffect(() => {
    console.log('📨 MessagingPage useEffect - targetUserId:', targetUserId, 'user:', !!user);
    if (targetUserId && user) {
      console.log('🎯 Préparation de conversation avec:', targetUserId);
      
      // Au lieu d'essayer de créer immédiatement, on prépare juste l'interface
      // La conversation sera créée au premier message
      handleCreatePrivateChat(targetUserId).catch((error) => {
        console.log('ℹ️ Information:', error.message || 'Conversation sera créée au premier message');
        // Ne pas afficher d'erreur, c'est normal
      });
    }
  }, [targetUserId, user]); // Se déclenche quand targetUserId change ou quand l'utilisateur se connecte

  // Helper functions for private chat display
  const getOtherParticipant = (chat: any) => {
    if (chat.isPrivate && chat.members && chat.members.length === 2) {
      return chat.members.find((member: any) => member.id !== user?.id);
    }
    return null;
  };

  const getChatDisplayName = (chat: any) => {
    if (chat.isPrivate) {
      const otherParticipant = getOtherParticipant(chat);
      
      if (otherParticipant) {
        const displayName = `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() || otherParticipant.username || 'Utilisateur';
        return displayName;
      }
      return 'Chat privé';
    }
    return chat.name;
  };

  const getChatProfilePicture = (chat: any) => {
    if (!chat) return undefined;
    
    const refreshKey = imageRefreshKey[chat.id] || 0;
    
    if (chat.isPrivate) {
      const otherParticipant = getOtherParticipant(chat);
      const profilePic = otherParticipant?.profilePicture;
      if (!profilePic) return undefined;
      // Ne pas ajouter de cache-buster aux data URLs (elles deviennent invalides)
      if (typeof profilePic === 'string' && profilePic.startsWith('data:')) {
        return profilePic;
      }
      return `${profilePic}${profilePic.includes('?') ? '&' : '?'}t=${Date.now()}&r=${refreshKey}`;
    }
    
    const profilePic = chat.profilePicture;
    if (!profilePic) return undefined;
    // Ne pas ajouter de cache-buster aux data URLs (elles deviennent invalides)
    if (typeof profilePic === 'string' && profilePic.startsWith('data:')) {
      return profilePic;
    }
    return `${profilePic}${profilePic.includes('?') ? '&' : '?'}t=${Date.now()}&r=${refreshKey}`;
  };

  if (!user) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Connectez-vous</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Vous devez être connecté pour accéder à la messagerie.
          </p>
        </div>
      </div>
    );
  }

  // Fonction utilitaire pour obtenir le statut d'un membre
  const getMemberStatus = (memberId: string, group: any) => {
    if (memberId === group.adminId) {
      return { status: 'Administrateur', badge: '👑', color: 'yellow' };
    } else if (isUserModerator(memberId, group)) {
      return { status: 'Modérateur', badge: '🛡️', color: 'blue' };
    } else {
      return { status: 'Membre', badge: '👤', color: 'gray' };
    }
  };

  // Utiliser les groupes visibles (non masqués) avec tri optimisé et filtrage des conversations vides
  const allChats = useMemo(() => {
    return getVisibleGroups()
      .filter(group => {
        const lastMessage = computedLastMessages[group.id];
        
        // Si la conversation a des messages, la garder
        if (lastMessage) return true;
        
        // Si c'est la conversation actuellement active, la garder même si elle est vide
        if (activeGroupId && group.id === activeGroupId) return true;
        
        // Pour les autres conversations vides, ne les garder que si elles sont très récentes (moins de 5 minutes)
        const isVeryRecent = group.createdAt && new Date(group.createdAt) > new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
        return isVeryRecent;
      })
      .sort((a, b) => {
      const aLastMessage = computedLastMessages[a.id];
      const bLastMessage = computedLastMessages[b.id];
      
      if (!aLastMessage && !bLastMessage) return 0;
      if (!aLastMessage) return 1;
      if (!bLastMessage) return -1;
      
      try {
        const dateA = aLastMessage.createdAt ? new Date(aLastMessage.createdAt) : null;
        const dateB = bLastMessage.createdAt ? new Date(bLastMessage.createdAt) : null;
        if (!dateA && !dateB) return 0;
        if (!dateA || isNaN(dateA.getTime())) return 1;
        if (!dateB || isNaN(dateB.getTime())) return -1;
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        console.warn('Error sorting chats:', error);
        return 0;
      }
    });
  }, [getVisibleGroups, computedLastMessages]);

  const filteredChats = useMemo(() => {
    if (!allChats || !Array.isArray(allChats)) return [];
    return allChats.filter(chat => 
      chat && chat.name && chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat && chat.description && chat.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allChats, searchQuery]);

  // Helper pour vérifier si un utilisateur est modérateur - version stable avec memoization
  const isUserModerator = React.useMemo(() => {
    return (userId: string, chat: any) => {
      if (!chat) return false;
      
      // Utiliser d'abord _moderatorIds (IDs purs) si disponible
      if (chat._moderatorIds && Array.isArray(chat._moderatorIds)) {
        return chat._moderatorIds.includes(userId);
      }
      
      // Sinon utiliser moderatorIds avec logique robuste
      if (!chat.moderatorIds || !Array.isArray(chat.moderatorIds)) return false;
      
      // Vérifier si c'est un array d'objets ou de strings
      const firstMod = chat.moderatorIds[0];
      if (typeof firstMod === 'string') {
        return chat.moderatorIds.includes(userId);
      } else if (firstMod && typeof firstMod === 'object' && firstMod._id) {
        return chat.moderatorIds.some((mod: any) => mod._id === userId);
      }
      
      return false;
    };
  }, []);

  const activeChat = allChats.find(c => c.id === activeGroupId);

  // Effet pour aller en bas après chargement initial des messages - RÉACTIVÉ pour l'ouverture
  useEffect(() => {
  if (activeGroupId && groupMessages.length > 0 && hasInitializedScrollRef.current !== activeGroupId) {
      // Marquer qu'on a déjà fait le positionnement initial pour ce groupe
      hasInitializedScrollRef.current = activeGroupId;
      
      // ✅ Autoriser ce scroll car c'est l'ouverture initiale d'une conversation
      setTimeout(() => {
    if (messagesContainerRef.current) {
          allowAutoScrollRef.current = true; // Autoriser ce scroll initial
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' }); // Scroll instantané pour l'ouverture
          }
          isAtBottomRef.current = true;
        }
      }, 100);
    }
    
    // FORCER l'arrêt du loading si on ne peut plus charger de messages
    if (activeGroupId && !canLoadMoreMessages(activeGroupId)) {
      isLoadingRef.current = false;
    }
    
    // Si on change de groupe, reset complet
  }, [activeGroupId, groupMessages.length, canLoadMoreMessages]);

  // État pour la notification de nouveaux messages
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const lastMessageCountRef = useRef(0);
  const userScrolledRef = useRef(false); // Nouveau : pour savoir si l'utilisateur a scrollé manuellement

  // Réinitialiser le compteur de messages non lus quand on change de groupe
  useEffect(() => {
    setHasUnreadMessages(false);
    setUnreadMessageCount(0);
    userScrolledRef.current = false;
    lastMessageCountRef.current = 0;
    hasInitializedScrollRef.current = null; // Reset pour permettre le scroll initial du nouveau groupe
  }, [activeGroupId]);

  // Effet pour scroll automatique vers le bas sur nouveaux messages
  useEffect(() => {
    if (activeGroupId && groupMessages.length > 0) {
      const currentMessageCount = groupMessages.length;
      const previousCount = lastMessageCountRef.current;
      
      // Si c'est un nouveau message (pas le chargement initial)
      if (previousCount > 0 && currentMessageCount > previousCount) {
        const newMessages = groupMessages.slice(previousCount);
        
        // Vérifier si ce sont de VRAIS nouveaux messages (créés récemment) ou du chargement de pagination
        const now = new Date().getTime();
        const recentMessages = newMessages.filter(msg => {
          if (!msg.createdAt) return false;
          const messageDate = new Date(msg.createdAt);
          if (isNaN(messageDate.getTime())) return false;
          const messageTime = messageDate.getTime();
          return now - messageTime < 10000; // Messages créés dans les 10 dernières secondes
        });
        
        // DÉSACTIVÉ : Plus de scroll automatique même pour ses propres messages
        // L'utilisateur contrôle complètement sa position de scroll
        if (false) { // Désactivé complètement
          // Si c'est notre propre message ET qu'on est déjà en bas, scroll automatiquement
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
              isAtBottomRef.current = true;
            }
          }, 100);
        }
        
        // Garder seulement la notification pour les messages des autres
        if (!isAtBottomRef.current && recentMessages.length > 0) {
          // Si on n'est pas en bas et qu'il y a des messages récents, afficher la notification
          const recentOthersMessages = recentMessages.filter(msg => msg.authorId !== user?.id);
          if (recentOthersMessages.length > 0) {
            setHasUnreadMessages(true);
            setUnreadMessageCount(prev => prev + recentOthersMessages.length);
          }
        }
      }
      
      lastMessageCountRef.current = currentMessageCount;
    }
  }, [activeGroupId, groupMessages.length, user?.id]); // Ajouter user?.id aux dépendances

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Empêcher l'envoi si les suggestions de mentions sont ouvertes
    if (showMentionSuggestions) {
      return;
    }
    
    if (messageInput.trim() && activeGroupId) {
      // Si on répond à un message, créer un message avec référence
      if (replyingToMessage) {
        sendMessage(activeGroupId, messageInput.trim(), replyingToMessage.id);
        setReplyingToMessage(null);
      } else {
        sendMessage(activeGroupId, messageInput.trim());
      }
      setMessageInput('');
      
      // Marquer le groupe comme lu après avoir envoyé un message
      setTimeout(() => markGroupAsRead(activeGroupId), 100);
      
      // DÉSACTIVÉ : Plus de scroll automatique même quand on envoie un message
      // L'utilisateur reste à sa position actuelle
      if (false) { // Désactivé
        isAtBottomRef.current = true;
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  };

  const handleReplyToMessage = (message: any) => {
    setReplyingToMessage(message);
    setMessageMenuOpen(null);
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    const newList = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 32);
    setRecentEmojis(newList);
    try {
      usersAPI.updateRecentEmojis(newList)
        .then(async () => {
          // Après update, re-fetch pour garantir la synchro
          const resp = await usersAPI.getRecentEmojis();
          if (resp?.success && Array.isArray(resp.recentEmojis)) {
            setRecentEmojis(resp.recentEmojis.slice(0, 32));
          }
        })
        .catch(() => { });
    } catch(_) { }
    // Si après clic on n'avait rien et user est défini, tenter un fetch forcé après 500ms pour vérifier stockage
  // Suppression du refetch forcé inutile : le useEffect charge toujours les emojis du serveur
  };

  // Fonction pour parser et styliser les mentions dans un message
  const renderMessageWithMentions = (content: string, isOwnMessage: boolean = false) => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedUsername = match[1];
      const isCurrentUserMention = mentionedUsername === user?.username;
      
      // Ajouter le texte avant la mention
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      
      // Ajouter la mention stylisée
      parts.push(
        <span
          key={`mention-${match.index}`}
          className={`font-semibold ${
            isCurrentUserMention 
              ? (isOwnMessage ? 'text-blue-200' : 'text-blue-600')
              : (isOwnMessage ? 'text-white text-opacity-90' : 'text-gray-600')
          }`}
        >
          @{mentionedUsername}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Ajouter le texte restant après la dernière mention
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : content;
  };

  // Fonction pour vérifier si l'utilisateur actuel est mentionné dans un message
  const isUserMentionedInMessage = (content: string): boolean => {
    if (!user?.username) return false;
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      if (match[1] === user.username) {
        return true;
      }
    }
    return false;
  };

  // Fonctions de gestion des mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    setMessageInput(value);
    
    // Chercher le dernier @ avant la position du curseur
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Vérifier que le @ n'est pas précédé d'un caractère alphanumerique (pour éviter les emails)
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      const isValidMention = /[\s\n]/.test(charBeforeAt) || lastAtIndex === 0;
      
      if (isValidMention) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        // Vérifier que la query ne contient pas d'espaces (fin de mention)
        if (!query.includes(' ') && !query.includes('\n')) {
          setMentionQuery(query.toLowerCase());
          setMentionStartIndex(lastAtIndex);
          
          // Filtrer les membres du groupe actuel
          if (activeChat && !activeChat.isPrivate) {
            const filteredMembers = activeChat.members.filter((member: any) => 
              member.username.toLowerCase().includes(query.toLowerCase()) && 
              member.id !== user?.id // Ne pas se mentionner soi-même
            );
            setMentionSuggestions(filteredMembers);
            setShowMentionSuggestions(filteredMembers.length > 0);
            setSelectedMentionIndex(0);
          }
          return;
        }
      }
    }
    
    // Fermer les suggestions si pas de mention valide
    setShowMentionSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionSuggestions && mentionSuggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedMentionIndex((prev) => 
            prev < mentionSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedMentionIndex((prev) => 
            prev > 0 ? prev - 1 : mentionSuggestions.length - 1
          );
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          insertMention(mentionSuggestions[selectedMentionIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          setShowMentionSuggestions(false);
          break;
      }
    }
  };

  const insertMention = (member: any) => {
    if (mentionStartIndex === -1) return;
    
    const beforeMention = messageInput.substring(0, mentionStartIndex);
    const afterMention = messageInput.substring(mentionStartIndex + mentionQuery.length + 1);
    const newMessage = `${beforeMention}@${member.username} ${afterMention}`;
    
    setMessageInput(newMessage);
    setShowMentionSuggestions(false);
    
    // Remettre le focus et la position du curseur après la mention
    setTimeout(() => {
      if (inputRef.current) {
        const newPosition = beforeMention.length + member.username.length + 2;
        inputRef.current.setSelectionRange(newPosition, newPosition);
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      createGroup(newGroupName.trim(), newGroupDescription.trim());
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateGroup(false);
      setShowSuccessMessage('Groupe créé avec succès !');
    }
  };

  // Fonction pour aller aux nouveaux messages
  const scrollToNewMessages = () => {
    if (messagesEndRef.current) {
      userScrolledRef.current = false; // Reset le flag car l'utilisateur veut aller en bas
      allowAutoScrollRef.current = true; // ✅ Autoriser ce scroll car c'est volontaire
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setHasUnreadMessages(false);
      setUnreadMessageCount(0);
    }
  };

  const handleCreatePrivateChat = async (userId: string) => {
    if (!userId) {
      setShowErrorMessage('ID utilisateur manquant');
      return;
    }
    
    console.log('🔧 handleCreatePrivateChat appelé avec userId:', userId);
    
    try {
      // Vérifier d'abord s'il existe déjà une conversation privée avec cet utilisateur
      console.log('🔍 Recherche de conversation existante...');
      // Chercher dans TOUS les groupes (pas seulement les visibles) pour éviter les doublons
      const allGroups = groups; // Utiliser tous les groupes au lieu de getVisibleGroups()
      const existingPrivateChat = allGroups.find(group => 
        group.isPrivate && 
        group.members.length === 2 && 
        group.members.some(member => member.id === userId)
      );
      
      if (existingPrivateChat) {
        console.log('✅ Conversation existante trouvée:', existingPrivateChat.id);
        // Conversation existante trouvée, l'ouvrir (même si elle était vide/cachée)
        setActiveGroupId(existingPrivateChat.id);
        
        // Charger les messages (même s'il n'y en a pas)
        await loadMessages(existingPrivateChat.id);
        
        setShowNewChat(false);
        return;
      }
      
      console.log('🆕 Aucune conversation existante trouvée');
      console.log('🔍 Vérification de l\'utilisateur cible...');
      
      // Solution de contournement : au lieu de créer un groupe, 
      // ouvrir la page de messagerie et afficher un message d'information
      console.log('💡 Conversation privée sera créée au premier message');
      
      // Pour l'instant, simuler une "conversation" en attente
      setShowNewChat(false);
      setShowSuccessMessage('Prêt à envoyer un message privé ! Tapez votre message ci-dessous.');
      
      // Optionnel : on pourrait définir un état spécial pour les nouvelles conversations
      // setActiveGroupId('pending-' + userId);
      
    } catch (error: any) {
      console.error('❌ Erreur dans handleCreatePrivateChat:', error);
      setShowErrorMessage(`Erreur lors de la préparation de la conversation: ${error.message || 'Erreur inconnue'}`);
      setShowNewChat(false);
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
    setMessageMenuOpen(null);
  };

  const handleSaveEdit = () => {
    if (editingMessageId && editingContent.trim()) {
      updateMessage(editingMessageId, editingContent.trim());
      setEditingMessageId(null);
      setEditingContent('');
      setShowSuccessMessage('Message modifié avec succès !');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleDeleteMessage = (messageId: string) => {    setShowDeleteConfirm(messageId);
    setMessageMenuOpen(null);
  };

  const confirmDeleteMessage = () => {    if (showDeleteConfirm) {      deleteMessage(showDeleteConfirm);
      setShowDeleteConfirm(null);
      setShowSuccessMessage('Message supprimé avec succès !');
    } else {    }
  };

  const handleViewPost = (postId: string) => {
    if (onViewPost) {
      onViewPost(postId);
    } else {
      // Fallback: ouvrir dans un nouvel onglet
      window.open(`/post/${postId}`, '_blank');
    }
  };

  const handleViewUserProfile = (userId: string) => {
    if (onViewUserProfile) {
      onViewUserProfile(userId);
    }
  };

  const handleLeaveGroup = (chatId: string) => {
    const chat = allChats.find(c => c.id === chatId);
    if (chat?.isPrivate) {
      setShowDeleteHistoryConfirm(chatId);
    } else {
      setShowLeaveConfirm(chatId);
    }
  };

  const confirmLeaveGroup = async () => {
    if (showLeaveConfirm) {
      try {
        await leaveGroup(showLeaveConfirm);
        setShowLeaveConfirm(null);
        setShowSuccessMessage('Vous avez quitté le groupe avec succès !');
        
        // Si c'était la conversation active, la désélectionner
        if (activeGroupId === showLeaveConfirm) {
          setActiveGroupId(null);
          // Plus besoin de stopMessagePolling car la gestion est automatique
        }
      } catch (error: any) {
        setShowLeaveConfirm(null);
        // Afficher l'erreur spécifique du backend
        const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la sortie du groupe';
        setShowErrorMessage(errorMessage);
      }
    }
  };

  const confirmDeleteHistory = async () => {
    if (showDeleteHistoryConfirm) {
      try {
        await deleteHistory(showDeleteHistoryConfirm);
        setShowSuccessMessage('Historique de conversation supprimé pour vous !');
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'historique:', error);
        // On peut afficher un message d'erreur à l'utilisateur si besoin
      } finally {
        // Toujours fermer le modal, même en cas d'erreur
        setShowDeleteHistoryConfirm(null);
      }
      
      // NE PAS fermer la conversation - l'utilisateur doit rester dedans
      // mais ne plus voir les anciens messages
    }
  };

  const confirmDeleteGroup = async () => {
    if (showDeleteGroupConfirm) {
      await deleteGroup(showDeleteGroupConfirm);
      setShowDeleteGroupConfirm(null);
      setShowSuccessMessage('Groupe supprimé avec succès !');
      
      // Si c'était la conversation active, la désélectionner
      if (activeGroupId === showDeleteGroupConfirm) {
        setActiveGroupId(null);
        // Plus besoin de stopMessagePolling car la gestion est automatique
      }
    }
  };

  const handleAddMembers = () => {
    setShowAddMemberModal(true);
    setShowGroupSettings(false);
  };

  const handleAddSelectedMembers = async () => {
    if (!activeGroupId || selectedMembers.length === 0) return;

    try {
      for (const userId of selectedMembers) {
        await addMemberToGroup(activeGroupId, userId);
      }
      setSelectedMembers([]);
      setShowAddMemberModal(false);
      setShowSuccessMessage(`${selectedMembers.length} membre${selectedMembers.length > 1 ? 's' : ''} ajouté${selectedMembers.length > 1 ? 's' : ''} au groupe !`);
    } catch (error) {      setShowErrorMessage('Erreur lors de l\'ajout des membres');
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const formatTime = (date: Date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Si c'est aujourd'hui, afficher seulement l'heure
    if (messageDate.toDateString() === now.toDateString()) {
      return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(messageDate);
    }
    
    // Si c'est hier, afficher "Hier"
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }
    
    // Si c'est dans la semaine, afficher le jour
    const daysDiff = Math.floor((now.getTime() - messageDate.getTime()) / (24 * 60 * 60 * 1000));
    if (daysDiff < 7) {
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
      }).format(messageDate);
    }
    
    // Sinon, afficher la date complète
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
    }).format(messageDate);
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // FONCTION: scroll + highlight d'un message cible (pour les réponses)
  const scrollAndHighlightMessage = useCallback((targetId: string | undefined) => {
    if (!targetId) return;
    const anchor = document.querySelector<HTMLElement>(`[data-message-id="${targetId}"]`);
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
      anchor.classList.add('reply-highlight');
      // Retirer l'effet après 2s
      setTimeout(() => anchor.classList.remove('reply-highlight'), 2000);
    }
  }, []);

  const renderMessageContent = useCallback((message: any) => {
    // Si le message est supprimé, afficher la raison appropriée
    if (message.isDeleted) {
      const displayText = message.deletionReason || 'Message supprimé';
      const isModeratedDeletion = displayText.includes('administrateur') || displayText.includes('modérateur');
      
      return (
        <div 
          className={`rounded-2xl px-4 py-3 italic cursor-not-allowed border-l-4 ${
            isModeratedDeletion 
              ? 'bg-red-50 text-red-600 border-red-400' 
              : 'bg-gray-100 text-gray-500 border-gray-300'
          }`}
          title={`Supprimé le ${message.deletedAt ? new Date(message.deletedAt).toLocaleString() : ''}`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{isModeratedDeletion ? '🛡️' : '🗑️'}</span>
            <p className="text-base leading-relaxed">{displayText}</p>
          </div>
        </div>
      );
    }

    // Si c'est un dossier partagé
    if (message.sharedFolder) {
      return (
        <div className="relative group">
          <div className="w-full text-left bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-2">
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="p-2 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${message.sharedFolder.color}20`, color: message.sharedFolder.color }}
              >
                <Folder className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    Dossier partagé
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{message.sharedFolder.name}</h4>
                {message.sharedFolder.description && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-2">
                    {truncateContent(message.sharedFolder.description, 100)}
                  </p>
                )}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-3 w-3" />
                    <span>{message.sharedFolder.itemsCount} élément{message.sharedFolder.itemsCount > 1 ? 's' : ''}</span>
                  </div>
                  <span>Par {message.sharedFolder.author.username}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  // TODO: Naviguer vers le dossier
                  window.open(`/folder/${message.sharedFolder.id}`, '_blank');
                }}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Voir le dossier</span>
              </button>
            </div>
          </div>
          
          {/* Bouton supprimer pour les dossiers partagés par l'utilisateur */}
          {message.authorId === user.id && (
            <button
              onClick={() => handleDeleteMessage(message.id)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              title="Supprimer le partage"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    }

    // Si c'est un post partagé
    if (message.sharedPost) {
      const post = posts.find(p => p.id === message.sharedPost.id || p._id === message.sharedPost.id);
      if (!post) return <p className="text-gray-500 italic">Post supprimé</p>;

      return (
        <div className="relative group">
          <button
            onClick={() => handleViewPost(post.id)}
            className="w-full text-left bg-gray-100 border border-gray-300 rounded-lg p-3 mt-2 hover:bg-gray-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Post partagé
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">{post.title}</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              {truncateContent(post.content, 150)}
            </p>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Par {post.author.username}</span>
              <span>{post.likes} likes • {post.comments.length} commentaires</span>
            </div>
          </button>
          
          {/* Bouton supprimer pour les posts partagés par l'utilisateur */}
          {message.authorId === user.id && (
            <button
              onClick={() => handleDeleteMessage(message.id)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              title="Supprimer le partage"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    }

    const content = message.content;
    const isUserMentioned = isUserMentionedInMessage(content);
    const isOwnMessage = message.authorId === user?.id;
    const renderedContent = renderMessageWithMentions(content, isOwnMessage);
    
    if (message.replyTo) {
      return (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => scrollAndHighlightMessage(message.replyTo?.id)}
            className="ml-4 border-l-2 border-blue-300 pl-3 text-left group focus:outline-none"
          >
            <div className="text-xs text-gray-500 mb-1 flex items-center">
              <Reply className="h-3 w-3 inline mr-1 text-blue-500" />
              <span className="group-hover:underline">Réponse à {message.replyTo.author?.username || 'message'}</span>
            </div>
            <div className="bg-blue-50 text-gray-700 text-xs p-2 rounded-lg max-w-xs line-clamp-2">
              {message.replyTo.content || 'Message indisponible'}
            </div>
          </button>
          <div
            className={`${message.authorId === user.id ? 'bg-blue-500 text-white' : `bg-gray-200 text-gray-900 ${isUserMentioned ? 'ring-2 ring-blue-300 bg-blue-50' : ''}`} rounded-2xl ${message.authorId === user.id ? 'rounded-br-md' : 'rounded-bl-md'} px-4 py-3 cursor-pointer`}
            onDoubleClick={async () => { try { await addReaction(message.id, '❤️'); } catch (_) {} }}
            title="Double-cliquez pour ajouter un cœur"
          >
            <p className="text-base leading-relaxed">{renderedContent}</p>
          </div>
        </div>
      );
    }
    return (
      <div
        className={`${message.authorId === user.id ? 'bg-blue-500 text-white' : `bg-gray-200 text-gray-900 ${isUserMentioned ? 'ring-2 ring-blue-300 bg-blue-50' : ''}`} rounded-2xl ${message.authorId === user.id ? 'rounded-br-md' : 'rounded-bl-md'} px-4 py-3 cursor-pointer`}
        onDoubleClick={async () => { try { await addReaction(message.id, '❤️'); } catch (_) {} }}
        title="Double-cliquez pour ajouter un cœur"
      >
        <p className="text-base leading-relaxed">{renderedContent}</p>
      </div>
    );
  }, [addReaction, user?.id]);

  // Récupérer les connexions de l'utilisateur pour les chats privés
  const myConnections = getConnections(user.id);
  // Liste stricte recalculée à l'ouverture du modal pour éviter les incohérences locales
  const [strictConnections, setStrictConnections] = useState<UserType[] | null>(null);
  const [loadingStrictConnections, setLoadingStrictConnections] = useState(false);

  const refreshStrictConnections = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoadingStrictConnections(true);
      const [followersResp, followingResp] = await Promise.all([
        subscriptionsAPI.getUserFollowers(user.id),
        subscriptionsAPI.getUserFollowing(user.id)
      ]);
  const followersList: any[] = followersResp.data || followersResp.users || followersResp || [];
  const followingList: any[] = followingResp.data || followingResp.users || followingResp || [];
      // Intersection sur id || _id
      const followerIds = new Set(followersList.map(u => u.id || u._id));
      const mutual = followingList.filter(u => followerIds.has(u.id || u._id));
      setStrictConnections(mutual);
    } catch (_) {
      // En cas d'erreur, fallback aux connexions locales
      setStrictConnections(null);
    } finally {
      setLoadingStrictConnections(false);
    }
  }, [user?.id]);

  // Quand on ouvre le modal, forcer un recalcul depuis l'API
  useEffect(() => {
    if (showNewChat) {
      refreshStrictConnections();
    }
  }, [showNewChat, refreshStrictConnections]);

  // Récupérer les utilisateurs disponibles pour ajouter au groupe
  const availableUsers = activeGroupId ? getAvailableUsersForGroup(activeGroupId) : [];

  return (
    <div className="w-full">
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 h-[85vh] max-w-7xl mx-auto overflow-hidden">
        
        {/* Sidebar - Liste des chats (masquée sur mobile si un chat est actif) */}
        <div className={`${
          activeGroupId ? 'hidden lg:flex' : 'flex'
        } w-full lg:w-80 bg-gray-50 border-r border-gray-200 flex-col overflow-hidden`}>
            {/* Header fixe */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Messages</h2>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Créer un groupe"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      const baseList = strictConnections ?? myConnections;
                      if (baseList.length === 0) {
                        setShowErrorMessage('Aucune connexion mutuelle – ajoutez des connexions pour envoyer un message privé.');
                        return;
                      }
                      setShowNewChat(true);
                    }}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${(strictConnections ?? myConnections).length === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                    title={(strictConnections ?? myConnections).length === 0 ? 'Aucune connexion mutuelle disponible' : 'Envoyer un message'}
                    disabled={(strictConnections ?? myConnections).length === 0}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Liste des chats */}
          <div className="flex-1 overflow-hidden">
            {filteredChats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Aucune conversation trouvée</p>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="block w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Créer un groupe
                  </button>
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="block w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Envoyer un message
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto scrollbar-hide">
                <div className="p-2 space-y-1">
                  {filteredChats.map((chat) => {
                    const isActive = activeGroupId === chat.id;
                    const unreadCount = getUnreadMessagesCount(chat.id);
                    const notificationsEnabled = chat.notificationsEnabled?.[user.id] !== false;
                    const lastMessage = getLastMessage(chat.id);
                    // TODO: Ajouter la gestion des membres bloqués si nécessaire
                    
                    return (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isActive={isActive}
                        unreadCount={unreadCount}
                        notificationsEnabled={notificationsEnabled}
                        lastMessage={lastMessage}
                        onChatClick={() => setActiveGroupId(chat.id)}
                        onLeaveGroup={handleLeaveGroup}
                        onViewUserProfile={handleViewUserProfile}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone de chat principale */}
        <div className={`${
          activeGroupId ? 'flex' : 'hidden lg:flex'
        } flex-1 flex-col max-w-full overflow-hidden min-h-0`}>
          {activeChat ? (
            <>
              {/* Header du chat */}
              <div className="p-3 sm:p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Bouton retour - visible seulement sur mobile/tablette */}
                    <button
                      onClick={() => setActiveGroupId(null)}
                      className="lg:hidden p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Retour à la liste"
                    >
                      <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    {activeChat.isPrivate ? (
                      <button
                        onClick={() => {
                          const otherParticipant = getOtherParticipant(activeChat);
                          if (otherParticipant && handleViewUserProfile) {
                            handleViewUserProfile(otherParticipant.id);
                          }
                        }}
                        className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                        title="Voir le profil"
                      >
                        {getChatProfilePicture(activeChat) ? (
                          <img 
                            src={getChatProfilePicture(activeChat)} 
                            alt={getChatDisplayName(activeChat)}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover object-center"
                          />
                        ) : (
                          <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        )}
                      </button>
                    ) : (
                      <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                        {activeChat.profilePicture ? (
                          <img 
                            key={`group-pic-header-${activeChat.id}-${imageRefreshKey[activeChat.id] || 0}`}
                            src={getChatProfilePicture(activeChat)} 
                            alt={activeChat.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover object-center"
                          />
                        ) : (
                          <span className="font-semibold text-blue-600 text-xs sm:text-base">
                            {activeChat.name[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="min-w-0 flex-1">
                      {activeChat.isPrivate ? (
                        <button
                          onClick={() => {
                            const otherParticipant = getOtherParticipant(activeChat);
                            if (otherParticipant && handleViewUserProfile) {
                              handleViewUserProfile(otherParticipant.id);
                            }
                          }}
                          className="font-semibold text-sm sm:text-base text-gray-900 hover:text-blue-600 transition-colors truncate block text-left"
                          title="Voir le profil"
                        >
                          {getChatDisplayName(activeChat)}
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowGroupSettings(true)}
                          className="font-semibold text-sm sm:text-base text-gray-900 hover:text-blue-600 transition-colors truncate block text-left"
                        >
                          {getChatDisplayName(activeChat)}
                        </button>
                      )}
                      {!activeChat.isPrivate && (
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {`${activeChat.members.length} membre${activeChat.members.length > 1 ? 's' : ''}`}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Bouton de notification pour les conversations privées */}
                  {activeChat.isPrivate && (
                    <button
                      onClick={() => toggleGroupNotifications(activeChat.id, activeChat.notificationsEnabled?.[user.id] === false)}
                      className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                        activeChat.notificationsEnabled?.[user.id] !== false
                          ? 'text-gray-600 hover:bg-gray-100'
                          : 'text-red-500 hover:bg-red-50'
                      }`}
                      title={
                        activeChat.notificationsEnabled?.[user.id] !== false
                          ? 'Désactiver les notifications'
                          : 'Activer les notifications'
                      }
                    >
                      {activeChat.notificationsEnabled?.[user.id] !== false ? (
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <BellOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  )}
                </div>
                
                {/* Avertissement membres bloqués */}
                {getBlockedMembersInGroup(activeChat.id).length > 0 && (
                  <div className="mt-3 p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-orange-800">
                      <strong>Membres bloqués dans ce groupe :</strong> {getBlockedMembersInGroup(activeChat.id).map(m => m.username).join(', ')}. 
                      Vous ne verrez pas leurs messages et ils ne verront pas les vôtres.
                    </p>
                  </div>
                )}
              </div>

              {/* Messages (wrapper flex pour que seul le contenu scrolle) */}
              <div className="relative flex flex-col flex-1 min-h-0">
                {/* Notification de nouveaux messages */}
                {hasUnreadMessages && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-blue-500 text-white text-sm px-4 py-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-600 transition-colors"
                         onClick={scrollToNewMessages}>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        </svg>
                        <span>
                          {unreadMessageCount === 1 ? 'Nouveau message' : `${unreadMessageCount} nouveaux messages`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div 
                  ref={messagesContainerRef}
                  className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0"
                  onScroll={handleScroll}
                >
                {/* Indicateur de chargement en haut - CORRIGÉ */}
                {activeGroupId && isLoadingMessages(activeGroupId) && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                )}

                {/* Message de début de conversation - CORRIGÉ : seulement si on a VRAIMENT atteint le début */}
                {(() => {
                  if (!activeGroupId) return null;
                  
                  const hasMessages = groupMessages.length > 0;
                  const canLoadMore = canLoadMoreMessages(activeGroupId);
                  const isLoading = isLoadingMessages(activeGroupId);
                  
                  // CORRIGÉ: Logique différente pour conversations privées vs groupes publics
                  let shouldShowStart = false;
                  
                  if (activeChat.isPrivate) {
                    // Pour conversations privées : afficher "Début" dès qu'on ne peut plus charger
                    shouldShowStart = hasMessages && !canLoadMore && !isLoading;
                  } else {
                    // Pour groupes publics : afficher "Début" seulement si on a chargé suffisamment
                    shouldShowStart = hasMessages && !canLoadMore && !isLoading && groupMessages.length >= 15;
                  }
                  
                  return shouldShowStart ? (
                    <div className="flex justify-center py-4">
                      <div className="text-center text-gray-500">
                        <div className="w-8 h-8 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                          {activeChat.isPrivate ? (
                            <UserIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Users className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm font-medium">Début de la conversation</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {activeChat.isPrivate ? 'Vous êtes maintenant en contact' : 'Voici où tout a commencé'}
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}

                {groupMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    {activeChat.isPrivate ? (
                      <UserIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    ) : (
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    )}
                    <p>Aucun message dans ce {activeChat.isPrivate ? 'chat' : 'groupe'}</p>
                    <p className="text-sm">Soyez le premier à envoyer un message !</p>
                  </div>
                ) : (
                  <>
                    {/* Messages réels */}
                    {groupMessages.map((message, index) => {
                    const isOwnMessage = message.authorId != null && message.authorId === user.id;
                    const isEditing = editingMessageId === message.id;
                    
                    // Solution définitive : NE PAS marquer comme modifié les messages avec réactions
                    // Seuls les messages explicitement modifiés (via le bouton modifier) seront marqués
                    let isModified = false;
                    
                    // Si le message a des réactions, on considère qu'il n'est pas modifié
                    // car updatedAt a probablement été changé par les réactions
                    const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;
                    
                    if (!hasReactions && message.updatedAt && message.createdAt) {
                      // Seulement pour les messages sans réactions, vérifier s'il y a modification
                      const updatedDate = new Date(message.updatedAt);
                      const createdDate = new Date(message.createdAt);
                      if (!isNaN(updatedDate.getTime()) && !isNaN(createdDate.getTime())) {
                        const timeDiff = updatedDate.getTime() - createdDate.getTime();
                        isModified = timeDiff > 1000; // Plus d'1 seconde = modification
                      }
                    }
                    
                    // TODO: Dans le futur, on pourra ajouter un champ explicite "contentModified" 
                    // côté serveur pour une détection plus précise
                    
                    // Vérifier si c'est un message système (promotion/rétrogradation)
                    const isSystemMessage = message.isSystemMessage || false;
                    
                    // Si c'est un message système, afficher différemment
                    if (isSystemMessage) {
                      return (
                        <div key={message.id} className="mt-2 mb-2">
                          <div className="text-center">
                            <div className="inline-block bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Vérifier si c'est le même auteur que le message précédent
                    const previousMessage = groupMessages[index - 1];
                    const showAuthor = !previousMessage || previousMessage.authorId !== message.authorId;
                    
                    let showTime = showAuthor;
                    if (!showAuthor && index > 0 && message.createdAt && previousMessage.createdAt) {
                      const currentDate = new Date(message.createdAt);
                      const prevDate = new Date(previousMessage.createdAt);
                      if (!isNaN(currentDate.getTime()) && !isNaN(prevDate.getTime())) {
                        showTime = currentDate.getTime() - prevDate.getTime() > 300000; // 5 minutes
                      }
                    }
                    
                    // Plus de fallback pattern: tout passe par replyTo structuré
                    // Reply preview géré dans renderMessageContent via message.replyTo

                    return (
                      <div key={message.id} data-message-id={message.id} className={`${showAuthor ? 'mt-4' : 'mt-1'}`}>
                        {/* Timestamp */}
                        {showTime && (
                          <div className="text-center text-xs text-gray-500 mb-2">
                            {formatTime(message.createdAt)}
                          </div>
                        )}
                        
                        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                          {/* Photo de profil pour les messages des autres */}
                          {!isOwnMessage && message.author && (
                            <div className="flex-shrink-0">
                              {message.author?.profilePicture ? (
                                <button
                                  onClick={() => handleViewUserProfile(message.author?.id)}
                                  className="hover:opacity-80 transition-opacity"
                                >
                                  <img 
                                    src={message.author.profilePicture} 
                                    alt={message.author?.username || 'Utilisateur'}
                                    className="w-8 h-8 rounded-full object-cover object-center cursor-pointer"
                                  />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleViewUserProfile(message.author?.id)}
                                  className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center hover:bg-gray-500 transition-colors cursor-pointer"
                                >
                                  <span className="text-white text-sm font-medium">
                                    {message.author?.username?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                </button>
                              )}
                            </div>
                          )}
                          
                          {/* Conteneur avec message et boutons */}
                          <div className={`flex items-center space-x-2 group ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} relative`}>
                            {/* Bulle de message */}
                            <div className={`max-w-xs lg:max-w-md relative ${
                              message.sharedPost || message.sharedFolder ? '' : ''
                            }`}>
                              {/* Nom d'utilisateur pour les groupes */}
                              {!isOwnMessage && !activeChat.isPrivate && showAuthor && !message.sharedPost && !message.sharedFolder && message.author && (
                                <div className="flex items-center space-x-2 mb-1">
                                  <button
                                    onClick={() => handleViewUserProfile(message.author?.id)}
                                    className="text-xs font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                                  >
                                    {message.author?.username || 'Utilisateur inconnu'}
                                  </button>
                                </div>
                              )}
                              
                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    className="w-full p-2 text-gray-900 bg-white rounded border resize-none"
                                    rows={2}
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={handleSaveEdit}
                                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                    >
                                      Sauver
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {renderMessageContent(message)}
                                  
                                  {/* Affichage des réactions */}
                                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                                    <div className="flex flex-wrap gap-1 -mt-1 mb-1">
                                      {Object.entries(message.reactions).map(([emoji, reaction]) => {
                                        const reactionData = reaction as { users: string[]; count: number };
                                        const userHasReacted = reactionData.users.includes(user?.id || '');
                                        return (
                                          <button
                                            key={emoji}
                                            onClick={() => {
                                              // Ouvrir le modal pour afficher les détails des réactions
                                              setShowReactionModal(message.id);
                                            }}
                                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors shadow-sm ${
                                              userHasReacted 
                                                ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                            }`}
                                            style={{ fontSize: '11px' }}
                                          >
                                            <span style={{ fontSize: '12px' }}>{emoji}</span>
                                            <span>{reactionData.count}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                  
                                  {/* SOLUTION FINALE: Ne jamais afficher "modifié" pour les messages avec réactions */}
                                  {isModified && !hasReactions && (
                                    <p className={`text-xs mt-1 ${
                                      isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                    }`}>
                                      modifié
                                    </p>
                                  )}
                                </>
                              )}
                              
                              {/* Menus qui s'ouvrent depuis les boutons */}
                {messageMenuOpen === `emoji-${message.id}` && (() => {
                  return (
                    <div 
                      data-emoji-menu="true" 
                      data-reaction-menu={`emoji-${message.id}`} 
                      className={`absolute bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 transition-all duration-200`}
                      style={{
                        // Positionnement vertical intelligent
                        top: index > groupMessages.length - 3 ? 'auto' : '100%',
                        bottom: index > groupMessages.length - 3 ? '100%' : 'auto',
                        marginTop: index > groupMessages.length - 3 ? '0' : '4px',
                        marginBottom: index > groupMessages.length - 3 ? '4px' : '0',
                        // Positionnement horizontal : s'adapter à la position du message
                        right: isOwnMessage ? '0' : 'auto',
                        left: isOwnMessage ? 'auto' : '0',
                        // Dimensions responsives
                        width: 'min(256px, calc(100vw - 2rem))',
                        maxWidth: '256px',
                        minWidth: '200px'
                      }}
                    >
                      {/* Section des emojis récents */}
                      {recentEmojis.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Récents</div>
                          <div className="grid grid-cols-6 gap-1 mb-2">
                            {recentEmojis.slice(0, 6).map((emoji, index) => (
                              <button
                                key={`recent-reaction-${index}-${emoji}`}
                                onClick={async () => {
                                  try {
                                    await addReaction(message.id, emoji);
                                    setMessageMenuOpen(null);
                                  } catch (error) {
                                  }
                                }}
                                className={`text-lg hover:bg-gray-100 p-1 rounded transition-colors ${
                                  getCurrentUserReaction(message.id) === emoji ? 'bg-blue-100 border-2 border-blue-300' : ''
                                }`}
                                title={`Réagir avec ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <div className="h-px bg-gray-200 mb-2" />
                        </div>
                      )}
                      
                      {/* Section des emojis standards */}
                      <div className="grid grid-cols-6 gap-1">
                        {['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥', '💯', '🎉', '😍', '😘', '🤔', '😎', '🥰', '🤣', '😭', '😤', '💪', '🙌', '👏', '🤝', '🙏', '✨'].map((emoji, index) => (
                          <button
                            key={`reaction-${index}-${emoji}`}
                            onClick={async () => {
                              try {
                                await addReaction(message.id, emoji);
                                setMessageMenuOpen(null);
                              } catch (error) {
                              }
                            }}
                            className={`text-lg hover:bg-gray-100 p-1 rounded transition-colors ${
                              getCurrentUserReaction(message.id) === emoji ? 'bg-blue-100 border-2 border-blue-300' : ''
                            }`}
                            title={getCurrentUserReaction(message.id) === emoji ? 'Votre réaction actuelle' : `Réagir avec ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                            </div>
                            
                            {/* Menu contextuel - repositionné pour un meilleur contrôle */}
                            {messageMenuOpen === message.id && (
                              <div 
                                className={`absolute z-50 min-w-[130px] bg-white rounded-lg shadow-xl border border-gray-200 py-1 transition-all duration-200 ${
                                  isOwnMessage 
                                    ? 'left-0' 
                                    : 'right-0'
                                }`}
                                style={{
                                  top: index > groupMessages.length - 3 ? 'auto' : '100%',
                                  bottom: index > groupMessages.length - 3 ? '100%' : 'auto',
                                  marginTop: index > groupMessages.length - 3 ? '0' : '4px',
                                  marginBottom: index > groupMessages.length - 3 ? '4px' : '0',
                                  maxHeight: '200px',
                                  overflowY: 'auto'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Bouton Répondre - seulement pour les messages avec auteur */}
                                {message.authorId && !message.isSystemMessage && (
                                  <button
                                    onMouseDown={() => handleReplyToMessage(message)}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                                  >
                                    <Reply className="h-4 w-4" />
                                    <span>Répondre</span>
                                  </button>
                                )}
                                {/* Bouton Modifier - seulement pour ses propres messages */}
                                {isOwnMessage && !message.isDeleted && (
                                  <button
                                    onClick={() => handleEditMessage(message.id, message.content)}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span>Modifier</span>
                                  </button>
                                )}
                                {/* Bouton Supprimer - pour ses propres messages OU si modérateur/admin */}
                                {!message.isDeleted && (() => {
                                  const deletionInfo = getMessageDeletionInfo(message.id);
                                  return deletionInfo?.canDelete || false;
                                })() && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setMessageMenuOpen(null); // Fermer le menu immédiatement
                                      handleDeleteMessage(message.id);
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 transition-colors text-sm"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Supprimer</span>
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* Boutons d'action à côté du message */}
                            {!isEditing && !message.sharedPost && !message.sharedFolder && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity" ref={messageMenuRef}>
                                <div className="flex items-center space-x-1">
                                  {/* Bouton emoji */}
                                  <button
                                    data-menu-trigger="true"
                                    onClick={() => {                                      const newState = messageMenuOpen === `emoji-${message.id}` ? null : `emoji-${message.id}`;                                      setMessageMenuOpen(newState);
                                    }}
                                    className="p-1.5 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                  >
                                    <Smile className="h-4 w-4 text-gray-600" />
                                  </button>
                                  
                                  {/* Bouton menu */}
                                  <button
                                    data-menu-trigger="true"
                                    onClick={() => {
                                      setMessageMenuOpen(messageMenuOpen === message.id ? null : message.id);
                                    }}
                                    className="p-1.5 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                  >
                                    <MoreVertical className="h-4 w-4 text-gray-600" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                  }
                  </>
                )}
                <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input de message */}
              {canSendMessage ? (
                <div className="border-t border-gray-200 bg-white sticky bottom-0 left-0 right-0 z-10 flex-shrink-0">
                  {/* Interface de réponse - intégrée dans le conteneur de saisie */}
                  {replyingToMessage && (
                    <div className="px-3 sm:px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between w-full overflow-hidden">
                      <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                        <Reply className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0 whitespace-nowrap">
                          Répondre à <strong>{replyingToMessage.author?.username || 'Utilisateur inconnu'}</strong>
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 truncate flex-1 min-w-0">
                          {replyingToMessage.content}
                        </span>
                      </div>
                      <button
                        onClick={() => setReplyingToMessage(null)}
                        className="p-1 text-gray-500 hover:text-gray-700 flex-shrink-0 ml-2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="p-3 sm:p-4 relative">
                  
                  <div className="flex space-x-2 sm:space-x-3 items-center">
                    <div className="relative">
                      <button
                        type="button"
                        data-emoji-button="true"
                        onClick={() => {
                          setShowEmojiPicker(!showEmojiPicker);
                        }}
                        className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      
                      {/* Picker d'emojis positionné juste au-dessus du bouton */}
                      {showEmojiPicker && (
                        <div>
                          <div
                            ref={emojiPickerRef}
                            className="absolute bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-50 max-h-72 flex flex-col"
                            style={{ 
                              backdropFilter: 'blur(4px)',
                              // Positionné au-dessus du formulaire et centré
                              bottom: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              marginBottom: '8px',
                              width: 'min(380px, calc(100vw - 2rem))',
                              maxWidth: '380px',
                              minWidth: '280px'
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500">Sélection d'emojis</span>
                              <button
                                type="button"
                                onClick={() => setShowEmojiPicker(false)}
                                className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1 rounded hover:bg-gray-100"
                              >
                                Fermer
                              </button>
                            </div>
                            <div className="mb-2">
                              <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Récents ({recentEmojis.length})</div>
                              {recentEmojis.length === 0 ? (
                                <div className="text-xs text-gray-500 p-2">Aucun emoji récent</div>
                              ) : (
                                <div className="grid grid-cols-8 gap-1 mb-2">
                                  {recentEmojis.map((emoji, i) => {
                                    return (
                                      <button
                                        key={`recent-emoji-${i}-${emoji}`}
                                        onClick={() => handleEmojiClick(emoji)}
                                        className="text-lg hover:bg-gray-100 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        title={`Emoji récent: ${emoji}`}
                                      >
                                        {emoji}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Standards</div>
                            <div className="grid grid-cols-8 gap-1">
                              {['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨'].map((emoji, index) => (
                                <button
                                  key={`emoji-${index}-${emoji}`}
                                  onClick={() => handleEmojiClick(emoji)}
                                  className="text-lg hover:bg-gray-100 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                            <div className="mt-2 text-right">
                              <span className="text-[10px] uppercase tracking-wide text-gray-400">Emojis</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={replyingToMessage ? `Répondre à ${replyingToMessage.author?.username || 'Utilisateur inconnu'}...` : "Tapez votre message..."}
                      className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
                
                {/* Suggestions de mentions */}
                {showMentionSuggestions && mentionSuggestions.length > 0 && activeChat && !activeChat.isPrivate && (
                  <div className="absolute bottom-full left-3 sm:left-4 right-3 sm:right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
                    <div className="p-2 text-xs text-gray-500 font-medium border-b border-gray-100">
                      Mentionner un membre
                    </div>
                    {mentionSuggestions.map((member, index) => (
                      <button
                        key={member.id}
                        onClick={() => insertMention(member)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                          index === selectedMentionIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          {member.profilePicture ? (
                            <img 
                              src={member.profilePicture} 
                              alt={member.username}
                              className="h-8 w-8 rounded-full object-cover object-center"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-blue-600">
                              {member.username[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">@{member.username}</div>
                          {member.displayName && member.displayName !== member.username && (
                            <div className="text-xs text-gray-500 truncate">{member.displayName}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                </div>
              ) : activeGroupId ? (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-center text-gray-500">
                    <div className="text-sm">Vous n'êtes plus membre de ce groupe</div>
                    <div className="text-xs text-gray-400 mt-1">Vous pouvez consulter l'historique mais ne pouvez plus envoyer de messages</div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">
                  Sélectionnez une conversation
                </h3>
                <p>Choisissez une conversation pour commencer à discuter</p>
                {allChats.length === 0 && (
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="block mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Créer votre premier groupe
                    </button>
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="block mx-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Envoyer un message
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Créer un groupe */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Créer un groupe</h3>
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du groupe
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Ex: Droit des contrats L3"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Décrivez le sujet du groupe..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroup(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Envoyer un message */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Envoyer un message</h3>
                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setConnectionSearchQuery('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Vous ne pouvez contacter que vos connexions en privé :
                </p>
                
                {(strictConnections ?? myConnections).length === 0 ? (
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 mb-2">Aucune connexion disponible</p>
                    <p className="text-sm text-gray-400">
                      Vous devez avoir des connexions mutuelles pour envoyer un message privé.
                    </p>
                  </div>
                ) : (
                  <>
                    {loadingStrictConnections && (
                      <p className="text-xs text-gray-400 mb-2">Actualisation...</p>
                    )}
                    {/* Barre de recherche pour les connexions */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Rechercher une connexion..."
                        value={connectionSearchQuery}
                        onChange={(e) => setConnectionSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    
                    {/* Liste filtrée des connexions */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {(strictConnections ?? myConnections)
                        .filter((connection: any) => {
                          if (!connectionSearchQuery.trim()) return true;
                          const searchLower = connectionSearchQuery.toLowerCase();
                          return (
                            connection.username?.toLowerCase().includes(searchLower) ||
                            connection.firstName?.toLowerCase().includes(searchLower) ||
                            connection.lastName?.toLowerCase().includes(searchLower) ||
                            `${connection.firstName} ${connection.lastName}`.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((connection: any, index: number) => (
                    <button
                      key={connection.id || connection._id || `connection-${index}`}
                      onClick={async (e) => {
                        e.preventDefault(); // Empêcher le comportement par défaut
                        const userId = connection._id || connection.id || connection.userId; // Priorité à _id
                        if (!userId) {
                          setShowErrorMessage('ID utilisateur manquant');
                          return;
                        }
                        
                        try {
                          await handleCreatePrivateChat(userId);
                        } catch (error) {
                          // Erreur silencieuse
                        }
                      }}
                      className="w-full flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                        {connection.profilePicture ? (
                          <img 
                            src={connection.profilePicture} 
                            alt={connection.username || 'Utilisateur'}
                            className="w-10 h-10 rounded-full object-cover object-center"
                          />
                        ) : (
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{connection.username}</p>
                        <p className="text-sm text-gray-500">{connection.firstName} {connection.lastName}</p>
                      </div>
                    </button>
                        ))
                      }
                      {(strictConnections ?? myConnections)
                        .filter((connection: any) => {
                          if (!connectionSearchQuery.trim()) return true;
                          const searchLower = connectionSearchQuery.toLowerCase();
                          return (
                            connection.username?.toLowerCase().includes(searchLower) ||
                            connection.firstName?.toLowerCase().includes(searchLower) ||
                            connection.lastName?.toLowerCase().includes(searchLower) ||
                            `${connection.firstName} ${connection.lastName}`.toLowerCase().includes(searchLower)
                          );
                        }).length === 0 && connectionSearchQuery.trim() && (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">Aucune connexion trouvée</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Paramètres du groupe */}
      {showGroupSettings && activeChat && !activeChat.isPrivate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Paramètres du groupe</h3>
              <button
                onClick={() => setShowGroupSettings(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Informations du groupe */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Informations</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {/* Photo de profil du groupe - pour admin/modérateurs */}
                  {!activeChat.isPrivate && (isGroupAdmin(activeChat.id) || isGroupModerator(activeChat.id)) && (
                    <div className="mb-6 flex justify-center">
                      <div className="relative group">
                        <div 
                          className="h-32 w-32 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center cursor-pointer hover:opacity-80 hover:scale-105 transition-all duration-200 relative transform active:scale-95"
                          onClick={() => {
                            console.log('🖱️ Clic sur la photo de profil du groupe détecté !');
                            const input = document.getElementById('group-photo-input') as HTMLInputElement;
                            if (input) {
                              console.log('✅ Input trouvé, déclenchement du clic');
                              input.click();
                            } else {
                              console.error('❌ Input group-photo-input introuvable !');
                            }
                          }}
                          title="Cliquer pour changer la photo du groupe"
                        >
                          {activeChat.profilePicture ? (
                            <img 
                              key={`group-pic-${activeChat.id}-${imageRefreshKey[activeChat.id] || 0}`}
                              src={getChatProfilePicture(activeChat)}
                              alt={activeChat.name}
                              className="h-32 w-32 object-cover"
                            />
                          ) : (
                            <span className="text-3xl font-medium text-blue-600">
                              {activeChat.name[0].toUpperCase()}
                            </span>
                          )}
                          
                          {/* Overlay visible au hover avec effet moderne */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full">
                            <Camera className="h-6 w-6 text-white mb-1" />
                            <span className="text-xs text-white font-medium">Modifier</span>
                          </div>
                        </div>
                        
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              console.log('📁 Input file onChange déclenché !');
                              const file = e.target.files?.[0];
                              console.log('📁 Fichier sélectionné:', file ? file.name : 'aucun');
                              
                              if (file) {
                                console.log('📊 Taille du fichier:', file.size, 'bytes');
                                console.log('📊 Type de fichier:', file.type);
                                
                                if (file.size > 5 * 1024 * 1024) { // 5MB max
                                  console.error('❌ Fichier trop volumineux');
                                  setShowErrorMessage('La taille de l\'image ne doit pas dépasser 5MB');
                                  return;
                                }
                                
                                if (!file.type.startsWith('image/')) {
                                  console.error('❌ Type de fichier invalide');
                                  setShowErrorMessage('Veuillez sélectionner une image valide');
                                  return;
                                }
                                
                                console.log('✅ Fichier valide, début de la conversion...');
                                
                                try {
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    console.log('📖 Lecture du fichier terminée');
                                    const base64 = event.target?.result as string;
                                    console.log('🔄 Appel de updateGroupPicture avec groupId:', activeChat.id);
                                    await updateGroupPicture(activeChat.id, base64);
                                    console.log('✅ updateGroupPicture terminé avec succès');
                                    setShowSuccessMessage('Photo du groupe mise à jour avec succès !');
                                  };
                                  reader.readAsDataURL(file);
                                } catch (error) {
                                  console.error('❌ Erreur lors de la lecture:', error);
                                  setShowErrorMessage('Erreur lors de la mise à jour de la photo');
                                }
                              }
                            }}
                            className="hidden"
                            id="group-photo-input"
                          />
                        </div>
                      </div>
                  )}

                  {/* Photo de profil du groupe - pour les membres normaux (lecture seule) */}
                  {!activeChat.isPrivate && !(isGroupAdmin(activeChat.id) || isGroupModerator(activeChat.id)) && activeChat.profilePicture && (
                    <div className="mb-6 flex justify-center">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                        <img 
                          key={`group-pic-mini-${activeChat.id}-${imageRefreshKey[activeChat.id] || 0}`}
                          src={getChatProfilePicture(activeChat)}
                          alt={activeChat.name}
                          className="h-24 w-24 object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Nom du groupe */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Nom du groupe</label>
                      {!activeChat.isPrivate && (isGroupAdmin(activeChat.id) || isGroupModerator(activeChat.id)) && (
                        <button
                          onClick={() => {
                            setEditingGroupName(true);
                            setTempGroupName(activeChat.name);
                          }}
                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Modifier le nom"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {editingGroupName ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={tempGroupName}
                          onChange={(e) => setTempGroupName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nom du groupe"
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={async () => {
                              if (tempGroupName.trim() !== activeChat.name) {
                                try {
                                  await updateGroup(activeChat.id, tempGroupName.trim(), activeChat.description);
                                  setShowSuccessMessage('Nom du groupe mis à jour avec succès !');
                                } catch (error) {                                  setShowErrorMessage('Erreur lors de la mise à jour du nom');
                                }
                              }
                              setEditingGroupName(false);
                            }}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                          >
                            Sauvegarder
                          </button>
                          <button
                            onClick={() => {
                              setEditingGroupName(false);
                              setTempGroupName('');
                            }}
                            className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium text-gray-900">{activeChat.name}</p>
                    )}
                  </div>
                  
                  {/* Description du groupe */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      {!activeChat.isPrivate && (isGroupAdmin(activeChat.id) || isGroupModerator(activeChat.id)) && (
                        <button
                          onClick={() => {
                            setEditingGroupDescription(true);
                            setTempGroupDescription(activeChat.description || '');
                          }}
                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Modifier la description"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {editingGroupDescription ? (
                      <div className="space-y-2">
                        <textarea
                          value={tempGroupDescription}
                          onChange={(e) => setTempGroupDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Description du groupe"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={async () => {
                              if (tempGroupDescription.trim() !== (activeChat.description || '')) {
                                try {
                                  await updateGroup(activeChat.id, activeChat.name, tempGroupDescription.trim());
                                  setShowSuccessMessage('Description du groupe mise à jour avec succès !');
                                } catch (error) {                                  setShowErrorMessage('Erreur lors de la mise à jour de la description');
                                }
                              }
                              setEditingGroupDescription(false);
                            }}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                          >
                            Sauvegarder
                          </button>
                          <button
                            onClick={() => {
                              setEditingGroupDescription(false);
                              setTempGroupDescription('');
                            }}
                            className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">{activeChat.description || 'Aucune description'}</p>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2">
                    Créé le {new Intl.DateTimeFormat('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }).format(new Date(activeChat.createdAt))}
                  </p>
                </div>
              </div>

              {/* Paramètres des notifications */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Notifications</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Recevoir des notifications</p>
                      <p className="text-xs text-gray-500">Être notifié des nouveaux messages dans ce groupe</p>
                    </div>
                    <button
                      onClick={() => toggleGroupNotifications(activeChat.id, activeChat.notificationsEnabled?.[user.id] === false)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        activeChat.notificationsEnabled?.[user.id] !== false
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          activeChat.notificationsEnabled?.[user.id] !== false
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Membres */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Membres ({activeChat.members.length})
                  </h4>
                  {canManageGroup(activeChat.id) && (
                    <button
                      onClick={handleAddMembers}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Ajouter</span>
                    </button>
                  )}
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activeChat.members.map((member) => {
                    const memberStatus = getMemberStatus(member.id, activeChat);
                    const isCurrentUserAdmin = isGroupAdmin(activeChat.id);
                    const isCurrentUserModerator = isGroupModerator(activeChat.id);
                    const canModerateThisMember = isCurrentUserAdmin && member.id !== activeChat.adminId && member.id !== user.id;
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div 
                          className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors" 
                          onClick={() => handleViewUserProfile(member.id)}
                          title={`Voir le profil de ${member.username}`}
                        >
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                            {member.profilePicture ? (
                              <img 
                                src={member.profilePicture} 
                                alt={member.username}
                                className="h-8 w-8 object-cover rounded-full"
                              />
                            ) : (
                              <UserIcon className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.username}</p>
                            <p className="text-sm text-gray-500">{member.firstName} {member.lastName}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Statut du membre */}
                          <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                            memberStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            memberStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            <span>{memberStatus.badge}</span>
                            <span>{memberStatus.status}</span>
                          </span>
                          
                          {/* Actions de modération pour les admins */}
                          {canModerateThisMember && (
                            <div className="flex items-center space-x-1">
                              {/* Promouvoir/Rétrograder modérateur */}
                              {!isUserModerator(member.id, activeChat) ? (
                                <button
                                  onClick={() => promoteModerator(activeChat.id, member.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                  title="Promouvoir modérateur"
                                >
                                  👑
                                </button>
                              ) : (
                                <button
                                  onClick={() => demoteModerator(activeChat.id, member.id)}
                                  className="p-1 text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                                  title="Rétrograder modérateur"
                                >
                                  📉
                                </button>
                              )}
                              
                              {/* Exclure du groupe */}
                              <button
                                onClick={() => kickMember(activeChat.id, member.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Exclure du groupe"
                              >
                                🚫
                              </button>
                            </div>
                          )}
                          
                          {/* Actions de base pour les modérateurs (seulement exclusion des membres normaux) */}
                          {!canModerateThisMember && isCurrentUserModerator && member.id !== user.id && member.id !== activeChat.adminId && !isUserModerator(member.id, activeChat) && (
                            <button
                              onClick={() => kickMember(activeChat.id, member.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Exclure du groupe"
                            >
                              🚫
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions dangereuses */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Actions</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowGroupSettings(false);
                      handleLeaveGroup(activeChat.id);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <EyeOff className="h-5 w-5" />
                    <span>
                      {activeChat.isPrivate 
                        ? "Supprimer l'historique de la conversation" 
                        : activeChat.adminId === user.id 
                          ? "Transférer et quitter le groupe"
                          : "Quitter le groupe"
                      }
                    </span>
                  </button>

                  {/* Bouton supprimer le groupe (admin uniquement) */}
                  {!activeChat.isPrivate && activeChat.adminId === user.id && (
                    <button
                      onClick={() => {
                        setShowGroupSettings(false);
                        setShowDeleteGroupConfirm(activeChat.id);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span>Supprimer le groupe</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter des membres */}
      {showAddMemberModal && activeChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Ajouter des membres</h3>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedMembers([]);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {availableUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 mb-2">Aucun utilisateur disponible</p>
                  <p className="text-sm text-gray-400">
                    Tous vos connexions sont déjà membres de ce groupe.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Sélectionnez les connexions à ajouter au groupe :
                  </p>
                  {availableUsers.map(availableUser => (
                    <div
                      key={availableUser.id}
                      className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${
                        selectedMembers.includes(availableUser.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => toggleMemberSelection(availableUser.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                            <UserIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{availableUser.username}</p>
                            <p className="text-sm text-gray-500">{availableUser.firstName} {availableUser.lastName}</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedMembers.includes(availableUser.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedMembers.includes(availableUser.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {availableUsers.length > 0 && (
              <div className="flex items-center justify-between p-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {selectedMembers.length} membre{selectedMembers.length > 1 ? 's' : ''} sélectionné{selectedMembers.length > 1 ? 's' : ''}
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowAddMemberModal(false);
                      setSelectedMembers([]);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddSelectedMembers}
                    disabled={selectedMembers.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Ajouter ({selectedMembers.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmation pour quitter un groupe */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Quitter le groupe
              </h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir quitter ce groupe ? Vous ne recevrez plus de messages et devrez être réinvité pour y revenir.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLeaveConfirm(null)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmLeaveGroup}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium"
                >
                  Quitter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation pour supprimer l'historique */}
      {showDeleteHistoryConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <EyeOff className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Supprimer l'historique de la conversation pour vous
              </h3>
              <p className="text-gray-600 mb-6">
                <strong>⚠️ Avertissement :</strong> Cette action supprimera définitivement l'historique de cette conversation pour vous uniquement. L'autre personne conservera ses messages. Cette action est irréversible.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteHistoryConfirm(null)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteHistory}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Supprimer l'historique
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation pour supprimer le groupe */}
      {showDeleteGroupConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Supprimer le groupe
              </h3>
              <p className="text-gray-600 mb-6">
                <strong>⚠️ Avertissement :</strong> Cette action supprimera définitivement le groupe et tous ses messages pour tous les membres. Cette action est irréversible.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteGroupConfirm(null)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteGroup}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Supprimer le groupe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (() => {
        const deletionInfo = getMessageDeletionInfo(showDeleteConfirm);
        const isModeratedDeletion = deletionInfo?.isModeratedDeletion || false;
        
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isModeratedDeletion ? 'Supprimer ce message' : 'Supprimer le message'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {isModeratedDeletion 
                    ? 'En tant que modérateur/administrateur, vous allez supprimer ce message. Il sera marqué comme "supprimé par un modérateur" pour tous les membres.' 
                    : 'Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.'
                  }
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDeleteMessage}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                  >
                    {isModeratedDeletion ? 'Supprimer (Modération)' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Message de succès */}
      {showSuccessMessage && (
        <div className="fixed top-24 right-6 z-50 transform transition-all">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3">
            <div className="bg-white/20 p-1 rounded-full">
              <Check className="h-4 w-4" />
            </div>
            <span className="font-medium">{showSuccessMessage}</span>
            <button 
              onClick={() => setShowSuccessMessage(null)}
              className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {showErrorMessage && (
        <div className="fixed top-24 right-6 z-50 transform transition-all">
          <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3">
            <div className="bg-white/20 p-1 rounded-full">
              <X className="h-4 w-4" />
            </div>
            <span className="font-medium">{showErrorMessage}</span>
            <button 
              onClick={() => setShowErrorMessage(null)}
              className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Effet de highlight pour la cible d'une réponse */
        .reply-highlight {
          position: relative;
          animation: replyHighlightFlash 2s ease-out;
        }
        @keyframes replyHighlightFlash {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.9); background-color: rgba(191,219,254,0.9); }
          40% { box-shadow: 0 0 0 4px rgba(59,130,246,0.4); background-color: rgba(219,234,254,0.6); }
          70% { box-shadow: 0 0 0 2px rgba(59,130,246,0.25); background-color: rgba(239,246,255,0.4); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); background-color: transparent; }
        }
  /* Scrollbar personnalisée pour picker */
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* Modal de réactions */}
      {showReactionModal && (
        <ReactionModal
          isOpen={true}
          onClose={() => setShowReactionModal(null)}
          reactionDetails={getReactionDetails(showReactionModal)}
          currentUserId={user?.id || ''}
          onRemoveReaction={async (emoji: string) => {
            try {
              await removeReaction(showReactionModal, emoji);
            } catch (error) {            }
          }}
          onUserClick={(userId: string) => {
            // Fermer le modal et ouvrir le profil utilisateur
            setShowReactionModal(null);
            if (onViewUserProfile) {
              onViewUserProfile(userId);
            }
          }}
        />
      )}
    </div>
  );
};

export default MessagingPage;