import React from 'react';
import { Trash2, Calendar, Shield } from 'lucide-react';

interface DeletedUserPageProps {
  onGoBack?: () => void;
}

const DeletedUserPage: React.FC<DeletedUserPageProps> = ({ onGoBack }) => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Profile Header - Utilisateur Supprimé */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          {/* Avatar spécial pour utilisateur supprimé */}
          <div className="relative mx-auto mb-6">
            <div className="h-24 w-24 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
              <Trash2 className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Informations utilisateur supprimé */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Utilisateur Supprimé
              </h1>
              <p className="text-gray-600 font-medium mb-1">
                @utilisateur_supprime
              </p>
            </div>

            {/* Badge spécial */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-lg">
              <div className="bg-white/20 rounded-full p-1">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-semibold">Compte Supprimé</span>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <p className="text-gray-700 leading-relaxed">
                Ce compte utilisateur a été supprimé. Les messages et publications de cet utilisateur peuvent encore être visibles dans l'historique des conversations pour préserver le contexte des échanges.
              </p>
            </div>

            {/* Date de suppression fictive */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg mt-4">
              <div className="bg-gray-200 rounded-full p-1">
                <Calendar className="h-3 w-3 text-gray-500" />
              </div>
              <span className="font-medium">
                Compte supprimé
              </span>
            </div>

            {/* Bouton de retour */}
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Retour
              </button>
            )}
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Politique de confidentialité
              </h3>
              <p className="text-sm text-blue-800">
                Conformément à notre politique de confidentialité, les données personnelles de cet utilisateur ont été définitivement supprimées. Seuls les contenus publics nécessaires au bon fonctionnement de la plateforme sont conservés de manière anonyme.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletedUserPage;
