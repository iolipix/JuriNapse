import { useAuth } from '../contexts/AuthContext';
import { hasRole } from '../utils/roles';

/**
 * Hook pour vérifier si l'utilisateur connecté a un statut premium
 * Retourne true si l'utilisateur est premium, false sinon
 */
export const usePremiumStatus = () => {
  const { user } = useAuth();
  
  return {
    isPremium: user ? hasRole(user, 'premium') : false,
    user
  };
};

export default usePremiumStatus;