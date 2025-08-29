import React, { useState } from 'react';
import { useMessaging } from '../../contexts/MessagingContext_new';
import { 
  GroupModerationButton, 
  UserRoleBadge,
  MessageModerationMenu 
} from './index';

const MessagingWithModeration: React.FC = () => {
  const { 
    groups, 
    getMessages, 
    sendMessage,
    getVisibleGroups 
  } = useMessaging();
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showModerationMenu, setShowModerationMenu] = useState<string | null>(null);

  const visibleGroups = getVisibleGroups();
  const selectedGroup = selectedGroupId ? groups.find(g => g.id === selectedGroupId) : null;
  const groupMessages = selectedGroupId ? getMessages(selectedGroupId) : [];

  const handleSendMessage = async () => {
    if (selectedGroupId && newMessage.trim()) {
      try {
        await sendMessage(selectedGroupId, newMessage);
        setNewMessage('');
      } catch (error) {
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar des groupes */}
      <div className="w-80 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Groupes</h2>
        </div>
        <div className="overflow-y-auto">
          {visibleGroups.map(group => (
            <div
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedGroupId === group.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {group.profilePicture ? (
                      <img 
                        src={group.profilePicture} 
                        alt={group.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-medium">{group.name[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{group.name}</div>
                    <div className="text-sm text-gray-500">
                      {group.members.length} membres
                    </div>
                  </div>
                </div>
                
                {/* Bouton de modération */}
                <GroupModerationButton group={group} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone de messages */}
      <div className="flex-1 flex flex-col">
        {selectedGroup ? (
          <>
            {/* Header du groupe */}
            <div className="p-4 bg-white border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedGroup.name}</h3>
                <p className="text-sm text-gray-500">{selectedGroup.description}</p>
              </div>
              <GroupModerationButton group={selectedGroup} />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {groupMessages.map(message => (
                <div key={message.id} className="relative group">
                  {message.isDeleted ? (
                    <div className="text-gray-400 italic text-sm bg-gray-50 rounded-lg p-3 border-l-4 border-gray-300">
                      <span className="inline-block mr-2">🗑️</span>
                      {message.deletionReason || 'Message supprimé'}
                    </div>
                  ) : (
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        {message.author?.profilePicture ? (
                          <img 
                            src={message.author.profilePicture} 
                            alt={message.author?.username || 'Utilisateur'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium">
                            {message.author?.firstName?.[0] || message.author?.username?.[0] || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.author?.firstName || ''} {message.author?.lastName || 'Système'}
                          </span>
                          {message.author && <UserRoleBadge user={message.author} group={selectedGroup} />}
                          <span className="text-xs text-gray-500">
                            {message.createdAt.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3">
                          {message.content}
                        </div>
                      </div>
                      
                      {/* Menu de modération */}
                      <div className="relative">
                        <button
                          onClick={() => setShowModerationMenu(
                            showModerationMenu === message.id ? null : message.id
                          )}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                        >
                          ⋯
                        </button>
                        {showModerationMenu === message.id && (
                          <MessageModerationMenu
                            message={message}
                            groupId={selectedGroup.id}
                            onClose={() => setShowModerationMenu(null)}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Zone d'envoi de message */}
            <div className="p-4 bg-white border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Envoyer
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Sélectionnez un groupe pour commencer à discuter
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingWithModeration;
