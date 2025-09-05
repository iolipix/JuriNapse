import React from 'react';
import { getHighestRoleBadge, getAllRoleBadges } from '../../utils/roles';

interface User {
  role?: string;
}

interface UserRoleBadgeProps {
  user: User | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showAll?: boolean; // Si true, affiche tous les rôles, sinon juste le plus élevé
}

const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ 
  user, 
  size = 'sm', 
  className = '', 
  showAll = false 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  if (showAll) {
    // Afficher tous les badges de rôles
    const badges = getAllRoleBadges(user);
    
    if (badges.length === 0) return null;
    
    return (
      <div className={`flex gap-1 ${className}`}>
        {badges.map((badge, index) => (
          <span
            key={index}
            className={`
              inline-flex items-center rounded-full font-medium
              ${sizeClasses[size]}
              ${badge.color} bg-opacity-10 border border-current
            `}
          >
            {badge.label}
          </span>
        ))}
      </div>
    );
  } else {
    // Afficher seulement le rôle le plus élevé
    const badge = getHighestRoleBadge(user);
    
    if (!badge) return null;
    
    return (
      <span
        className={`
          inline-flex items-center rounded-full font-medium
          ${sizeClasses[size]}
          ${badge.color} bg-opacity-10 border border-current
          ${className}
        `}
      >
        {badge.label}
      </span>
    );
  }
};

export default UserRoleBadge;
