import React, { useEffect, useState } from 'react';
import { CheckCircle, Crown, ArrowRight, Loader } from 'lucide-react';
import { stripeAPI } from '../../services/api';

const PremiumSuccessPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      verifySession(sessionId);
    } else {
      setLoading(false);
    }
  }, []);

  const verifySession = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await stripeAPI.verifySession(sessionId);
      if (response.success) {
        setVerified(true);
      }
    } catch (error: any) {
      console.error('Erreur vérification session:', error);
      setError('Erreur lors de la vérification du paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleManageSubscription = () => {
    window.location.href = '/premium';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Vérification du paiement...
            </h2>
            <p className="text-gray-600">
              Nous vérifions votre abonnement, veuillez patienter.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icône de succès */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          {/* Titre */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🎉 Bienvenue dans JuriNapse Premium !
          </h1>

          {/* Message de succès */}
          {verified ? (
            <div className="space-y-4 mb-6">
              <p className="text-gray-600">
                Votre abonnement premium a été activé avec succès. 
                Vous pouvez maintenant profiter de toutes les fonctionnalités exclusives !
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Crown className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">
                    Votre période d'essai de 7 jours a commencé
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <p className="text-gray-600">
                Merci pour votre confiance ! Votre abonnement premium est en cours d'activation.
              </p>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Fonctionnalités débloquées */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">
              Fonctionnalités débloquées :
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Badge premium exclusif
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Navigation sans publicité
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Accès anticipé aux nouvelles fonctionnalités
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Support prioritaire
              </li>
            </ul>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <button
              onClick={handleGoHome}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Commencer à explorer</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleManageSubscription}
              className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Gérer mon abonnement
            </button>
          </div>

          {/* Note sur l'essai */}
          <p className="text-xs text-gray-500 mt-4">
            Votre abonnement se renouvellera automatiquement après la période d'essai. 
            Vous pouvez annuler à tout moment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumSuccessPage;