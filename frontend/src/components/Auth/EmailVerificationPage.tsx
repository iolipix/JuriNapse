import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

interface EmailVerificationPageProps {
  onBack?: () => void;
  onVerificationSuccess?: () => void;
}

const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({ 
  onBack, 
  onVerificationSuccess 
}) => {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'expired'>('pending');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);

  // Extraire le token de l'URL au chargement
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      verifyEmail(tokenFromUrl);
    }
  }, []);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await authAPI.verifyEmailByToken(verificationToken);
      
      if (response.success) {
        setVerificationStatus('success');
        setTimeout(() => {
          if (onVerificationSuccess) {
            onVerificationSuccess();
          } else {
            // Rediriger vers la page de connexion ou le feed
            window.location.href = '/';
          }
        }, 2000);
      } else {
        setVerificationStatus(response.message?.includes('expiré') ? 'expired' : 'error');
      }
    } catch (error: any) {
      console.error('Erreur lors de la vérification:', error);
      setVerificationStatus(error.response?.data?.message?.includes('expiré') ? 'expired' : 'error');
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) {
      setResendMessage('Email utilisateur non disponible');
      return;
    }

    setIsResending(true);
    setResendMessage('');

    try {
      const response = await authAPI.resendVerificationEmail(user.email);
      
      if (response.success) {
        setResendMessage('Email de vérification renvoyé avec succès ! Vérifiez votre boîte mail.');
      } else {
        setResendMessage(response.message || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (error: any) {
      console.error('Erreur lors du renvoi:', error);
      setResendMessage(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Vérification en cours...
            </h2>
            <p className="text-gray-600">
              Nous vérifions votre adresse email, veuillez patienter.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Email vérifié avec succès !
            </h2>
            <p className="text-gray-600 mb-6">
              Votre compte a été activé. Vous allez être redirigé automatiquement.
            </p>
            <div className="animate-pulse">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-amber-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Lien de vérification expiré
            </h2>
            <p className="text-gray-600 mb-6">
              Le lien de vérification a expiré. Demandez un nouveau lien pour activer votre compte.
            </p>
            {user?.email && (
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Renvoyer l'email
                  </>
                )}
              </button>
            )}
          </div>
        );

      case 'error':
      default:
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Erreur de vérification
            </h2>
            <p className="text-gray-600 mb-6">
              Une erreur s'est produite lors de la vérification de votre email. 
              Le lien peut être invalide ou avoir expiré.
            </p>
            {user?.email && (
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Demander un nouveau lien
                  </>
                )}
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header avec bouton retour */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </button>
        )}

        {/* Card principale */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <div className="mb-8 text-center">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">
              Vérification d'email
            </h1>
          </div>

          {renderContent()}

          {/* Message de renvoi */}
          {resendMessage && (
            <div className={`mt-6 p-4 rounded-lg ${
              resendMessage.includes('succès') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {resendMessage}
            </div>
          )}

          {/* Info développement */}
          {process.env.NODE_ENV === 'development' && token && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700">
                <strong>Mode développement:</strong> Token détecté: {token.substring(0, 10)}...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
