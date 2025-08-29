import React, { useState, useEffect } from 'react';
import { Mail, Shield, Clock, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import EmailService from '../../services/EmailService';

interface EmailLoginProps {
  onLogin: (token: string, user: any) => void;
  onBack: () => void;
}

interface FormErrors {
  email?: string;
  code?: string;
  general?: string;
}

const EmailLogin: React.FC<EmailLoginProps> = ({ onLogin, onBack }) => {
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Countdown pour le renvoi de code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!email.trim()) {
      setErrors({ email: 'L\'adresse email est requise' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Format d\'email invalide' });
      return;
    }

    setIsLoading(true);

    try {
      const result = await EmailService.sendVerificationCode(email);
      
      if (result.success) {
        setStep('verification');
        setCountdown(60); // 1 minute avant pouvoir renvoyer
        setCanResend(false);
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      setErrors({ general: 'Une erreur est survenue' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!verificationCode.trim()) {
      setErrors({ code: 'Le code de vérification est requis' });
      return;
    }

    if (verificationCode.length !== 6) {
      setErrors({ code: 'Le code doit contenir 6 chiffres' });
      return;
    }

    setIsLoading(true);

    try {
      const result = await EmailService.verifyCode(email, verificationCode);
      
      if (result.success && result.token && result.user) {
        onLogin(result.token, result.user);
      } else {
        setErrors({ code: result.message });
        setVerificationCode(''); // Reset le code en cas d'erreur
      }
    } catch (error) {
      setErrors({ code: 'Code invalide ou expiré' });
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await EmailService.resendCode(email);
      
      if (result.success) {
        setCountdown(60);
        setCanResend(false);
        setVerificationCode('');
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      setErrors({ general: 'Erreur lors du renvoi' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setVerificationCode('');
    setErrors({});
    setCountdown(0);
    setCanResend(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Connexion sécurisée</h1>
          <p className="text-gray-600 mt-2">
            {step === 'email' 
              ? 'Entrez votre adresse email pour recevoir un code de connexion'
              : 'Entrez le code reçu par email'
            }
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {/* Champ Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="votre@email.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Erreur générale */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center text-red-800 text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {errors.general}
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      Envoyer le code
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Retour
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-6">
              {/* Info email */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center text-blue-800 text-sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Code envoyé à <strong className="ml-1">{email}</strong>
                </div>
              </div>

              {/* Champ Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Code de vérification
                </label>
                <input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`w-full py-3 px-4 text-center text-2xl font-mono tracking-widest border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123456"
                  maxLength={6}
                  disabled={isLoading}
                />
                {errors.code && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.code}
                  </div>
                )}
              </div>

              {/* Erreur générale */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center text-red-800 text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {errors.general}
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      Se connecter
                    </>
                  )}
                </button>

                {/* Renvoi du code */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={!canResend || isLoading}
                    className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed text-sm flex items-center"
                  >
                    {countdown > 0 ? (
                      <>
                        <Clock className="h-4 w-4 mr-1" />
                        Renvoyer dans {countdown}s
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-1" />
                        Renvoyer le code
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="text-gray-600 hover:text-gray-800 text-sm flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Changer d'email
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Info sécurité */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 flex items-center justify-center">
            <Shield className="h-4 w-4 mr-2" />
            Connexion sécurisée par code temporaire
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailLogin;
