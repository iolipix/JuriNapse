import React, { useState, useEffect } from 'react';
import { Mail, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { authAPI } from '../../services/api';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (userData: any) => void;
  email: string;
  userId: string;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  email,
  userId
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  // Timer pour le countdown de renvoi
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Envoyer automatiquement le premier email de vérification
  useEffect(() => {
    if (isOpen && email && userId) {
      sendVerificationEmail();
    }
  }, [isOpen, email, userId]);

  const sendVerificationEmail = async () => {
    setIsResending(true);
    setError('');
    try {
      await authAPI.sendEmailVerification(userId);
      setSuccess('Code de vérification envoyé !');
      setTimeLeft(60); // 60 secondes avant de pouvoir renvoyer
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du code');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.verifyEmail(userId, verificationCode);
      setSuccess('Email vérifié avec succès !');
      setTimeout(() => {
        onVerified(response.user || {});
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code invalide ou expiré');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timeLeft > 0 || isResending) return;
    await sendVerificationEmail();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Vérifiez votre email
            </h2>
            <p className="text-gray-600">
              Nous avons envoyé un code de vérification à{' '}
              <span className="font-semibold text-gray-900">{email}</span>
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code de vérification
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Entrez le code reçu par email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-wider"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !verificationCode.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                'Vérifier le code'
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Vous n'avez pas reçu le code ?
            </p>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={timeLeft > 0 || isResending}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                'Envoi en cours...'
              ) : timeLeft > 0 ? (
                `Renvoyer dans ${timeLeft}s`
              ) : (
                'Renvoyer le code'
              )}
            </button>
          </div>

          {/* Warning */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Accès limité</p>
                <p>
                  Vous devez vérifier votre email pour accéder à toutes les fonctionnalités de JuriNapse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
