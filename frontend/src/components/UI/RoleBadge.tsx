import React from 'react';
import { UserRole, getRoleBadge } from '../../utils/roles';

interface RoleBadgeProps {
  role: UserRole | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'sm', className = '' }) => {
  const badge = getRoleBadge(role);
  
  if (!badge) return null;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const colorClasses = badge.color === 'text-blue-600' 
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : badge.color === 'text-red-600'
    ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span 
      className={`inline-flex items-center font-medium border rounded-full ${sizeClasses[size]} ${colorClasses} ${className}`}
    >
      {badge.label}
    </span>
  );
};

export default RoleBadge;
