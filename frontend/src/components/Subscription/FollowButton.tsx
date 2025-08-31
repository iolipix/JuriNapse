import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Users, Check, Shield } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';

interface FollowButtonProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showBlockButton?: boolean;
  onBlock?: () => void;
  onFollowChange?: (isFollowing: boolean) => void; // Nouveau callback
}

const FollowButton: React.FC<FollowButtonProps> = ({ 
  userId, 
  size = 'md', 
  showBlockButton = false,
  onBlock,
  onFollowChange // Nouveau callback
}) => {
  const { 
    followUser, 
    unfollowUser, 
    isFollowing, 
    isFollowingSync,
    isConnection,
    blockUser,
    subscriptions,
    followers,
    invalidateCache
  } = useSubscription();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [following, setFollowing] = useState(false);
  const [connection, setConnection] = useState(false);
  const [isFollowBack, setIsFollowBack] = useState(false);

  // Charger le statut de suivi au montage et à chaque changement des abonnements
  useEffect(() => {
    const loadFollowStatus = async () => {
      // Ne pas recharger si une action est en cours
      if (isLoading) {        return;
      }

      try {        
        // Utiliser d'abord le cache synchrone, puis vérifier async si nécessaire
        const isFollowingSyncValue = isFollowingSync(userId);
        setFollowing(isFollowingSyncValue);
        setConnection(isConnection(userId));
        
        // Vérifier si c'est un cas de "Suivre en retour"
        // L'utilisateur nous suit (il est dans nos followers) mais on ne le suit pas
        const userFollowsMe = followers.some(follower => 
          (follower.id && follower.id === userId) ||
          (follower.username && follower.username === userId)
        );
        setIsFollowBack(userFollowsMe && !isFollowingSyncValue);
        
        // Double-vérification asynchrone seulement si nécessaire
        const isFollowingUser = await isFollowing(userId);
        if (isFollowingUser !== isFollowingSyncValue) {          setFollowing(isFollowingUser);
          invalidateCache(); // Forcer la resynchronisation
        }      } catch (error) {      }
    };

    if (userId) {
      loadFollowStatus();
    }
  }, [userId, isFollowing, isConnection, subscriptions, followers, invalidateCache]); // Ajouter followers comme déclencheur

  // Auto-hide success message
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  if (!user || userId === user.id) {
    return null;
  }

  const handleFollow = async () => {
    // Vérifier si déjà en cours de traitement
    if (isLoading) {      return;
    }
    
    setIsLoading(true);
    
    try {      
      if (following) {
        // Vérifier si l'utilisateur est toujours suivi avant de désabonner
        if (!isFollowingSync(userId)) {          setFollowing(false);
          return;
        }
        
        const success = await unfollowUser(userId);
        if (success) {
          // Mettre à jour l'état local seulement après succès
          setFollowing(false);
          setShowSuccessMessage('Vous ne suivez plus cet utilisateur');          // Notifier le parent du changement
          if (onFollowChange) {
            onFollowChange(false);
          }
        } else {        }
      } else {
        // Vérifier si l'utilisateur n'est pas déjà suivi avant d'abonner
        if (isFollowingSync(userId)) {          setFollowing(true);
          return;
        }
        
        const success = await followUser(userId);
        if (success) {
          // Mettre à jour l'état local seulement après succès
          setFollowing(true);
          setShowSuccessMessage('Utilisateur suivi avec succès !');          // Notifier le parent du changement
          if (onFollowChange) {
            onFollowChange(true);
          }
        } else {          // Forcer la synchronisation en cas d'échec
          invalidateCache();
        }
      }
    } catch (error) {      // En cas d'erreur, forcer la resynchronisation
      invalidateCache();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlock = async () => {
    setIsLoading(true);
    try {
      await blockUser(userId);
      setShowSuccessMessage('Utilisateur bloqué avec succès !');
      if (onBlock) {
        onBlock();
      }
    } catch (error) {
      // Gestion d'erreur silencieuse
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getButtonContent = () => {
    if (connection) {
      return (
        <>
          {isHovered ? <UserMinus className="h-4 w-4" /> : <Users className="h-4 w-4" />}
          <span>{isHovered ? 'Ne plus suivre' : 'Connexion'}</span>
        </>
      );
    }
    
    if (following) {
      return (
        <>
          <UserMinus className="h-4 w-4" />
          <span>Se désabonner</span>
        </>
      );
    }
    
    // Si c'est un cas de "Suivre en retour" (l'utilisateur nous suit mais on ne le suit pas)
    if (isFollowBack) {
      return (
        <>
          <UserPlus className="h-4 w-4" />
          <span>Suivre en retour</span>
        </>
      );
    }
    
    return (
      <>
        <UserPlus className="h-4 w-4" />
        <span>Suivre</span>
      </>
    );
  };

  const getButtonClasses = () => {
    const baseClasses = `${getSizeClasses()} rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`;
    
    if (connection) {
      if (isHovered) {
        return `${baseClasses} bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700`;
      }
      return `${baseClasses} bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700`;
    }
    
    if (following) {
      return `${baseClasses} bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-700`;
    }
    
    // Style spécial pour "Suivre en retour" - gradient bleu vers violet
    if (isFollowBack) {
      return `${baseClasses} bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg`;
    }
    
    return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleFollow}
        disabled={isLoading}
        className={getButtonClasses()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {getButtonContent()}
      </button>
      
      {showBlockButton && (
        <button
          onClick={handleBlock}
          disabled={isLoading}
          className={`${getSizeClasses()} rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 bg-red-100 text-red-700 hover:bg-red-200`}
        >
          <Shield className="h-4 w-4" />
          <span>Bloquer</span>
        </button>
      )}
      
      {/* Message de succès */}
      {showSuccessMessage && (
        <div className="fixed top-6 right-6 z-50 transform transition-all">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3">
            <div className="bg-white/20 p-1 rounded-full">
              <Check className="h-4 w-4" />
            </div>
            <span className="font-medium">{showSuccessMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowButton;