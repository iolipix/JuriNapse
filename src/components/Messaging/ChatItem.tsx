import React, { useState } from 'react';
import { BellOff, User, EyeOff } from 'lucide-react';
import SimpleAnimatedGroupAvatar from './SimpleAnimatedGroupAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { User as UserType } from '../../types';

interface ChatItemProps {
  chat: any;
  isActive: boolean;
  unreadCount: number;
  notificationsEnabled: boolean;
  lastMessage: any;
  onChatClick: () => void;
  onLeaveGroup: (chatId: string) => void;
  onViewUserProfile?: (userId: string) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({
  chat,
  isActive,
  unreadCount,
  notificationsEnabled,
  lastMessage,
  onChatClick,
  onLeaveGroup,
  onViewUserProfile
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();

  // Helper function to get the other participant in a private conversation
  const getOtherParticipant = () => {
    if (chat.isPrivate && chat.members && chat.members.length === 2) {
      return chat.members.find((member: UserType) => member.id !== user?.id);
    }
    return null;
  };

  // Helper function to get display name for the chat
  const getChatDisplayName = () => {
    if (chat.isPrivate) {
      const otherParticipant = getOtherParticipant();
      return otherParticipant 
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim() || otherParticipant.username || 'Utilisateur'
        : 'Chat privé';
    }
    return chat.name;
  };

  // Helper function to get profile picture for private chats
  const getChatProfilePicture = () => {
    if (chat.isPrivate) {
      const otherParticipant = getOtherParticipant();
      return otherParticipant?.profilePicture;
    }
    return chat.profilePicture;
  };

  const truncateContent = (content: string, maxLength: number) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        onClick={onChatClick}
        className={`w-full p-3 rounded-lg cursor-pointer transition-colors ${
          isActive ? 'bg-blue-100 border-blue-200' : 'hover:bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Photo de profil cliquable pour les chats privés */}
            {chat.isPrivate ? (
              getChatProfilePicture() ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const otherParticipant = getOtherParticipant();
                    if (otherParticipant && onViewUserProfile) {
                      onViewUserProfile(otherParticipant.id);
                    }
                  }}
                  className="hover:opacity-80 transition-opacity flex-shrink-0"
                >
                  <img 
                    src={(() => {
                      const imageSource = getChatProfilePicture();
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
                    alt={getChatDisplayName()}
                    className="h-10 w-10 object-cover object-center rounded-full"
                  />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const otherParticipant = getOtherParticipant();
                    if (otherParticipant && onViewUserProfile) {
                      onViewUserProfile(otherParticipant.id);
                    }
                  }}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0 hover:bg-blue-200 transition-colors"
                >
                  <User className="h-5 w-5 text-blue-600" />
                </button>
              )
            ) : chat.profilePicture ? (
              <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                <SimpleAnimatedGroupAvatar 
                  src={chat.profilePicture} 
                  alt={chat.name}
                  size="medium"
                  isHovered={isHovered}
                />
              </div>
            ) : (
              <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-semibold text-blue-600">
                  {getChatDisplayName()[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getChatDisplayName()}
                </p>
                {!notificationsEnabled && (
                  <BellOff className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 truncate">
                  {lastMessage ? (
                    lastMessage.sharedPost ? (
                      `${lastMessage.author?.username || 'Utilisateur inconnu'}: a partagé un post`
                    ) : lastMessage.sharedFolder ? (
                      `${lastMessage.author?.username || 'Utilisateur inconnu'}: a partagé un dossier`
                    ) : lastMessage.isDeleted ? (
                      lastMessage.deletionReason || 'Message supprimé'
                    ) : lastMessage.isSystemMessage ? (
                      // Pour les messages système, afficher directement le contenu sans préfixe d'auteur
                      truncateContent(lastMessage.content, 40)
                    ) : (
                      `${lastMessage.author?.username || 'Utilisateur inconnu'}: ${truncateContent(lastMessage.content, 25)}`
                    )
                  ) : (
                    chat.isPrivate 
                      ? 'Aucun message' 
                      : 'Aucun message'
                  )}
                </p>
                {lastMessage && lastMessage.createdAt && (
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                    {formatLastMessageTime(lastMessage.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
      
      {/* Bouton quitter/supprimer conversation */}
      <button
        onClick={() => onLeaveGroup(chat.id)}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
        title={chat.isPrivate ? "Supprimer l'historique de la conversation pour vous" : "Quitter le groupe"}
      >
        <EyeOff className="h-3 w-3" />
      </button>
    </div>
  );
};

export default ChatItem;
