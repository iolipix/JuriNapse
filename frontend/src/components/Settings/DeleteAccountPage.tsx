import React, { useState } from 'react';
import { ArrowLeft, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface DeleteAccountPageProps {
  onBack: () => void;
}

const DeleteAccountPage: React.FC<DeleteAccountPageProps> = ({ onBack }) => {
  const { logout } = useAuth();
  const [step, setStep] = useState<'warning' | 'confirm' | 'delete'>('warning');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'SUPPRIMER MON COMPTE') {
      setError('Veuillez saisir exactement "SUPPRIMER MON COMPTE"');
      return;
    }

    if (!password) {
      setError('Veuillez saisir votre mot de passe');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.delete('/auth/delete-account', {
        data: { password }
      });
      
      // Déconnexion automatique
      logout();
      
      // Redirection vers la page d'accueil avec message
      window.location.href = '/?deleted=true';
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la suppression du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const renderWarningStep = () => (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
          <div>
            <h3 className="font-semibold text-red-800 mb-2">
              Attention : Cette action est irréversible
            </h3>
            <p className="text-red-700 text-sm">
              La suppression de votre compte entraînera la perte définitive de toutes vos données.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Ce qui sera supprimé :</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start space-x-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Votre profil et toutes vos informations personnelles</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Toutes vos publications, fiches d'arrêt et contenus créés</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Vos messages privés et conversations</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Vos abonnements et abonnés</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Votre historique d'activité</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Tous vos dossiers et documents</span>
          </li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Alternatives à considérer :</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Désactiver temporairement votre compte</li>
          <li>• Télécharger vos données avant suppression</li>
          <li>• Modifier vos paramètres de confidentialité</li>
          <li>• Contacter notre support pour des questions</li>
        </ul>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={() => setStep('confirm')}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Continuer la suppression
        </button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">
          Pour confirmer la suppression, veuillez saisir exactement le texte suivant :
        </p>
        <p className="font-mono font-bold text-red-900 mt-2 text-center bg-red-100 p-2 rounded">
          SUPPRIMER MON COMPTE
        </p>
      </div>

      <div>
        <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
          Texte de confirmation
        </label>
        <input
          type="text"
          id="confirmText"
          value={confirmText}
          onChange={(e) => {
            setConfirmText(e.target.value);
            setError(null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          placeholder="Saisissez exactement : SUPPRIMER MON COMPTE"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Mot de passe actuel
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 pr-10"
            placeholder="Saisissez votre mot de passe"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={() => setStep('warning')}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={handleDeleteAccount}
          disabled={isLoading || confirmText !== 'SUPPRIMER MON COMPTE' || !password}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Suppression...' : 'Supprimer définitivement'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center space-x-3">
          <Trash2 className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Supprimer le compte</h1>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center space-x-2">
        <div className={`w-4 h-4 rounded-full ${step === 'warning' ? 'bg-red-600' : 'bg-red-300'}`} />
        <div className="flex-1 h-0.5 bg-gray-200">
          <div className={`h-full bg-red-600 transition-all ${step === 'confirm' ? 'w-full' : 'w-0'}`} />
        </div>
        <div className={`w-4 h-4 rounded-full ${step === 'confirm' ? 'bg-red-600' : 'bg-gray-300'}`} />
      </div>

      {/* Content */}
      <div className="bg-white border rounded-lg p-6">
        {step === 'warning' && renderWarningStep()}
        {step === 'confirm' && renderConfirmStep()}
      </div>

      {/* Contact Support */}
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          Besoin d'aide ? <a href="mailto:support@jurinapse.com" className="text-blue-600 hover:underline">Contactez notre support</a>
        </p>
      </div>
    </div>
  );
};

export default DeleteAccountPage;
