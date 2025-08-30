import React, { useState } from 'react';
import { Mail, AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

interface VerificationRequiredPageProps {
  onBack?: () => void;
  onLogin?: () => void;
  userEmail?: string;
}

const VerificationRequiredPage: React.FC<VerificationRequiredPageProps> = ({ 
  onBack, 
  onLogin,
  userEmail 
}) => {
  const { user, logout, setUser, pendingVerificationUserId } = useAuth() as any;
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const email = userEmail || user?.email;

  const handleResendVerification = async () => {
    // On peut renvoyer soit via email, soit via userId si email inconnu (juste créé)
    if (!email && !pendingVerificationUserId) {
      setMessage('Identifiant de vérification indisponible');
      setResendStatus('error');
      return;
    }

    setIsResending(true);
    setResendStatus('idle');
    setMessage('');

    try {
      let response;
      if (email) {
        response = await authAPI.resendVerificationEmail(email);
      } else {
        // Fallback userId
        response = await authAPI.sendEmailVerification(pendingVerificationUserId);
      }
      
      if (response.success) {
        setResendStatus('success');
        setMessage('Email de vérification envoyé avec succès ! Vérifiez votre boîte de réception et vos spams.');
      } else {
        setResendStatus('error');
        setMessage(response.message || 'Erreur lors de l\'envoi de l\'email de vérification');
      }
    } catch (error: any) {
      console.error('Erreur lors du renvoi:', error);
      setResendStatus('error');
      setMessage(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email de vérification');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeAccount = async () => {
    try {
      await logout();
      if (onLogin) {
        onLogin();
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
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
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-6">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Vérification d'email requise
            </h1>
            
            <p className="text-gray-600 mb-6">
              Votre compte doit être vérifié avant de pouvoir accéder à JuriNapse. 
              Nous avons envoyé un email de vérification à :
            </p>
            
            {email && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center">
                  <Mail className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-900">{email}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Zone de saisie du code */}
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entrez le code reçu (6 chiffres)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest text-center font-semibold"
                    placeholder="000000"
                  />
                  <button
                    disabled={code.length !== 6 || verifying}
                    onClick={async () => {
                      if (code.length !== 6) return;
                      setVerifying(true); setVerifyError(''); setMessage('');
                      try {
                        let resp;
                        if (email) {
                          resp = await authAPI.verifyEmailByEmail(email!, code);
                        } else if (pendingVerificationUserId) {
                          // Fallback vers userId direct
                          resp = await authAPI.verifyEmail(pendingVerificationUserId, code);
                        } else {
                          setVerifyError('Impossible de déterminer le compte à vérifier');
                          setVerifying(false);
                          return;
                        }
                        if (resp.success) {
                          setMessage('✅ Email vérifié ! Redirection...');
                          // Mettre à jour le user dans le contexte si disponible
                          if (setUser && user) {
                            setUser({ ...user, emailVerified: true });
                          }
                          setTimeout(() => { window.location.reload(); }, 1200);
                        } else {
                          setVerifyError(resp.message || 'Code invalide');
                        }
                      } catch (err: any) {
                        setVerifyError(err.response?.data?.message || 'Code invalide ou expiré');
                      } finally { setVerifying(false); }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                  >
                    {verifying ? '...' : 'Valider'}
                  </button>
                </div>
                {verifyError && <p className="mt-2 text-sm text-red-600">{verifyError}</p>}
              </div>
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Renvoyer l'email de vérification
                  </>
                )}
              </button>
              
              <button
                onClick={handleChangeAccount}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Se connecter avec un autre compte
              </button>
            </div>
            
            {/* Messages de statut */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg border ${
                resendStatus === 'success' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {resendStatus === 'success' && <CheckCircle className="h-5 w-5 inline mr-2" />}
                {resendStatus === 'error' && <AlertCircle className="h-5 w-5 inline mr-2" />}
                {message}
              </div>
            )}
            
            {/* Instructions */}
            <div className="mt-8 text-left">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Que faire maintenant ?
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="flex-shrink-0 h-1.5 w-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                  Vérifiez votre boîte de réception et vos spams
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 h-1.5 w-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                  Cliquez sur le lien de vérification dans l'email
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 h-1.5 w-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                  Si vous ne trouvez pas l'email, utilisez le bouton "Renvoyer"
                </li>
              </ul>
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                Important: si vous ne validez pas votre email dans l'heure suivant la création du compte, celui-ci sera automatiquement supprimé.
              </div>
            </div>
            
            {/* Info développement */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-left">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Mode développement</h4>
                <p className="text-xs text-yellow-700">
                  Les emails sont simulés. Vérifiez les logs du serveur Railway pour voir le lien de vérification.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationRequiredPage;
