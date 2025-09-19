import React from 'react';
import { usePremiumStatus } from '../../hooks/usePremiumStatus';

interface SponsoredContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Composant wrapper pour le contenu sponsorisé
 * Masque automatiquement le contenu pour les utilisateurs premium
 */
const SponsoredContent: React.FC<SponsoredContentProps> = ({ 
  children, 
  className = '' 
}) => {
  const { isPremium } = usePremiumStatus();
  
  // Si l'utilisateur est premium, ne pas afficher le contenu sponsorisé
  if (isPremium) {
    return null;
  }
  
  // Afficher le contenu sponsorisé pour les utilisateurs standard
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default SponsoredContent;