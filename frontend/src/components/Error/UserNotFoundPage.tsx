import React from 'react';
import { User, ArrowLeft, Home } from 'lucide-react';

interface UserNotFoundPageProps {
  username?: string;
  onBackToFeed?: () => void;
  onGoHome?: () => void;
}

const UserNotFoundPage: React.FC<UserNotFoundPageProps> = ({ 
  username, 
  onBackToFeed, 
  onGoHome 
}) => {
  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleGoBack = () => {
    if (onBackToFeed) {
      onBackToFeed();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Icône utilisateur avec effet de grisement */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <User className="w-10 h-10 text-gray-400" />
            <div className="absolute inset-0 bg-gray-300 rounded-full opacity-50"></div>
            <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Utilisateur introuvable
          </h1>
          
          <div className="text-gray-600 space-y-2">
            {username ? (
              <p>
                L'utilisateur <span className="font-semibold text-gray-800">@{username}</span> n'est plus disponible.
              </p>
            ) : (
              <p>Cet utilisateur n'est plus disponible.</p>
            )}
            <p className="text-sm">
              Le compte a peut-être été supprimé ou désactivé.
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
        </div>
        
        {/* Information supplémentaire */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Si vous pensez qu'il s'agit d'une erreur, contactez le support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserNotFoundPage;
