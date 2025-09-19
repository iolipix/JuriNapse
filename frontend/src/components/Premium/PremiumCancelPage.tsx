import React from 'react';
import { XCircle, Home, ArrowLeft, CreditCard } from 'lucide-react';

const PremiumCancelPage: React.FC = () => {
  const handleRetry = () => {
    window.location.href = '/premium';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icône d'annulation */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>

          {/* Titre */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Paiement annulé
          </h1>

          {/* Message */}
          <div className="space-y-4 mb-6">
            <p className="text-gray-600">
              Votre paiement a été annulé. Aucun montant n'a été débité de votre compte.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                💡 <strong>Bon à savoir :</strong> Vous pouvez toujours continuer à utiliser 
                JuriNapse gratuitement avec toutes les fonctionnalités de base.
              </p>
            </div>
          </div>

          {/* Avantages premium rappel */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">
              Avec Premium, vous auriez eu :
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CreditCard className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                Badge premium exclusif
              </li>
              <li className="flex items-center">
                <CreditCard className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                Navigation sans publicité
              </li>
              <li className="flex items-center">
                <CreditCard className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                Accès anticipé aux nouvelles fonctionnalités
              </li>
              <li className="flex items-center">
                <CreditCard className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                Support prioritaire
              </li>
            </ul>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Réessayer l'abonnement</span>
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Retour à l'accueil</span>
            </button>
          </div>

          {/* Message d'encouragement */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Changé d'avis ?</strong> L'abonnement premium reste disponible 
              à tout moment avec une période d'essai de 7 jours gratuite.
            </p>
          </div>

          {/* Note de support */}
          <p className="text-xs text-gray-500 mt-4">
            Une question ? Contactez notre support à support@jurinapse.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumCancelPage;