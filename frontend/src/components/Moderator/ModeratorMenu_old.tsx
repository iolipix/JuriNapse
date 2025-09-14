import React, { useState } from 'react';
import { User } from '../../types';
import { isModeratorMultiple, hasRole } from '../../utils/roles';
import PremiumManagement from '../Admin/PremiumManagement';

interface ModeratorMenuProps {
  user: User | null;
}

const ModeratorMenu: React.FC<ModeratorMenuProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Vérifier que l'utilisateur est modérateur
  if (!user || !isModeratorMultiple(user)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">❌</div>
          <p className="text-gray-600">Accès refusé</p>
          <p className="text-sm text-gray-500">Permissions modérateur requises</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🛠️ Panneau Modérateur
        </h1>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {hasRole(user, 'administrator') ? '👑 Admin + Modérateur' : '🛡️ Modérateur'}
        </div>
      </div>

      {/* Navigation des onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            � Aperçu
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'premium'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👑 Gestion Premium
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'content'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🚧 Contenu (À venir)
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">ℹ️</div>
              <h2 className="text-xl font-semibold text-blue-800">
                Statut actuel
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {hasRole(user, 'administrator') ? '👑' : '🛡️'}
                </div>
                <p className="text-sm text-blue-700 font-medium">
                  {hasRole(user, 'administrator') ? 'Admin + Modérateur' : 'Modérateur'}
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">✅</div>
                <p className="text-sm text-green-700 font-medium">Accès accordé</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">👑</div>
                <p className="text-sm text-blue-700 font-medium">Premium disponible</p>
              </div>
            </div>
          </div>

          {/* Fonctionnalités disponibles */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">✅</div>
              <h2 className="text-xl font-semibold text-green-800">
                Fonctionnalités disponibles
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-2">� Gestion Premium</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Attribuer premium temporaire</li>
                  <li>• Gérer les expirations</li>
                  <li>• Révoquer les abonnements</li>
                  <li>• Suivre les attributions</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-gray-900 mb-2">� En développement</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Modération des posts</li>
                  <li>• Gestion des utilisateurs</li>
                  <li>• Statistiques détaillées</li>
                  <li>• Outils de modération</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Comment utiliser</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Pour attribuer un premium :</strong> Allez dans l'onglet "Gestion Premium", 
                cliquez sur "Attribuer Premium", renseignez l'ID utilisateur et la durée.
              </p>
              <p>
                <strong>Durées recommandées :</strong> 7 jours (test), 30 jours (standard), 
                90 jours (récompense), permanent (VIP).
              </p>
              <p>
                <strong>Suivi :</strong> Vous pouvez voir tous les utilisateurs premium, 
                leurs dates d'expiration et qui leur a attribué.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'premium' && <PremiumManagement />}

      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">🚧</div>
              <h2 className="text-xl font-semibold text-yellow-800">
                Fonctionnalités en développement
              </h2>
            </div>
            <p className="text-yellow-700 mb-4">
              Ces fonctionnalités seront bientôt disponibles :
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-gray-900 mb-2">📝 Modération du contenu</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Modération des posts</li>
                  <li>• Gestion des commentaires</li>
                  <li>• Signalements utilisateurs</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-gray-900 mb-2">👥 Gestion des utilisateurs</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Avertissements</li>
                  <li>• Suspensions temporaires</li>
                  <li>• Historique des actions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>
          En tant que modérateur, vous contribuez à maintenir une communauté saine et respectueuse. 
          Merci pour votre engagement ! 🙏
        </p>
      </div>
    </div>
  );
};

export default ModeratorMenu;
