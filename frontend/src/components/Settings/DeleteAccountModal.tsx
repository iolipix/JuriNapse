import React, { useState } from 'react';
import { X, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  isLoading?: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');

  const handleConfirm = async () => {
    if (step === 'warning') {
      setStep('confirm');
      return;
    }

    console.log('🔐 DELETE MODAL DEBUG: Starting confirmation');
    console.log('🔐 DELETE MODAL DEBUG: password length:', password.length);
    console.log('🔐 DELETE MODAL DEBUG: agreed:', agreed);

    // Validation de la confirmation
    if (!agreed) {
      console.log('🔐 DELETE MODAL DEBUG: Agreement not checked');
      setError('Vous devez confirmer que vous comprenez que cette action est irréversible');
      return;
    }

    if (!password.trim()) {
      console.log('🔐 DELETE MODAL DEBUG: Empty password');
      setError('Veuillez saisir votre mot de passe');
      return;
    }

    console.log('🔐 DELETE MODAL DEBUG: All validations passed, calling onConfirm');
    setError(null);
    
    try {
      await onConfirm(password);
      console.log('🔐 DELETE MODAL DEBUG: onConfirm completed successfully');
      // Le modal sera fermé par le parent après succès
    } catch (err: any) {
      console.error('🔐 DELETE MODAL DEBUG: Error during onConfirm:', err);
      setError(err.message || 'Erreur lors de la suppression du compte');
    }
  };

  const handleClose = () => {
    if (isLoading) return; // Empêcher la fermeture pendant le chargement
    
    // Reset du modal
    setPassword('');
    setAgreed(false);
    setError(null);
    setStep('warning');
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Supprimer le compte
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'warning' ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">
                      Action irréversible
                    </h3>
                    <p className="text-red-600 mt-1">
                      Cette action supprimera définitivement votre compte et toutes vos données.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Ce qui sera supprimé :</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Votre profil et informations personnelles
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Tous vos messages et conversations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Tous vos posts et commentaires
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Vos abonnements et abonnés
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Vos documents et fichiers partagés
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Attention :</strong> Cette action ne peut pas être annulée. 
                  Assurez-vous d'avoir téléchargé toutes vos données importantes avant de continuer.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  <strong>Dernière étape :</strong> Confirmez la suppression de votre compte
                </p>
              </div>

              {/* Password input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saisissez votre mot de passe pour confirmer la suppression définitive
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Checkbox de confirmation */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="confirm-deletion"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                  disabled={isLoading}
                />
                <label htmlFor="confirm-deletion" className="text-sm text-gray-700">
                  Je comprends que cette action est irréversible et que mon compte sera supprimé définitivement
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || (step === 'confirm' && (!password.trim() || !agreed))}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Suppression...
              </>
            ) : step === 'warning' ? (
              'Continuer'
            ) : (
              'Supprimer définitivement'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
