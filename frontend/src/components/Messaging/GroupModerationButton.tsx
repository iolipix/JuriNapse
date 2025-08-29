import React, { useState } from 'react';
import { useMessaging } from '../../contexts';
import type { Group } from '../../types';
import GroupModerationPanel from './GroupModerationPanel';

interface GroupModerationButtonProps {
  group: Group;
  className?: string;
}

const GroupModerationButton: React.FC<GroupModerationButtonProps> = ({ 
  group, 
  className = '' 
}) => {
  const { isGroupAdmin, isGroupModerator } = useMessaging();
  const [showPanel, setShowPanel] = useState(false);

  const isAdmin = isGroupAdmin(group.id);
  const isModerator = isGroupModerator(group.id);
  const canModerate = isAdmin || isModerator;

  if (!canModerate) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
        title={isAdmin ? 'Gérer le groupe (Administrateur)' : 'Modérer le groupe (Modérateur)'}
      >
        {isAdmin ? (
          <>
            <span>👑</span>
            <span>Gérer</span>
          </>
        ) : (
          <>
            <span>🛡️</span>
            <span>Modérer</span>
          </>
        )}
      </button>

      {showPanel && (
        <GroupModerationPanel 
          groupId={group.id} 
          onClose={() => setShowPanel(false)} 
        />
      )}
    </>
  );
};

export default GroupModerationButton;
