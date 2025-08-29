import React from 'react';
import { X } from 'lucide-react';
import { User } from '../../types';

interface ReactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reactionDetails: { [emoji: string]: User[] };
  currentUserId: string;
  onRemoveReaction: (emoji: string) => Promise<void>;
  onUserClick?: (userId: string) => void; // Nouvelle prop pour gérer les clics sur utilisateurs
}

export const ReactionModal: React.FC<ReactionModalProps> = ({
  isOpen,
  onClose,
  reactionDetails,
  currentUserId,
  onRemoveReaction,
  onUserClick
}) => {
  if (!isOpen) return null;

  // Fonction pour retirer une réaction
  const handleRemoveReaction = async (emoji: string) => {
    try {
      await onRemoveReaction(emoji);
      
      // Fermer le modal après un court délai pour montrer le changement
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
    }
  };

  // Créer une liste unique d'utilisateurs avec leurs réactions
  const allUsers: { user: User; reactions: string[] }[] = [];
  
  Object.entries(reactionDetails).forEach(([emoji, users]) => {
    users.forEach(user => {
      const existingUser = allUsers.find(u => u.user.id === user.id);
      if (existingUser) {
        existingUser.reactions.push(emoji);
      } else {
        allUsers.push({ user, reactions: [emoji] });
      }
    });
  });

  // Trier pour mettre l'utilisateur actuel en premier
  allUsers.sort((a, b) => {
    if (a.user.id === currentUserId) return -1;
    if (b.user.id === currentUserId) return 1;
    return 0;
  });

  const totalReactions = Object.values(reactionDetails).reduce((total, users) => total + users.length, 0);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          (e.currentTarget as any)._mouseDownOnBackdrop = true;
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && (e.currentTarget as any)._mouseDownOnBackdrop) {
          onClose();
        }
        (e.currentTarget as any)._mouseDownOnBackdrop = false;
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
        style={{
          animation: 'scale-in 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec compteurs - dégradé bleu-violet moderne */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Réactions</h3>
              <div className="flex items-center gap-3 mt-1">
                {Object.entries(reactionDetails).map(([emoji, users]) => (
                  <div key={emoji} className="flex items-center gap-1 text-sm bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    <span>{emoji}</span>
                    <span>{users.length}</span>
                  </div>
                ))}
                <span className="text-sm opacity-80">{totalReactions} au total</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Liste des utilisateurs style WhatsApp */}
        <div className="max-h-80 overflow-y-auto">
          {allUsers.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 text-4xl mb-2">😶</div>
              <p className="text-gray-500 text-sm">Aucune réaction</p>
            </div>
          ) : (
            <div>
              {allUsers.map(({ user, reactions }) => {
                const isCurrentUser = user.id === currentUserId;
                
                return (
                  <div key={user.id} className="border-b border-gray-100 last:border-b-0">
                    <div 
                      className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                        isCurrentUser ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-2 border-indigo-400' : ''
                      }`}
                      onClick={(e) => {
                        // Vérifier si le clic vient du bouton de suppression
                        const target = e.target as HTMLElement;
                        if (target.closest('button[title="Retirer cette réaction"]')) {
                          return;
                        }
                        onUserClick?.(user.id);
                      }}
                      style={{ cursor: isCurrentUser ? 'default' : 'pointer' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-gray-900 ${isCurrentUser ? 'text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text' : ''}`}>
                            {user.firstName} {user.lastName}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs text-indigo-600 font-medium bg-indigo-100 px-2 py-0.5 rounded-full">(Vous)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {user.username}
                        </div>
                      </div>
                      
                      {/* Emojis à droite */}
                      <div className="flex items-center gap-1 ml-3">
                        {reactions.map((emoji, index) => (
                          <div key={index} className="relative">
                            <span className="text-xl">{emoji}</span>
                            {/* Bouton de suppression uniquement pour l'utilisateur actuel */}
                            {isCurrentUser && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRemoveReaction(emoji);
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                                title="Retirer cette réaction"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CSS pour l'animation */}
      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};
