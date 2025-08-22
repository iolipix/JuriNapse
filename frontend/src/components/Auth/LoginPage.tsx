import React, { useState } from 'react';
import { Shield, Mail, Key, ArrowLeft } from 'lucide-react';
import EmailLogin from './EmailLogin';
import { useAuth } from '../../contexts/AuthContext';

interface LoginPageProps {
  onSuccess?: () => void;
}

type LoginMode = 'choice' | 'email' | 'traditional';

const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<LoginMode>('choice');
  const { loginWithToken } = useAuth();

  const handleEmailLoginSuccess = (token: string, user: any) => {
    loginWithToken(token, user);
    onSuccess?.();
  };

  if (mode === 'email') {
    return (
      <EmailLogin 
        onLogin={handleEmailLoginSuccess}
        onBack={() => setMode('choice')}
      />
    );
  }

  if (mode === 'traditional') {
    // Ici vous pouvez garder votre ancien composant de login
    // Pour l'instant, on retourne au choix
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Connexion traditionnelle</h1>
            <p className="text-gray-600 mt-2">Bientôt disponible</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <button
              onClick={() => setMode('choice')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mode choix par défaut
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Connexion JuriNapse</h1>
          <p className="text-gray-600 mt-2">
            Choisissez votre méthode de connexion préférée
          </p>
        </div>

        {/* Options de connexion */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-4">
          
          {/* Connexion par email (recommandée) */}
          <button
            onClick={() => setMode('email')}
            className="w-full p-6 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                  <Mail className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Connexion par email
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Recommandé
                  </span>
                </h3>
                <p className="text-sm text-gray-600">
                  Recevez un code de connexion temporaire par email. Plus sécurisé, sans mot de passe.
                </p>
              </div>
            </div>
          </button>

          {/* Connexion traditionnelle */}
          <button
            onClick={() => setMode('traditional')}
            className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all group"
            disabled
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                  <Key className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-500 mb-1">
                  Connexion avec mot de passe
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Bientôt
                  </span>
                </h3>
                <p className="text-sm text-gray-400">
                  Connexion traditionnelle avec email et mot de passe (en cours de développement).
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Info sécurité */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center text-blue-800 text-sm">
            <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Sécurité renforcée</p>
              <p className="text-blue-700">
                La connexion par email est plus sécurisée car elle ne nécessite pas de retenir un mot de passe
                et utilise des codes temporaires à usage unique.
              </p>
            </div>
          </div>
        </div>

        {/* Première connexion */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Première visite ?{' '}
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              Créer un compte
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
