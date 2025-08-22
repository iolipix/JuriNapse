import React from 'react';
import { User } from 'lucide-react';
import { useProfilePicture } from '../../hooks/useProfilePicture';

interface ProfilePictureProps {
  profilePicture?: string | null;
  username?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallbackClassName?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-10 w-10'
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  profilePicture,
  username = '',
  size = 'md',
  className = '',
  fallbackClassName = ''
}) => {
  const fixedProfilePicture = useProfilePicture(profilePicture);

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center overflow-hidden ${className}`}>
      {fixedProfilePicture ? (
        <img 
          src={fixedProfilePicture}
          alt={username}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fallbackIcon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
            if (fallbackIcon) {
              fallbackIcon.classList.remove('hidden');
            }
          }}
        />
      ) : null}
      <User className={`${iconSizes[size]} text-blue-600 fallback-icon ${fixedProfilePicture ? 'hidden' : ''} ${fallbackClassName}`} />
    </div>
  );
};
