import React, { useState, useEffect } from 'react';
import { Crown, Calendar, CheckCircle, XCircle, Clock, User, Star } from 'lucide-react';

interface PremiumHistoryEntry {
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  isActive: boolean;
  grantedByInfo?: {
    username: string;
    fullName: string;
  };
  revokedByInfo?: {
    username: string;
    fullName: string;
  };
}

interface PremiumInfo {
  hasPremium: boolean;
  isPermanent: boolean;
  isExpired?: boolean;
  expiresAt: string | null;
  grantedAt: string | null;
  revokedAt?: string | null;
  grantedBy: {
    username: string;
    fullName: string;
  } | null;
  daysRemaining: number | null;
  role: string;
  history?: PremiumHistoryEntry[];
}

const PremiumManagementPage: React.FC = () => {
  const [premiumInfo, setPremiumInfo] = useState<PremiumInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPremiumInfo();
  }, []);

  const loadPremiumInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jurinapse_token');
      console.log('🔐 Token présent:', !!token);
      
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const response = await fetch('/api/users/premium-info', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Premium data:', data);
      setPremiumInfo(data);
    } catch (err) {
      console.error('💥 Premium info error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = () => {
    if (!premiumInfo?.hasPremium) return 'text-gray-500';
    if (premiumInfo.isExpired) return 'text-red-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (!premiumInfo?.hasPremium) return <XCircle className="h-5 w-5" />;
    if (premiumInfo.isExpired) return <XCircle className="h-5 w-5" />;
    return <CheckCircle className="h-5 w-5" />;
  };

  const getStatusText = () => {
    if (!premiumInfo?.hasPremium) return 'Aucun premium actif';
    if (premiumInfo.isExpired) return 'Premium expiré';
    if (premiumInfo.isPermanent) return 'Premium permanent';
    return `Premium actif - ${premiumInfo.daysRemaining} jour(s) restant(s)`;
  };

  if (loading) {
    return (
      <div className="settings-tab-content">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-tab-content">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-medium">Erreur</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-tab-content">
      <div className="space-y-6">
        {/* Statut Premium */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Crown className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Statut Premium</h3>
              <p className="text-gray-600">Informations sur votre abonnement premium</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Statut actuel */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`${getStatusColor()}`}>
                  {getStatusIcon()}
                </div>
                <h4 className="font-medium text-gray-900">Statut actuel</h4>
              </div>
              <p className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>

            {/* Date d'expiration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <h4 className="font-medium text-gray-900">Expiration</h4>
              </div>
              <p className="text-sm text-gray-600">
                {premiumInfo?.isPermanent ? 'Jamais' : formatDate(premiumInfo?.expiresAt)}
              </p>
            </div>

            {/* Date d'attribution */}
            {premiumInfo?.grantedAt && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <h4 className="font-medium text-gray-900">Attribué le</h4>
                </div>
                <p className="text-sm text-gray-600">
                  {formatDate(premiumInfo.grantedAt)}
                </p>
              </div>
            )}

            {/* Attribué par */}
            {premiumInfo?.grantedBy && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <h4 className="font-medium text-gray-900">Attribué par</h4>
                </div>
                <p className="text-sm text-gray-600">
                  @{premiumInfo.grantedBy.username}
                </p>
                <p className="text-xs text-gray-500">
                  {premiumInfo.grantedBy.fullName}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Avantages Premium */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Avantages Premium</h3>
              <p className="text-gray-600">Ce que vous obtenez avec votre abonnement premium</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Badge Premium</h4>
                <p className="text-sm text-gray-600">Affichage du badge premium sur votre profil</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Fonctionnalités exclusives</h4>
                <p className="text-sm text-gray-600">Accès à des fonctionnalités réservées aux membres premium</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Support prioritaire</h4>
                <p className="text-sm text-gray-600">Réponse prioritaire à vos questions et demandes</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Accès anticipé</h4>
                <p className="text-sm text-gray-600">Testez les nouvelles fonctionnalités en avant-première</p>
              </div>
            </div>
          </div>
        </div>

        {/* Historique Premium */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-purple-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Historique</h3>
              <p className="text-gray-600">Historique de vos abonnements premium</p>
            </div>
          </div>

          {(premiumInfo?.grantedAt || (premiumInfo?.history && premiumInfo.history.length > 0)) ? (
            <div className="space-y-3">
              {/* Premium actuel ou plus récent */}
              <div className="border-l-4 border-yellow-400 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Premium {premiumInfo.isPermanent ? 'permanent' : 'temporaire'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Attribué le {formatDate(premiumInfo.grantedAt)}
                      {premiumInfo.grantedBy && ` par @${premiumInfo.grantedBy.username}`}
                    </p>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    premiumInfo.hasPremium && !premiumInfo.isExpired
                      ? 'bg-green-100 text-green-800'
                      : premiumInfo.isExpired
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {premiumInfo.hasPremium && !premiumInfo.isExpired
                      ? 'Actif'
                      : premiumInfo.isExpired
                      ? 'Expiré'
                      : 'Inactif'
                    }
                  </div>
                </div>
                {!premiumInfo.isPermanent && premiumInfo.expiresAt && (
                  <p className="text-sm text-gray-500 mt-1">
                    {premiumInfo.isExpired ? 'A expiré' : 'Expire'} le {formatDate(premiumInfo.expiresAt)}
                  </p>
                )}
                {premiumInfo.revokedAt && (
                  <p className="text-sm text-red-500 mt-1">
                    Révoqué le {formatDate(premiumInfo.revokedAt)}
                  </p>
                )}
              </div>
              
              {/* Historique complet si disponible */}
              {premiumInfo.history && premiumInfo.history.length > 1 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Historique complet</h5>
                  {premiumInfo.history
                    .sort((a, b) => new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime())
                    .map((entry, index) => (
                    <div key={index} className="border-l-4 border-gray-300 pl-4 py-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <h6 className="text-sm font-medium text-gray-800">
                            Premium {entry.expiresAt ? 'temporaire' : 'permanent'}
                          </h6>
                          <p className="text-xs text-gray-600">
                            Attribué le {formatDate(entry.grantedAt)}
                            {entry.grantedByInfo && ` par @${entry.grantedByInfo.username}`}
                          </p>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          entry.isActive
                            ? 'bg-green-100 text-green-800'
                            : entry.revokedAt
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {entry.isActive ? 'Actif' : entry.revokedAt ? 'Révoqué' : 'Expiré'}
                        </div>
                      </div>
                      {entry.expiresAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {entry.revokedAt ? 'Devait expirer' : entry.isActive ? 'Expire' : 'A expiré'} le {formatDate(entry.expiresAt)}
                        </p>
                      )}
                      {entry.revokedAt && (
                        <p className="text-xs text-red-500 mt-1">
                          Révoqué le {formatDate(entry.revokedAt)}
                          {entry.revokedByInfo && ` par @${entry.revokedByInfo.username}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">Aucun historique</h4>
              <p className="text-gray-500">Vous n'avez jamais eu d'abonnement premium.</p>
            </div>
          )}
        </div>

        {/* Information système */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Crown className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-blue-800 font-medium">Information</h4>
              <p className="text-blue-700 text-sm mt-1">
                Les abonnements premium sont attribués par les modérateurs. 
                Si vous pensez avoir droit au premium ou si vous avez des questions, 
                contactez un modérateur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumManagementPage;