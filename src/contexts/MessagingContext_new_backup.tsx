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

export interface Message {
  id: string;
  groupId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isSystemMessage?: boolean; // Ajouté pour les messages système
  isDeleted?: boolean; // Ajouté pour les messages supprimés
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
  sendMessage: (groupId: string, content: string) => Promise<void>;
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
  const [lastMessages] = useState<{ [groupId: string]: Message }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagePagination, setMessagePagination] = useState<{ [groupId: string]: { page: number; hasMore: boolean; loading: boolean } }>({});

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
          notificationsEnabled: group.notificationsEnabled || {}
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
    if (!user) return false;
    
    const group = groups.find(g => g.id === groupId);
    if (!group) return false;
    
    return group.members.some(member => member.id === user.id);
  };

  // Charger les messages d'un groupe
  const loadMessages = useCallback(async (groupId: string, page: number = 1, isLoadMore: boolean = false) => {
    // Vérifier si l'utilisateur est toujours membre du groupe
    if (!isUserMemberOfGroup(groupId)) {
      setError('Vous n\'êtes plus membre de ce groupe');
      return;
    }

    try {
      // Éviter les appels concurrents pour le même groupe
      if (messagePagination[groupId]?.loading) return;
      
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
          authorId: message.authorId._id || message.authorId,
          author: {
            id: message.authorId._id || message.authorId,
            username: message.authorId.username,
            firstName: message.authorId.firstName,
            lastName: message.authorId.lastName,
            profilePicture: message.authorId.profilePicture,
            university: message.authorId.university,
            isStudent: message.authorId.isStudent,
            email: message.authorId.email,
            joinedAt: new Date(message.authorId.createdAt || Date.now())
          },
          content: message.content,
          createdAt: new Date(message.createdAt),
          updatedAt: message.updatedAt ? new Date(message.updatedAt) : undefined,
          sharedPost: message.sharedPost ? {
            id: message.sharedPost.id,
            title: message.sharedPost.title,
            content: message.sharedPost.content,
            author: message.sharedPost.author
          } : undefined,
          sharedFolder: message.sharedFolder,
          sharedPdf: message.sharedPdf
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
        
        // Ajouter le message à la liste
        const newMessage: Message = {
          id: data.id,
          groupId: data.groupId,
          authorId: data.authorId,
          author: data.author,
          content: data.content,
          createdAt: new Date(data.createdAt),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
        };
        
        setMessages(prev => {
          // Éviter les doublons
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });

        // Toujours recharger les groupes pour synchroniser les changements de hiddenFor
        // Le backend peut avoir modifié hiddenFor pour faire réapparaître la conversation
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

      // Enregistrer tous les event handlers
      socket.on('new-message', handleNewMessage);
      socket.on('groupUpdated', handleGroupUpdated);
      socket.on('member-removed', handleMemberRemoved);

      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('groupUpdated', handleGroupUpdated);
        socket.off('member-removed', handleMemberRemoved);
      };
    }
  }, [socket, user, groups, leaveGroupSocket]);

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
    // Charger les messages automatiquement si ils ne sont pas déjà chargés
    const existingMessages = messages.filter(msg => msg.groupId === groupId);
    if (existingMessages.length === 0) {
      loadMessages(groupId);
    }
    return messages.filter(msg => msg.groupId === groupId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  };

  const sendMessage = async (groupId: string, content: string) => {
    // Vérifier si l'utilisateur est toujours membre du groupe
    if (!isUserMemberOfGroup(groupId)) {
      setError('Vous n\'êtes plus membre de ce groupe');
      throw new Error('Non membre du groupe');
    }

    try {
      const response = await messagesAPI.createMessage({ groupId, content });
      if (response.success) {
        const newMessage = {
          id: response.data._id,
          groupId: response.data.groupId,
          authorId: response.data.authorId._id || response.data.authorId,
          author: {
            id: response.data.authorId._id || response.data.authorId,
            username: response.data.authorId.username,
            firstName: response.data.authorId.firstName,
            lastName: response.data.authorId.lastName,
            profilePicture: response.data.authorId.profilePicture,
            university: response.data.authorId.university,
            isStudent: response.data.authorId.isStudent,
            email: response.data.authorId.email,
            joinedAt: new Date(response.data.authorId.createdAt || Date.now())
          },
          content: response.data.content,
          createdAt: new Date(response.data.createdAt),
          updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined
        };
        
        setMessages(prev => [...prev, newMessage]);
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
            ? { ...msg, content, updatedAt: new Date() }
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
  const updateGroupPicture = async (_groupId: string, _pictureData: FormData | string): Promise<void> => {
  };

  const getMessageDeletionInfo = (_messageId: string): any => {
    return null;
  };

  const addReaction = async (_messageId: string, _emoji: string): Promise<void> => {
  };

  const removeReaction = async (_messageId: string, _emoji: string): Promise<void> => {
  };

  const getCurrentUserReaction = (_messageId: string): string | null => {
    return null;
  };

  const getReactionDetails = (_messageId: string): any => {
    return null;
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

  const promoteModerator = async (_groupId: string, _userId: string): Promise<void> => {
  };

  const demoteModerator = async (_groupId: string, _userId: string): Promise<void> => {
  };

  const kickMember = async (groupId: string, userId: string): Promise<void> => {
    // Utiliser removeMemberFromGroup comme fallback
    await removeMemberFromGroup(groupId, userId);
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
    getStorageUsage
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export default MessagingContext;
