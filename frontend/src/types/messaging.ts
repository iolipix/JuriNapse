import { Group, Message, User } from './';

export interface MessagingContextType {
  groups: Group[];
  messages: Message[];
  lastMessages: { [groupId: string]: Message };
  loading: boolean;
  error: string | null;
  
  // Groupes
  getVisibleGroups: () => Group[];
  loadGroups: () => Promise<void>;
  createGroup: (name: string, description: string, isPrivate?: boolean, selectedMembers?: string[]) => Promise<void>;
  updateGroup: (groupId: string, name: string, description: string) => Promise<void>;
  updateGroupPicture: (groupId: string, pictureData: FormData) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  
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
  
  // Utilitaires
  createPrivateChat: (otherUserId: string) => Promise<void>;
  toggleGroupNotifications: (groupId: string, enabled: boolean) => Promise<void>;
  hideConversation: (groupId: string) => Promise<void>;
  deleteHistory: (groupId: string) => Promise<void>;
  getAvailableUsersForGroup: (groupId: string) => User[];
  canManageGroup: (groupId: string) => boolean;
  isUserBlocked: (userId: string) => boolean;
  getBlockedMembersInGroup: (groupId: string) => User[];
  isUserMemberOfGroup: (groupId: string) => boolean;
  getStorageUsage: () => Promise<{ used: number; total: number }>;
  
  // Polling
  startMessagePolling: (groupId: string) => void;
  stopMessagePolling: () => void;
}
