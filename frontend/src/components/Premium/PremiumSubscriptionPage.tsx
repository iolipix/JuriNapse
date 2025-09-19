import React, { useState, useEffect } from 'react';
import { Crown, Check, X, Loader, CreditCard, Shield, Zap, Star, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { stripeAPI } from '../../services/api';

const PremiumSubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les informations d'abonnement au montage
  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = async () => {
    try {
      setLoadingInfo(true);
      const response = await stripeAPI.getSubscriptionInfo();
      if (response.success) {
        setSubscriptionInfo(response.subscription);
      }
    } catch (error: any) {
      console.error('Erreur chargement info abonnement:', error);
      setError('Erreur lors du chargement des informations d\'abonnement');
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await stripeAPI.createCheckoutSession();
      
      if (response.success && response.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = response.url;
      } else {
        throw new Error('Impossible de créer la session de paiement');
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'abonnement:', error);
      setError(error.message || 'Une erreur est survenue lors de la création de l\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await stripeAPI.createPortalSession();
      
      if (response.success && response.url) {
        // Rediriger vers le portail client Stripe
        window.location.href = response.url;
      } else {
        throw new Error('Impossible d\'accéder au portail client');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'ouverture du portail:', error);
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const features = [
    {
      icon: <Crown className="h-5 w-5" />,
      title: 'Badge Premium',
      description: 'Affichez votre statut premium avec un badge exclusif'
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Accès prioritaire',
      description: 'Accès anticipé aux nouvelles fonctionnalités'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Sans publicité',
      description: 'Naviguez sans interruption publicitaire'
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: 'Contenu exclusif',
      description: 'Accès à du contenu juridique premium'
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: 'Support prioritaire',
      description: 'Support client prioritaire et personnalisé'
    }
  ];

  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            JuriNapse Premium
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Débloquez tout le potentiel de JuriNapse avec notre abonnement premium
          </p>
        </div>

        {/* Statut actuel */}
        {subscriptionInfo && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Statut actuel
                </h3>
                <div className="flex items-center space-x-3">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    subscriptionInfo.hasPremium 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {subscriptionInfo.hasPremium ? (
                      <>
                        <Crown className="h-4 w-4 mr-1" />
                        Premium Actif
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Gratuit
                      </>
                    )}
                  </div>
                  {subscriptionInfo.stripeSubscriptionStatus && (
                    <span className="text-sm text-gray-500">
                      ({subscriptionInfo.stripeSubscriptionStatus})
                    </span>
                  )}
                </div>
                {subscriptionInfo.premiumExpiresAt && (
                  <p className="text-sm text-gray-600 mt-1">
                    Expire le {formatDate(subscriptionInfo.premiumExpiresAt)}
                  </p>
                )}
              </div>
              {subscriptionInfo.hasPremium && subscriptionInfo.stripeCustomerId && (
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Gérer l'abonnement
                </button>
              )}
            </div>
          </div>
        )}

        {/* Plan d'abonnement */}
        {!subscriptionInfo?.hasPremium && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-yellow-200 p-8 mb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Plan Premium
              </h2>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-4xl font-bold text-gray-900">9,99€</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
                <Check className="h-4 w-4 mr-1" />
                7 jours d'essai gratuit
              </div>
            </div>

            {/* Fonctionnalités */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bouton d'abonnement */}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Chargement...</span>
                </>
              ) : (
                <>
                  <span>Commencer l'essai gratuit</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Annulable à tout moment. Aucun engagement.
            </p>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Questions fréquentes
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                Puis-je annuler à tout moment ?
              </h4>
              <p className="text-sm text-gray-600">
                Oui, vous pouvez annuler votre abonnement à tout moment depuis votre espace client. 
                Vous gardez l'accès premium jusqu'à la fin de votre période de facturation.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                Que se passe-t-il après l'essai gratuit ?
              </h4>
              <p className="text-sm text-gray-600">
                Après 7 jours d'essai gratuit, votre abonnement se renouvelle automatiquement 
                à 9,99€/mois sauf si vous l'annulez avant la fin de la période d'essai.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                Les paiements sont-ils sécurisés ?
              </h4>
              <p className="text-sm text-gray-600">
                Oui, tous les paiements sont traités de manière sécurisée par Stripe, 
                l'un des leaders mondiaux du paiement en ligne.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumSubscriptionPage;