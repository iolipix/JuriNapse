import React from 'react';
import AdBanner from './AdBanner';
import { useAds } from './AdProvider';

interface AdSidebarProps {
  type: 'profile' | 'post';
  className?: string;
  position?: 'right' | 'left';
}

const AdSidebar: React.FC<AdSidebarProps> = ({ 
  type, 
  className = '', 
  position = 'right' 
}) => {
  const { config } = useAds();

  if (!config.enabled) return null;

  // Définir les slots selon le type
  const getSlot = () => {
    switch (type) {
      case 'profile':
        return 'profile-sidebar-001'; // À remplacer par votre vrai slot
      case 'post':
        return 'post-sidebar-001'; // À remplacer par votre vrai slot
      default:
        return 'default-sidebar-001';
    }
  };

  return (
    <div className={`ad-sidebar ${className}`}>
      {/* Bannière rectangulaire standard */}
      <div className="mb-4">
        <AdBanner
          slot={getSlot()}
          size={[300, 250]}
          format="rectangle"
          responsive={true}
          className="mx-auto"
        />
      </div>

      {/* Bannière carrée plus petite si on a de la place */}
      <div className="hidden lg:block">
        <AdBanner
          slot={`${getSlot()}-square`}
          size={[300, 300]}
          format="rectangle"
          responsive={true}
          className="mx-auto"
        />
      </div>
    </div>
  );
};

export default AdSidebar;
