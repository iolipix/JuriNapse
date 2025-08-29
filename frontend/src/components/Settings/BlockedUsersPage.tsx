import React, { useState, useEffect } from 'react';
import { Shield, User, Unlock, Check, ArrowLeft } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { secureLogger } from '../../utils/logger';

interface BlockedUsersPageProps {
  onBack?: () => void;
}

const BlockedUsersPage: React.FC<BlockedUsersPageProps> = ({ onBack }) => {
  const { getBlockedUsers, unblockUser } = useSubscription();
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBlockedUsers().catch(console.error);
    }
  }, [user]);

  // Auto-hide success message
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Auto-hide error message
  useEffect(() => {
    if (showErrorMessage) {
      const timer = setTimeout(() => {
        setShowErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showErrorMessage]);

  const loadBlockedUsers = async () => {
    try {      const blocked = await getBlockedUsers();
      setBlockedUsers(blocked);
    } catch (error) {
      secureLogger.error('❌ Erreur lors du chargement des utilisateurs bloqués:', error);
      setShowErrorMessage('Erreur lors du chargement des utilisateurs bloqués');
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      if (!userId) {
        secureLogger.error('❌ userId est null/undefined');
        setShowErrorMessage('ID utilisateur manquant');
        return;
      }
      
      // Mise à jour optimiste immédiate - retirer l'utilisateur de l'affichage
      setBlockedUsers(prevUsers => {
        const filteredUsers = prevUsers.filter((user: any) => {
          const userIdMatch = user.id !== userId;
          const userIdStrMatch = !user._id || user._id.toString() !== userId;
          const usernameMatch = user.username !== userId;
          
          // Garder l'utilisateur seulement si tous les champs ne correspondent pas
          return userIdMatch && userIdStrMatch && usernameMatch;
        });
        
        return filteredUsers;
      });
      
      // Fermer immédiatement le modal de confirmation
      setShowUnblockConfirm(null);
      
      const result = await unblockUser(userId);
      
      if (result === true) {
        setShowSuccessMessage('Utilisateur débloqué avec succès !');
        
        // NE PAS recharger la liste - garder la mise à jour optimiste
      } else {
        // Si le déblocage a échoué, on doit remettre l'utilisateur dans la liste
        await loadBlockedUsers();
        setShowErrorMessage('Échec du déblocage de l\'utilisateur');
      }
    } catch (error: any) {
      secureLogger.error('❌ Exception dans handleUnblock:', error);
      
      // En cas d'erreur, remettre l'utilisateur dans la liste
      try {
        await loadBlockedUsers();
      } catch (reloadError) {
        secureLogger.log('⚠️ Erreur rechargement rollback:', reloadError);
      }
      
      setShowUnblockConfirm(null);
      setShowErrorMessage(error.message || 'Erreur lors du déblocage de l\'utilisateur');
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connectez-vous</h3>
          <p className="text-gray-600">
            Vous devez être connecté pour gérer vos utilisateurs bloqués.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Comptes bloqués</h1>
          </div>
        </div>
        <p className="text-gray-600">
          Gérez la liste des utilisateurs que vous avez bloqués. Les utilisateurs bloqués ne peuvent pas voir votre profil ni interagir avec vous.
        </p>
      </div>

      {/* Liste des utilisateurs bloqués */}
      {blockedUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur bloqué</h3>
          <p className="text-gray-600">
            Vous n'avez bloqué aucun utilisateur. Cette liste affichera les utilisateurs que vous bloquez.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {blockedUsers.length} utilisateur{blockedUsers.length > 1 ? 's' : ''} bloqué{blockedUsers.length > 1 ? 's' : ''}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {blockedUsers.map((blockedUser: any, index) => (
              <div key={blockedUser.id || blockedUser._id || blockedUser.username || index} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center overflow-hidden">
                      {blockedUser.profilePicture ? (
                        <img 
                          src={blockedUser.profilePicture} 
                          alt={blockedUser.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    
                    <div>
                      <p className="font-semibold text-gray-900">
                        {blockedUser.firstName} {blockedUser.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        @{blockedUser.username}
                      </p>
                      {blockedUser.university && (
                        <p className="text-xs text-gray-400">
                          {blockedUser.university}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      const userId = blockedUser.id || blockedUser._id || blockedUser.username;
                      setShowUnblockConfirm(userId);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                  >
                    <Unlock className="h-4 w-4" />
                    <span>Débloquer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmation de déblocage */}
      {showUnblockConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <Unlock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Débloquer cet utilisateur
              </h3>
              <p className="text-gray-600 mb-6">
                Cet utilisateur pourra à nouveau voir votre profil et interagir avec vous. Êtes-vous sûr ?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUnblockConfirm(null)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUnblock(showUnblockConfirm)}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                >
                  Débloquer
                </button>
              </div>
            </div>
          </div>
        </div>
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

      {/* Message d'erreur */}
      {showErrorMessage && (
        <div className="fixed top-6 right-6 z-50 transform transition-all">
          <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3">
            <div className="bg-white/20 p-1 rounded-full">
              <span className="font-bold text-sm">!</span>
            </div>
            <span className="font-medium">{showErrorMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockedUsersPage;