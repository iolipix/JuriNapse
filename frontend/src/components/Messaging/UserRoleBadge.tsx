import React from 'react';
import { Group, User } from '../../types';

interface UserRoleBadgeProps {
  user: User;
  group: Group;
  size?: 'sm' | 'md';
}

const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ 
  user, 
  group, 
  size = 'sm' 
}) => {
  const isAdmin = user.id === group.adminId;
  const isModerator = group.moderatorIds.includes(user.id);

  if (!isAdmin && !isModerator) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1'
  };

  if (isAdmin) {
    return (
      <span className={`inline-flex items-center space-x-1 bg-red-100 text-red-700 rounded-full font-medium ${sizeClasses[size]}`}>
        <span>👑</span>
        <span>Admin</span>
      </span>
    );
  }

  if (isModerator) {
    return (
      <span className={`inline-flex items-center space-x-1 bg-orange-100 text-orange-700 rounded-full font-medium ${sizeClasses[size]}`}>
        <span>🛡️</span>
        <span>Mod</span>
      </span>
    );
  }

  return null;
};

export default UserRoleBadge;
