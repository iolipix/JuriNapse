import React from 'react';
import { User } from '../../types';
import { isModeratorMultiple } from '../../utils/roles';

interface ModeratorMenuProps {
  user: User | null;
}

const ModeratorMenu: React.FC<ModeratorMenuProps> = ({ user }) => {
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
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          🚧 En Construction
        </div>
      </div>

      {/* Construction Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="text-2xl mr-3">🚧</div>
          <h2 className="text-xl font-semibold text-yellow-800">
            Interface en développement
          </h2>
        </div>
        <p className="text-yellow-700 mb-4">
          Le panneau de modération est actuellement en cours de développement. 
          Les fonctionnalités suivantes seront bientôt disponibles :
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-2">📝 Gestion du contenu</h3>
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
          
          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-2">📊 Statistiques</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Activité de modération</li>
              <li>• Rapports hebdomadaires</li>
              <li>• Métriques communauté</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-2">⚙️ Outils</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Actions en lot</li>
              <li>• Modèles de réponse</li>
              <li>• Notifications</li>
            </ul>
          </div>
        </div>
      </div>

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
              {user.roles?.includes('administrator') ? '👑' : '🛡️'}
            </div>
            <p className="text-sm text-blue-700 font-medium">
              {user.roles?.includes('administrator') ? 'Admin + Modérateur' : 'Modérateur'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">✅</div>
            <p className="text-sm text-green-700 font-medium">Accès accordé</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-1">⏳</div>
            <p className="text-sm text-yellow-700 font-medium">En attente</p>
          </div>
        </div>
      </div>

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
