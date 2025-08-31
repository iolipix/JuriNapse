import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { User } from '../types';
import { groupsAPI, messagesAPI } from '../services/api';

export interface Group {
  id: string;
  name: string;
  description: string;
  adminId: string;
  moderatorIds: string[];
  members: User[];
  createdAt: Date;
  notificationsEnabled?: { [userId: string]: boolean };
  isPrivate?: boolean;
  hiddenFor?: string[];
  hiddenForWithTimestamp?: Array<{ userId: string; hiddenAt: Date }>;
  profilePicture?: string; // Ajouté pour les photos de groupe
}

// Interface pour les conversations privées (1-to-1)
export interface PrivateConversation {
  id: string;
  participants: [User, User]; // Exactement 2 participants
  createdAt: Date;
  lastMessage?: Message;
  notificationsEnabled?: { [userId: string]: boolean };
  hiddenFor?: string[];
}

// Type combiné pour l'interface utilisateur
export type ChatItem = Group | PrivateConversation;

// Type guards pour distinguer les conversations privées des groupes
export const isPrivateConversation = (chat: ChatItem): chat is PrivateConversation => {
  return 'participants' in chat && Array.isArray(chat.participants) && chat.participants.length === 2;
}

export const isGroup = (chat: ChatItem): chat is Group => {
  return 'adminId' in chat && 'moderatorIds' in chat;
}

// Harmoniser avec le type global Message (../types) en rendant author dans replyTo non obligatoire
export interface Message {
  id: string;
  groupId: string;
  authorId?: string; // Optionnel pour les messages système
  author?: User; // Optionnel pour les messages système
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isSystemMessage?: boolean; // Ajouté pour les messages système
  isDeleted?: boolean; // Ajouté pour les messages supprimés
  deletedAt?: Date; // Date de suppression
  deletedBy?: string; // ID de l'utilisateur qui a supprimé le message
  deletionReason?: string; // Raison de suppression
  reactions?: { [emoji: string]: { users: string[]; count: number } }; // Ajouté pour les réactions
  sharedPost?: {
    id: string;
    title: string;
    content: string;
    author: User;
  };
  sharedFolder?: {
    id: string;
    name: string;
    description: string;
    itemsCount: number;
    author: User;
    color: string;
  };
  sharedPdf?: {
    id: string;
    name: string;
    url?: string;
    size: number;
    author: User;
  };
  // Nouveau: métadonnées de réponse enrichies par le backend
  replyTo?: {
    id: string;
    content: string;
    createdAt: Date;
    author?: User; // peut être indéfini si non peuplé
  };
}

interface MessagingContextType {
  groups: Group[];
  privateConversations: PrivateConversation[];
  messages: Message[];
  lastMessages: { [groupId: string]: Message };
  loading: boolean;
  error: string | null;
  
  // Groupes
  getVisibleGroups: () => Group[];
  createGroup: (name: string, description: string, isPrivate?: boolean, selectedMembers?: string[]) => Promise<void>;
  updateGroup: (groupId: string, name: string, description: string) => Promise<void>;
  updateGroupPicture: (groupId: string, pictureData: FormData | string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  
  // Conversations privées
  getPrivateConversations: () => PrivateConversation[];
  createOrGetPrivateConversation: (otherUserId: string) => Promise<string>; // Retourne l'ID de la conversation
  getPrivateConversationByUserId: (otherUserId: string) => PrivateConversation | null;
  
  // Interface unifiée pour les chats (groupes + conversations privées)
  getAllChats: () => ChatItem[];
  getChatById: (chatId: string) => ChatItem | null;
  getChatDisplayName: (chat: ChatItem, currentUserId: string) => string;
  
  // Membres
  addMemberToGroup: (groupId: string, userId: string) => Promise<void>;
  removeMemberFromGroup: (groupId: string, userId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  
  // Messages
  getMessages: (groupId: string) => Message[];
  loadMessages: (groupId: string, page?: number, isLoadMore?: boolean) => Promise<void>;
  loadMoreMessages: (groupId: string) => Promise<void>;
  sendMessage: (groupId: string, content: string, replyToId?: string) => Promise<void>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  getMessageDeletionInfo: (messageId: string) => any;
  
  // Pagination des messages
  canLoadMoreMessages: (groupId: string) => boolean;
  isLoadingMessages: (groupId: string) => boolean;
  
  // Réactions
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  getCurrentUserReaction: (messageId: string) => string | null;
  getReactionDetails: (messageId: string) => any;
  
  // Partage
  sharePost: (groupId: string, postId: string, content?: string) => Promise<void>;
  shareFolder: (groupId: string, folderId: string, content?: string) => Promise<void>;
  sharePdf: (groupId: string, pdfData: any, content?: string) => Promise<void>;
  
  // Modération
  isGroupAdmin: (groupId: string) => boolean;
  isGroupModerator: (groupId: string) => boolean;
  promoteModerator: (groupId: string, userId: string) => Promise<void>;
  demoteModerator: (groupId: string, userId: string) => Promise<void>;
  kickMember: (groupId: string, userId: string) => Promise<void>;
  
  // Utilitaires - Déprécié, utiliser createOrGetPrivateConversation
  createPrivateChat: (otherUserId: string) => Promise<void>;
  toggleGroupNotifications: (groupId: string, enabled: boolean) => Promise<void>;
  hideConversation: (groupId: string) => Promise<void>;
  getAvailableUsersForGroup: (groupId: string) => User[];
  canManageGroup: (groupId: string) => boolean;
  isUserBlocked: (userId: string) => boolean;
  getBlockedMembersInGroup: (groupId: string) => User[];
  isUserMemberOfGroup: (groupId: string) => boolean;
  getStorageUsage: () => Promise<{ used: number; total: number }>;
  deleteHistory: (groupId: string) => Promise<void>;
  markGroupAsRead: (groupId: string) => void;
  getUnreadMessagesCount: (groupId: string) => number;
  getTotalUnreadMessagesCount: () => number;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context; // Updated to include isUserMemberOfGroup
};

interface MessagingProviderProps {
  children: ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { socket, joinGroup: joinGroupSocket, leaveGroup: leaveGroupSocket } = useSocket();
  const [groups, setGroups] = useState<Group[]>([]);
  const [privateConversations, _setPrivateConversations] = useState<PrivateConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastMessages, setLastMessages] = useState<{ [groupId: string]: Message }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagePagination, setMessagePagination] = useState<{ [groupId: string]: { page: number; hasMore: boolean; loading: boolean } }>({});
  
  // Tracker les dernières lectures par conversation (avec persistance localStorage)
  const [lastReadTimestamps, setLastReadTimestamps] = useState<{ [groupId: string]: Date }>(() => {
    try {
      const saved = localStorage.getItem('messageReadTimestamps');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convertir les strings en Date
        const timestamps: { [groupId: string]: Date } = {};
        for (const [groupId, timestamp] of Object.entries(parsed)) {
          timestamps[groupId] = new Date(timestamp as string);
        }
        return timestamps;
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des timestamps de lecture:', error);
    }
    return {};
  });

  // Charger les groupes depuis l'API
  const loadGroups = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await groupsAPI.getAllGroups();
      
      if (response.success) {
        const apiGroups = response.data.map((group: any) => ({
          id: group._id,
          name: group.name,
          description: group.description,
          adminId: group.adminId._id || group.adminId,
          moderatorIds: group.moderatorIds.map((mod: any) => mod._id || mod),
          members: group.members.map((member: any) => ({
            id: member._id,
            username: member.username,
            firstName: member.firstName,
            lastName: member.lastName,
            profilePicture: member.profilePicture,
            university: member.university,
            isStudent: member.isStudent,
            email: member.email,
            joinedAt: new Date(member.createdAt || Date.now())
          })),
          createdAt: new Date(group.createdAt),
          isPrivate: group.isPrivate || false,
          hiddenFor: group.hiddenFor || [],
          notificationsEnabled: group.notificationsEnabled || {},
          profilePicture: group.profilePicture || null  // Ajouter la photo de groupe
        }));
        
        setGroups(apiGroups);
      } else {
        setError(response.message || 'Erreur lors du chargement des groupes');
      }
    } catch (err) {
      setError('Erreur lors du chargement des groupes');
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur actuel est membre d'un groupe
  const isUserMemberOfGroup = (groupId: string): boolean => {
    if (!user) {
      return false;
    }
    
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return false;
    }
    
    const isMember = group.members.some(member => member.id === user.id);
    
    return isMember;
  };

  // Charger les messages d'un groupe
  const loadMessages = useCallback(async (groupId: string, page: number = 1, isLoadMore: boolean = false) => {
    
    // TEMPORAIRE: Bypass de la vérification de membership pour corriger le scroll
    // TODO: Résoudre le problème de race condition avec isUserMemberOfGroup
    // if (!isUserMemberOfGroup(groupId)) {
    //   console.log(`❌ Utilisateur non membre du groupe ${groupId}`);
    //   setError('Vous n\'êtes plus membre de ce groupe');
    //   return;
    // }

    try {
      // Éviter les appels concurrents pour le même groupe
      if (messagePagination[groupId]?.loading) {
        return;
      }
      
      // Marquer comme en cours de chargement
      setMessagePagination(prev => ({
        ...prev,
        [groupId]: { ...prev[groupId], loading: true }
      }));

      const response = await messagesAPI.getMessages(groupId, page, 20); // 20 messages par page
      
      if (response.success) {        
        const apiMessages = response.data.map((message: any) => ({
          id: message._id,
          groupId: message.groupId,
          authorId: message.authorId?._id || message.authorId,
          author: message.authorId ? {
            id: message.authorId._id || message.authorId,
            username: message.authorId.username,
            firstName: message.authorId.firstName,
            lastName: message.authorId.lastName,
            profilePicture: message.authorId.profilePicture,
            university: message.authorId.university,
            isStudent: message.authorId.isStudent,
            email: message.authorId.email,
            joinedAt: new Date(message.authorId.createdAt || Date.now())
          } : null,
          isSystemMessage: message.isSystemMessage || false,
            content: message.content,
          createdAt: new Date(message.createdAt),
          updatedAt: message.updatedAt ? new Date(message.updatedAt) : undefined,
          replyTo: message.replyTo ? {
            id: message.replyTo._id || message.replyTo.id,
            content: message.replyTo.content,
            createdAt: new Date(message.replyTo.createdAt),
            author: message.replyTo.authorId ? {
              id: message.replyTo.authorId._id || message.replyTo.authorId.id,
              username: message.replyTo.authorId.username || message.replyTo.author?.username,
              firstName: message.replyTo.authorId.firstName || message.replyTo.author?.firstName,
              lastName: message.replyTo.authorId.lastName || message.replyTo.author?.lastName,
              profilePicture: message.replyTo.authorId.profilePicture || message.replyTo.author?.profilePicture
            } : (message.replyTo.author ? {
              id: message.replyTo.author.id,
              username: message.replyTo.author.username,
              firstName: message.replyTo.author.firstName,
              lastName: message.replyTo.author.lastName,
              profilePicture: message.replyTo.author.profilePicture
            } : undefined)
          } : undefined,
          sharedPost: message.sharedPost ? {
            id: message.sharedPost.id,
            title: message.sharedPost.title,
            content: message.sharedPost.content,
            author: message.sharedPost.author
          } : undefined,
          sharedFolder: message.sharedFolder,
          sharedPdf: message.sharedPdf,
          reactions: message.reactions || {}
        }));
        
        // Mettre à jour les messages
        if (isLoadMore) {
          // Ajouter les nouveaux messages au début (messages plus anciens)
          setMessages(prev => [
            ...apiMessages,
            ...prev.filter(msg => msg.groupId !== groupId || !apiMessages.find((newMsg: Message) => newMsg.id === msg.id))
          ]);
        } else {
          // Remplacer tous les messages pour ce groupe (premier chargement)
          setMessages(prev => [
            ...prev.filter(msg => msg.groupId !== groupId),
            ...apiMessages
          ]);
          
          // Mettre à jour le dernier message pour ce groupe (le plus récent)
          if (apiMessages.length > 0) {
            const latestMessage = apiMessages.reduce((latest: Message, current: Message) => 
              current.createdAt > latest.createdAt ? current : latest
            );
            setLastMessages(prev => ({
              ...prev,
              [groupId]: latestMessage
            }));
          }
        }

        // Mettre à jour les informations de pagination
        setMessagePagination(prev => ({
          ...prev,
          [groupId]: {
            page: page,
            hasMore: response.pagination?.hasMore || false,
            loading: false
          }
        }));
      }
    } catch (err) {
      setError('Erreur lors du chargement des messages');
      setMessagePagination(prev => ({
        ...prev,
        [groupId]: { ...prev[groupId], loading: false }
      }));
    }
  }, [messagePagination]);

  // Charger plus de messages (pagination)
  const loadMoreMessages = useCallback(async (groupId: string) => {
    const currentPagination = messagePagination[groupId];
    if (!currentPagination || currentPagination.loading || !currentPagination.hasMore) {
      return;
    }

    const nextPage = currentPagination.page + 1;
    await loadMessages(groupId, nextPage, true);
  }, [messagePagination, loadMessages]);

  // Charger les données au démarrage
  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  // Pré-charger les derniers messages de tous les groupes visibles après le chargement des groupes
  useEffect(() => {
    if (user && groups.length > 0) {
      
      const visibleGroups = getVisibleGroups();
      
      // Charger le dernier message (page 1) de chaque groupe visible avec un délai
      // pour s'assurer que l'authentification est complète
      setTimeout(() => {
        visibleGroups.forEach((group, index) => {
          
          // Délai progressive pour éviter les appels simultanés
          setTimeout(() => {
            // Utiliser loadMessages maintenant que le check de membership est bypassé
            loadMessages(group.id, 1, false).catch(() => {
              
              // Retry une fois après 2 secondes
              setTimeout(() => {
                loadMessages(group.id, 1, false).catch(() => {
                  // Retry échoué, ne rien faire
                });
              }, 2000);
            });
          }, index * 200); // 200ms entre chaque groupe
        });
      }, 500); // 500ms après le chargement des groupes
    }
  }, [groups, user]); // Retiré 'messages' pour éviter la boucle infinie

  // Auto-rejoindre les salles WebSocket pour tous les groupes de l'utilisateur
  useEffect(() => {
    if (socket && groups.length > 0 && user && joinGroupSocket) {
      groups.forEach(group => {
        if (group.members.some(member => member.id === user.id)) {
          joinGroupSocket(group.id);
        }
      });
    }
  }, [socket, groups, user, joinGroupSocket]);

  // Nettoyer les messages des groupes dont l'utilisateur n'est plus membre
  useEffect(() => {
    if (user && groups.length > 0) {
      const memberGroupIds = groups
        .filter(group => group.members.some(member => member.id === user.id))
        .map(group => group.id);
      
      setMessages(prev => prev.filter(message => memberGroupIds.includes(message.groupId)));
      
      // Nettoyer la pagination pour les groupes non membres
      setMessagePagination(prev => {
        const cleanPagination: { [groupId: string]: { page: number; hasMore: boolean; loading: boolean } } = {};
        memberGroupIds.forEach(groupId => {
          if (prev[groupId]) {
            cleanPagination[groupId] = prev[groupId];
          }
        });
        return cleanPagination;
      });
    }
  }, [user, groups]);

  // Écouter les événements WebSocket
  useEffect(() => {
    if (socket && user) {
      // Gérer les nouveaux messages en temps réel
      const handleNewMessage = (data: any) => {
        // Normaliser la structure de replyTo si présente
        let replyMeta: Message['replyTo'] | undefined;
        if (data.replyTo) {
          let replyAuthor = undefined;
          if (data.replyTo.author) {
            replyAuthor = {
              id: data.replyTo.author.id || data.replyTo.author._id,
              username: data.replyTo.author.username,
              firstName: data.replyTo.author.firstName,
              lastName: data.replyTo.author.lastName,
              profilePicture: data.replyTo.author.profilePicture,
              university: data.replyTo.author.university,
              isStudent: data.replyTo.author.isStudent,
              email: data.replyTo.author.email,
              joinedAt: new Date(data.replyTo.author.joinedAt || Date.now())
            } as User; // cast ponctuel (données socket déjà sûres)
          }
          replyMeta = {
            id: data.replyTo.id || data.replyTo._id,
            content: data.replyTo.content,
            createdAt: new Date(data.replyTo.createdAt),
            author: replyAuthor
          };
        }

        const newMessage: Message = {
          id: data.id,
          groupId: data.groupId,
          authorId: data.authorId,
          author: data.author,
          content: data.content,
          createdAt: new Date(data.createdAt),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
          replyTo: replyMeta
        };

        setMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        setLastMessages(prev => ({ ...prev, [data.groupId]: newMessage }));
        loadGroups();
      };

      // Gérer les mises à jour de groupes (pour la réapparition de conversations)
      const handleGroupUpdated = () => {
        
        // Recharger les groupes pour synchroniser hiddenFor
        loadGroups();
      };

      // Gérer les exclusions de membres
      const handleMemberRemoved = (data: { groupId: string; removedUserId: string; removedBy: string }) => {
        
        // Si l'utilisateur actuel a été exclu
        if (data.removedUserId === user.id) {
          
          // Quitter la salle WebSocket immédiatement
          if (leaveGroupSocket) {
            leaveGroupSocket(data.groupId);
          }
          
          // Supprimer immédiatement le groupe et ses messages
          setGroups(prev => {
            return prev.filter(group => group.id !== data.groupId);
          });
          setMessages(prev => prev.filter(msg => msg.groupId !== data.groupId));
          
          // Nettoyer la pagination
          setMessagePagination(prev => {
            const newPagination = { ...prev };
            delete newPagination[data.groupId];
            return newPagination;
          });
          
          // Afficher un message d'information
          setError('Vous avez été exclu d\'un groupe par un administrateur');
          
          // Forcer un rechargement des groupes pour s'assurer de la synchronisation
          setTimeout(() => {
            loadGroups();
          }, 500);
        } else {
          // Mettre à jour la liste des membres du groupe
          setGroups(prev => prev.map(group => 
            group.id === data.groupId 
              ? { ...group, members: group.members.filter(member => member.id !== data.removedUserId) }
              : group
          ));
        }
      };

      const handleMessageDeleted = (data: { messageId: string; groupId: string }) => {
        // Supprimer le message de la liste
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      };

      const handleMessagesUpdated = (data: { groupId: string; messages: any[] }) => {
        // Remplacer tous les messages du groupe avec la nouvelle liste
        const formattedMessages = data.messages.map((msg: any) => ({
          ...msg,
          id: msg._id,
          // Gérer les messages système qui n'ont pas d'authorId
          authorId: msg.authorId ? (msg.authorId._id || msg.authorId) : null,
          author: msg.authorId ? {
            id: msg.authorId._id || msg.authorId._id,
            username: msg.authorId.username || msg.authorId.username,
            firstName: msg.authorId.firstName || msg.authorId.firstName,
            lastName: msg.authorId.lastName || msg.authorId.lastName,
            profilePicture: msg.authorId.profilePicture || msg.authorId.profilePicture
          } : null, // Messages système sans auteur
          createdAt: new Date(msg.createdAt),
          updatedAt: msg.updatedAt ? new Date(msg.updatedAt) : undefined
        }));

        setMessages(prev => [
          ...prev.filter(msg => msg.groupId !== data.groupId),
          ...formattedMessages
        ]);
        
        // Mettre à jour le dernier message pour ce groupe
        if (formattedMessages.length > 0) {
          const latestMessage = formattedMessages.reduce((latest: Message, current: Message) => 
            current.createdAt > latest.createdAt ? current : latest
          );
          setLastMessages(prev => ({
            ...prev,
            [data.groupId]: latestMessage
          }));
        }
      };

      // Enregistrer tous les event handlers
      socket.on('new-message', handleNewMessage);
      socket.on('groupUpdated', handleGroupUpdated);
      socket.on('member-removed', handleMemberRemoved);
      socket.on('message-deleted', handleMessageDeleted);
      socket.on('messages-updated', handleMessagesUpdated);

      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('groupUpdated', handleGroupUpdated);
        socket.off('member-removed', handleMemberRemoved);
        socket.off('message-deleted', handleMessageDeleted);
        socket.off('messages-updated', handleMessagesUpdated);
      };
    }
  }, [socket, user, groups, leaveGroupSocket]);

  // Ecoute temps réel des réactions
  useEffect(() => {
    if (!socket) return;
    const onAdded = (payload: { messageId: string; emoji: string; userId: string; groupId: string }) => {
      setMessages(prev => prev.map(m => {
        if (m.id !== payload.messageId) return m;
        const reactions = { ...(m.reactions || {}) } as any;
        const entry = reactions[payload.emoji] || { users: [], count: 0 };
        if (!entry.users.includes(payload.userId)) {
          entry.users = [...entry.users, payload.userId];
          entry.count = entry.users.length;
        }
        reactions[payload.emoji] = entry;
        return { ...m, reactions };
      }));
    };
    const onRemoved = (payload: { messageId: string; emoji: string; userId: string; groupId: string }) => {
      setMessages(prev => prev.map(m => {
        if (m.id !== payload.messageId) return m;
        if (!m.reactions || !m.reactions[payload.emoji]) return m;
        const reactions = { ...(m.reactions) } as any;
        const entry = { ...reactions[payload.emoji] };
        entry.users = entry.users.filter((id: string) => id !== payload.userId);
        entry.count = entry.users.length;
        if (entry.count === 0) {
          delete reactions[payload.emoji];
        } else {
          reactions[payload.emoji] = entry;
        }
        return { ...m, reactions };
      }));
    };
    socket.on('reaction-added', onAdded);
    socket.on('reaction-removed', onRemoved);
    return () => {
      socket.off('reaction-added', onAdded);
      socket.off('reaction-removed', onRemoved);
    };
  }, [socket]);

  // Fonctions pour les groupes
  const getVisibleGroups = () => {
    if (!user) return [];
    return groups.filter(group => !group.hiddenFor?.includes(user.id));
  };

  const createGroup = async (name: string, description: string, isPrivate = false, selectedMembers: string[] = []) => {
    try {
      const response = await groupsAPI.createGroup({
        name,
        description,
        isPrivate,
        selectedMembers
      });
      
      if (response.success) {
        await loadGroups(); // Recharger les groupes
      } else {
        throw new Error(response.message || 'Erreur lors de la création du groupe');
      }
    } catch (err) {
      setError('Erreur lors de la création du groupe');
      throw err;
    }
  };

  const updateGroup = async (groupId: string, name: string, description: string) => {
    try {
      const response = await groupsAPI.updateGroup(groupId, { name, description });
      if (response.success) {
        await loadGroups();
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour du groupe');
      throw err;
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const response = await groupsAPI.deleteGroup(groupId);
      if (response.success) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        setMessages(prev => prev.filter(msg => msg.groupId !== groupId));
      }
    } catch (err) {
      setError('Erreur lors de la suppression du groupe');
      throw err;
    }
  };

  // Fonctions pour les membres
  const addMemberToGroup = async (groupId: string, userId: string) => {
    try {
      const response = await groupsAPI.addMember(groupId, userId);
      if (response.success) {
        await loadGroups();
      }
    } catch (err) {
      setError('Erreur lors de l\'ajout du membre');
      throw err;
    }
  };

  const removeMemberFromGroup = async (groupId: string, userId: string) => {
    try {
      const response = await groupsAPI.removeMember(groupId, userId);
      if (response.success) {
        await loadGroups();
        
        // Émettre un événement WebSocket pour notifier l'exclusion
        if (socket && user) {
          socket.emit('member-removed', {
            groupId: groupId,
            removedUserId: userId,
            removedBy: user.id
          });
        }
        
        // Si l'utilisateur exclu est l'utilisateur actuel, supprimer les messages locaux de ce groupe
        if (user && userId === user.id) {
          setMessages(prev => prev.filter(msg => msg.groupId !== groupId));
        }
      }
    } catch (err) {
      setError('Erreur lors de la suppression du membre');
      throw err;
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      const response = await groupsAPI.leaveGroup(groupId);
      if (response.success) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        setMessages(prev => prev.filter(msg => msg.groupId !== groupId));
      }
    } catch (err) {
      setError('Erreur lors de la sortie du groupe');
      throw err;
    }
  };

  // Fonctions pour les messages
  const getMessages = (groupId: string) => {
    // NE PLUS charger automatiquement - cela cause setState pendant le rendu
    // La charge doit être faite explicitement par les useEffect
    return messages.filter(msg => msg.groupId === groupId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  };

  const sendMessage = async (groupId: string, content: string, replyToId?: string) => {
    // Vérifier si l'utilisateur est toujours membre du groupe
    if (!isUserMemberOfGroup(groupId)) {
      setError('Vous n\'êtes plus membre de ce groupe');
      throw new Error('Non membre du groupe');
    }

    try {
      // Extraire éventuel pattern [REPLY:id] pour envoyer replyToId séparé
  const response = await messagesAPI.createMessage({ groupId, content, replyToId });
      if (response.success) {
        // NE PAS ajouter le message localement - l'événement WebSocket s'en charge
        // Cela évite la duplication de messages
      }
    } catch (err) {
      setError('Erreur lors de l\'envoi du message');
      throw err;
    }
  };

  const updateMessage = async (messageId: string, content: string) => {
    try {
      const response = await messagesAPI.updateMessage(messageId, content);
      if (response.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                content, 
                // Utiliser l'updatedAt du serveur pour une synchronisation précise
                updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date()
              }
            : msg
        ));
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour du message');
      throw err;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await messagesAPI.deleteMessage(messageId);
      if (response.success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (err) {
      setError('Erreur lors de la suppression du message');
      throw err;
    }
  };

  // Fonctions de partage
  const sharePost = async (groupId: string, postId: string, content?: string) => {
    try {
      const response = await messagesAPI.sharePost(groupId, postId, content);
      if (response.success) {
        await loadMessages(groupId);
      }
    } catch (err) {
      setError('Erreur lors du partage du post');
      throw err;
    }
  };

  const shareFolder = async (groupId: string, folderId: string, content?: string) => {
    try {
      const response = await messagesAPI.shareFolder(groupId, folderId, content);
      if (response.success) {
        await loadMessages(groupId);
      }
    } catch (err) {
      setError('Erreur lors du partage du dossier');
      throw err;
    }
  };

  const sharePdf = async (groupId: string, pdfData: any, content?: string) => {
    try {
      const response = await messagesAPI.sharePdf(groupId, pdfData, content);
      if (response.success) {
        await loadMessages(groupId);
      }
    } catch (err) {
      setError('Erreur lors du partage du PDF');
      throw err;
    }
  };

  // Fonctions utilitaires
  const createPrivateChat = async (otherUserId: string) => {
    await createGroup('Chat privé', 'Conversation privée', true, [otherUserId]);
  };

  // Nouvelles fonctions pour les conversations privées
  const getPrivateConversations = (): PrivateConversation[] => {
    return privateConversations;
  };

  const createOrGetPrivateConversation = async (otherUserId: string): Promise<string> => {
    if (!user) throw new Error('Utilisateur non connecté');
    
    // Chercher une conversation existante avec cet utilisateur
    const existingConversation = privateConversations.find(conv => 
      conv.participants.some(p => p.id === otherUserId)
    );
    
    if (existingConversation) {
      return existingConversation.id;
    }
    
    // Pour l'instant, on créé encore un groupe privé (transition progressive)
    // TODO: Créer une vraie conversation privée via une nouvelle API
    await createGroup('Chat privé', 'Conversation privée', true, [otherUserId]);
    
    // Retourner l'ID du nouveau groupe créé
    await loadGroups();
    const newGroup = groups.find(g => 
      g.isPrivate && 
      g.members.length === 2 && 
      g.members.some(m => m.id === otherUserId)
    );
    
    return newGroup?.id || '';
  };

  const getPrivateConversationByUserId = (otherUserId: string): PrivateConversation | null => {
    return privateConversations.find(conv => 
      conv.participants.some(p => p.id === otherUserId)
    ) || null;
  };

  const getAllChats = (): ChatItem[] => {
    return [...groups, ...privateConversations];
  };

  const getChatById = (chatId: string): ChatItem | null => {
    const group = groups.find(g => g.id === chatId);
    if (group) return group;
    
    const conversation = privateConversations.find(c => c.id === chatId);
    if (conversation) return conversation;
    
    return null;
  };

  const getChatDisplayName = (chat: ChatItem, currentUserId: string): string => {
    if (isPrivateConversation(chat)) {
      // Pour une conversation privée, afficher le nom de l'autre participant
      const otherParticipant = chat.participants.find(p => p.id !== currentUserId);
      return otherParticipant?.username || 'Utilisateur inconnu';
    } else {
      // Pour un groupe, afficher le nom du groupe
      return chat.name;
    }
  };

  const toggleGroupNotifications = async (groupId: string, enabled: boolean) => {
    try {
      const response = await groupsAPI.toggleNotifications(groupId, enabled);
      if (response.success) {
        await loadGroups();
      }
    } catch (err) {
      setError('Erreur lors de la modification des notifications');
      throw err;
    }
  };

  const hideConversation = async (groupId: string) => {
    try {
      const response = await groupsAPI.hideGroup(groupId);
      if (response.success) {
        await loadGroups();
      }
    } catch (err) {
      setError('Erreur lors du masquage de la conversation');
      throw err;
    }
  };

  const getAvailableUsersForGroup = (_groupId: string): User[] => {
    // Cette fonction devrait retourner les utilisateurs disponibles
    // Pour l'instant, retournons un tableau vide
    return [];
  };

  const canManageGroup = (groupId: string): boolean => {
    if (!user) return false;
    const group = groups.find(g => g.id === groupId);
    if (!group) return false;
    return group.adminId === user.id || group.moderatorIds.includes(user.id);
  };

  const isUserBlocked = (_userId: string): boolean => {
    // Implémentation du blocage à faire
    return false;
  };

  const getBlockedMembersInGroup = (_groupId: string): User[] => {
    // Implémentation du blocage à faire
    return [];
  };

  // Fonction pour vérifier si on peut charger plus de messages
  const canLoadMoreMessages = (groupId: string) => {
    const pagination = messagePagination[groupId];
    return pagination ? pagination.hasMore && !pagination.loading : false;
  };

  // Fonction pour vérifier si les messages sont en cours de chargement
  const isLoadingMessages = (groupId: string) => {
    const pagination = messagePagination[groupId];
    return pagination ? pagination.loading : false;
  };

  const getStorageUsage = async (): Promise<{ used: number; total: number }> => {
    // Pas applicable pour l'API, retourner des valeurs par défaut
    return { used: 0, total: 0 };
  };

  // Méthodes stub pour les fonctionnalités manquantes
  const updateGroupPicture = async (groupId: string, pictureData: FormData | string): Promise<void> => {
    console.log('🚀 updateGroupPicture APPELÉE !', { groupId, dataType: typeof pictureData });
    
    try {
      let profilePicture: string;
      
      if (typeof pictureData === 'string') {
        profilePicture = pictureData;
      } else {
        // Si c'est FormData, il faut le convertir en base64
        const file = pictureData.get('profilePicture') as File;
        if (file) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
          profilePicture = base64;
        } else {
          throw new Error('Aucune image fournie');
        }
      }

      console.log('🖼️ Mise à jour photo du groupe:', groupId);
      console.log('📷 Taille de l\'image:', profilePicture.length, 'caractères');

      // Appeler l'API pour mettre à jour la photo du groupe
      const response = await groupsAPI.updateGroupPicture(groupId, profilePicture);
      console.log('✅ Réponse API:', response);
      
      // Mettre à jour le groupe local
      setGroups(prevGroups => {
        const updatedGroups = prevGroups.map(group => 
          group.id === groupId 
            ? { ...group, profilePicture }
            : group
        );
        console.log('📝 Groupes mis à jour:', updatedGroups.find(g => g.id === groupId));
        return updatedGroups;
      });

      // Forcer la mise à jour des données depuis le serveur pour s'assurer de la synchronisation
      setTimeout(() => {
        loadGroups();
      }, 1000);

      // Émettre un événement personnalisé pour forcer le rafraîchissement de l'image
      window.dispatchEvent(new CustomEvent('groupPhotoUpdated', { 
        detail: { groupId, profilePicture } 
      }));
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la photo du groupe:', error);
      throw error;
    }
  };

  const getMessageDeletionInfo = (messageId: string): any => {
    // Trouver le message
    const message = messages.find(msg => msg.id === messageId);
    if (!message) {
      return {
        canDelete: false,
        isModeratedDeletion: false,
        isOwnMessage: false
      };
    }
    
    // Vérifier si c'est son propre message
    const isOwnMessage = message.authorId === user?.id;
    
    // Vérifier si l'utilisateur peut modérer (admin/modérateur du groupe)
    const canModerate = canManageGroup(message.groupId);
    
    // On peut supprimer si c'est son message OU si on peut modérer
    const canDelete = isOwnMessage || canModerate;
    
    return {
      canDelete,
      isModeratedDeletion: !isOwnMessage && canModerate,
      isOwnMessage
    };
  };

  const addReaction = async (_messageId: string, _emoji: string): Promise<void> => {
    if (!_messageId || !_emoji || !user) {
      return;
    }
    try {
      // Optimistic update
      setMessages(prev => prev.map(m => {
        if (m.id !== _messageId) return m;
        const reactions = { ...(m.reactions || {}) } as any;
        const entry = reactions[_emoji] || { users: [], count: 0 };
        if (!entry.users.includes(user.id)) {
          entry.users = [...entry.users, user.id];
          entry.count = entry.users.length;
        }
        reactions[_emoji] = entry;
        return { ...m, reactions };
      }));
      await messagesAPI.addReaction(_messageId, _emoji);
  // Inform other parts (e.g. MessagingPage recent emojis) that an emoji was used
  try { window.dispatchEvent(new CustomEvent('emoji-used', { detail: { emoji: _emoji, source: 'reaction' } })); } catch(_) {}
    } catch (err) {
      // Revert on failure by refetching message list later (minimal handling)
      setError('Erreur lors de l\'ajout de la réaction');
    }
  };

  const removeReaction = async (_messageId: string, _emoji: string): Promise<void> => {
    if (!_messageId || !_emoji || !user) return;
    try {
      setMessages(prev => prev.map(m => {
        if (m.id !== _messageId) return m;
        if (!m.reactions || !m.reactions[_emoji]) return m;
        const reactions = { ...(m.reactions) } as any;
        const entry = { ...reactions[_emoji] };
        entry.users = entry.users.filter((id: string) => id !== user.id);
        entry.count = entry.users.length;
        if (entry.count === 0) {
          delete reactions[_emoji];
        } else {
          reactions[_emoji] = entry;
        }
        return { ...m, reactions };
      }));
      await messagesAPI.removeReaction(_messageId, _emoji);
    } catch (err) {
      setError('Erreur lors du retrait de la réaction');
    }
  };

  const getCurrentUserReaction = (_messageId: string): string | null => {
    if (!user) return null;
    const msg = messages.find(m => m.id === _messageId);
    if (!msg || !msg.reactions) return null;
    for (const [emoji, data] of Object.entries(msg.reactions)) {
      if (data.users.includes(user.id)) return emoji;
    }
    return null;
  };

  const getReactionDetails = (_messageId: string): any => {
    const msg = messages.find(m => m.id === _messageId);
    if (!msg || !msg.reactions) return {};
    // Resolver utilisateur
    const resolveUser = (id: string) => {
      // Chercher dans messages auteurs
      for (const m of messages) {
        if (m.author && m.author.id === id) return m.author;
      }
      // Chercher dans groupes membres
      for (const g of groups) {
        const found = g.members.find(mem => mem.id === id);
        if (found) return found;
      }
      return { id, username: 'Utilisateur', firstName: '', lastName: '' } as any;
    };
    const details: { [emoji: string]: any[] } = {};
    for (const [emoji, data] of Object.entries(msg.reactions)) {
      details[emoji] = data.users.map(resolveUser);
    }
    return details;
  };

  const isGroupAdmin = (groupId: string): boolean => {
    if (!user) return false;
    const group = groups.find(g => g.id === groupId);
    return group ? group.adminId === user.id : false;
  };

  const isGroupModerator = (groupId: string): boolean => {
    if (!user) return false;
    const group = groups.find(g => g.id === groupId);
    return group ? group.moderatorIds?.includes(user.id) || false : false;
  };

  const promoteModerator = async (groupId: string, targetUserId: string): Promise<void> => {
    try {
      await groupsAPI.promoteModerator(groupId, targetUserId);
      // Mise à jour locale immédiate
      setGroups(prev => prev.map(g => {
        if (g.id !== groupId) return g;
        const existing = g.moderatorIds || [];
        if (existing.includes(targetUserId)) return g; // déjà présent
        const updated = { ...g, moderatorIds: [...existing, targetUserId] } as any;
        // Pour compat compatibilité éventuelle avec _moderatorIds
        updated._moderatorIds = updated.moderatorIds;
        return updated;
      }));
    } catch (err) {
      setError('Erreur lors de la promotion en modérateur');
      throw err;
    }
  };

  const demoteModerator = async (groupId: string, targetUserId: string): Promise<void> => {
    try {
      await groupsAPI.demoteModerator(groupId, targetUserId);
      setGroups(prev => prev.map(g => {
        if (g.id !== groupId) return g;
        const existing = g.moderatorIds || [];
        if (!existing.includes(targetUserId)) return g; // déjà retiré
        const updatedList = existing.filter(id => id !== targetUserId);
        const updated = { ...g, moderatorIds: updatedList } as any;
        updated._moderatorIds = updatedList;
        return updated;
      }));
    } catch (err) {
      setError('Erreur lors de la rétrogradation du modérateur');
      throw err;
    }
  };

  const kickMember = async (groupId: string, userId: string): Promise<void> => {
    // Utiliser removeMemberFromGroup comme fallback
    await removeMemberFromGroup(groupId, userId);
  };

  // Méthodes ajoutées pour corriger les erreurs de compilation
  const deleteHistory = async (groupId: string): Promise<void> => {
    if (!groupId) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${groupId}/delete-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'historique');
      }

      // Recharger les messages pour refléter la suppression de l'historique
      await loadMessages(groupId);
      // Recharger aussi les conversations pour mettre à jour le dernier message affiché
      await loadGroups();
      
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique:', error);
      throw error;
    }
  };

  const markGroupAsRead = (groupId: string): void => {
    // Marquer la conversation comme lue maintenant
    const newTimestamps = {
      ...lastReadTimestamps,
      [groupId]: new Date()
    };
    
    setLastReadTimestamps(newTimestamps);
    
    // Sauvegarder dans localStorage pour persistance
    try {
      localStorage.setItem('messageReadTimestamps', JSON.stringify(newTimestamps));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde des timestamps:', error);
    }
  };

  const getUnreadMessagesCount = (groupId: string): number => {
    // Vérifier si les notifications sont désactivées pour ce groupe
    if (user?.id) {
      const group = groups.find(g => g.id === groupId);
      if (group && group.notificationsEnabled?.[user.id] === false) {
        return 0; // Si les notifications sont désactivées, retourner 0
      }
    }
    
    // Obtenir les messages du groupe via la fonction existante
    const groupMessages = messages.filter(msg => msg.groupId === groupId);
    
    // Si pas de messages, pas de non-lus
    if (groupMessages.length === 0) return 0;
    
    // Obtenir le timestamp de dernière lecture pour ce groupe
    const lastReadTime = lastReadTimestamps[groupId];
    
    // Si pas de timestamp, utiliser les 24 dernières heures par défaut
    const cutoffTime = lastReadTime || (() => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return oneDayAgo;
    })();
    
    return groupMessages.filter((msg: Message) => {
      // Ne pas compter ses propres messages
      if (msg.authorId === user?.id) return false;
      
      // Compter seulement les messages après la dernière lecture
      const messageDate = new Date(msg.createdAt);
      return messageDate > cutoffTime;
    }).length;
  };

  const getTotalUnreadMessagesCount = (): number => {
    // Sommer tous les messages non lus de tous les groupes
    return groups.reduce((total, group) => {
      return total + getUnreadMessagesCount(group.id);
    }, 0);
  };

  const value: MessagingContextType = {
    groups,
    privateConversations,
    messages,
    loading,
    error,
    lastMessages,
    getVisibleGroups,
    getPrivateConversations,
    createOrGetPrivateConversation,
    getPrivateConversationByUserId,
    getAllChats,
    getChatById,
    getChatDisplayName,
    createGroup,
    updateGroup,
    updateGroupPicture,
    deleteGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    leaveGroup,
    getMessages,
    loadMessages,
    loadMoreMessages,
  sendMessage,
    updateMessage,
    deleteMessage,
    getMessageDeletionInfo,
    addReaction,
    removeReaction,
    getCurrentUserReaction,
    getReactionDetails,
    canLoadMoreMessages,
    isLoadingMessages,
    sharePost,
    shareFolder,
    sharePdf,
    createPrivateChat,
    toggleGroupNotifications,
    hideConversation,
    getAvailableUsersForGroup,
    canManageGroup,
    isUserBlocked,
    getBlockedMembersInGroup,
    isUserMemberOfGroup,
    isGroupAdmin,
    isGroupModerator,
    promoteModerator,
    demoteModerator,
    kickMember,
    getStorageUsage,
    deleteHistory,
    markGroupAsRead,
    getUnreadMessagesCount,
    getTotalUnreadMessagesCount
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export default MessagingContext;
