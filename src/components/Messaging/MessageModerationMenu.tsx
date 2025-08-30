import React, { useState } from 'react';
import { useMessaging } from '../../contexts/MessagingContext_new';
import { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface MessageModerationMenuProps {
  message: Message;
  groupId: string;
  onClose: () => void;
}

const MessageModerationMenu: React.FC<MessageModerationMenuProps> = ({ 
  message, 
  groupId, 
  onClose 
}) => {
  const { user } = useAuth();
  const { 
    deleteMessage,
    isGroupAdmin,
    isGroupModerator 
  } = useMessaging();
  
  const [loading, setLoading] = useState(false);

  // Logique simple de vérification des droits de suppression
  const isAdmin = isGroupAdmin(groupId);
  const isModerator = isGroupModerator(groupId);
  const isAuthor = message.authorId === user?.id;
  const canDelete = isAuthor || isAdmin || isModerator;

  const handleDeleteMessage = async () => {
    if (!canDelete) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      setLoading(true);
      try {
        await deleteMessage(message.id);
        onClose();
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }
  };

  if (!canDelete && !isAdmin && !isModerator) {
    return null;
  }

  return (
    <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-50 min-w-48">
      <div className="py-1">
        {/* Informations sur le message */}
        <div className="px-4 py-2 border-b bg-gray-50">
          <div className="text-xs text-gray-500">
            Message de {message.author?.firstName || ''} {message.author?.lastName || 'Utilisateur inconnu'}
          </div>
          <div className="text-xs text-gray-400">
            {message.createdAt.toLocaleString()}
          </div>
        </div>

        {/* Actions disponibles */}
        {canDelete && (
          <button
            onClick={handleDeleteMessage}
            disabled={loading}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center space-x-2"
          >
            <span>🗑️</span>
            <span>
              {isAuthor ? 'Supprimer mon message' : 'Supprimer ce message'}
            </span>
          </button>
        )}

        {/* Indicateur de permissions */}
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="text-xs text-gray-500">
            {isAdmin && <div>👑 Administrateur</div>}
            {isModerator && !isAdmin && <div>🛡️ Modérateur</div>}
            {isAuthor && <div>✍️ Auteur du message</div>}
          </div>
        </div>

        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-left text-gray-500 hover:bg-gray-50"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default MessageModerationMenu;
