import React, { useState, useEffect, useRef } from 'react';
import { Scale, Eye, EyeOff, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import EmailVerificationModal from './EmailVerificationModal';

interface AuthFormProps {
  onClose?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const { login, register, completeEmailVerification, needsEmailVerification, pendingVerificationUserId } = useAuth();

  // États pour la vérification du username
  const [usernameStatus, setUsernameStatus] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
  }>({ isChecking: false, isAvailable: null, message: '' });

  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    emailOrUsername: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    university: '',
    graduationYear: new Date().getFullYear(),
    isStudent: true,
    bio: '',
  });

  // État pour la validation du mot de passe
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false
  });

  // Fonction pour valider le mot de passe
  const validatePassword = (password: string, confirmPassword: string = formData.confirmPassword) => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>\-]/.test(password),
      match: password === confirmPassword && password.length > 0
    };
    setPasswordValidation(validation);
    return validation;
  };

  // Fonction pour vérifier si le mot de passe est valide
  const isPasswordValid = () => {
    return passwordValidation.length && 
           passwordValidation.uppercase && 
           passwordValidation.lowercase && 
           passwordValidation.number && 
           passwordValidation.special && 
           passwordValidation.match;
  };

  // Fonction pour vérifier la disponibilité du username
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus({
        isChecking: false,
        isAvailable: null,
        message: username.length > 0 ? 'Le nom d\'utilisateur doit contenir au moins 3 caractères' : ''
      });
      return;
    }

    setUsernameStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const result = await authAPI.checkUsernameAvailability(username);
      setUsernameStatus({
        isChecking: false,
        isAvailable: result.available,
        message: result.message
      });
    } catch (error) {
      setUsernameStatus({
        isChecking: false,
        isAvailable: null,
        message: 'Erreur lors de la vérification'
      });
    }
  };

  // Debounce pour la vérification du username
  useEffect(() => {
    if (!isLogin && formData.username) {
      // Annuler le timeout précédent
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }

      // Démarrer un nouveau timeout
      usernameCheckTimeoutRef.current = setTimeout(() => {
        checkUsernameAvailability(formData.username);
      }, 500); // 500ms de délai
    } else {
      // Réinitialiser le statut si on est en mode login ou que le username est vide
      setUsernameStatus({ isChecking: false, isAvailable: null, message: '' });
    }

    // Cleanup
    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [formData.username, isLogin]);

  // Fermer automatiquement le formulaire quand une vérification d'email est requise
  useEffect(() => {
    console.log('🔍 DEBUG AuthForm useEffect:', {
      needsEmailVerification,
      pendingVerificationUserId,
      shouldClose: needsEmailVerification && pendingVerificationUserId
    });
    
    if (needsEmailVerification && pendingVerificationUserId) {
      console.log('🔄 Email verification required - closing auth form');
      console.log('🔍 DEBUG - Calling onClose()');
      setIsSubmitting(false);
      onClose?.();
    }
  }, [needsEmailVerification, pendingVerificationUserId, onClose]);

  const generateUsername = (firstName: string, lastName: string) => {
    const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const random = Math.floor(Math.random() * 1000);
    return `${base}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Empêcher la propagation de l'événement
    
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const success = await login(formData.emailOrUsername, formData.password);
        if (success) {
          onClose?.();
        } else if (!needsEmailVerification) {
          // Si ce n'est pas un problème de vérification, afficher l'erreur
          setError('Email/pseudo ou mot de passe incorrect');
        }
        // Si needsEmailVerification est true, l'useEffect se chargera de fermer le formulaire
      } else {
        // Validation pour l'inscription
        if (!formData.password || formData.password.length < 8) {
          setError('Le mot de passe doit contenir au moins 8 caractères');
          setIsSubmitting(false);
          return;
        }

        if (!isPasswordValid()) {
          setError('Le mot de passe ne respecte pas tous les critères de sécurité');
          setIsSubmitting(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setIsSubmitting(false);
          return;
        }

        // Générer un username automatiquement si pas fourni
        const username = formData.username || generateUsername(formData.firstName, formData.lastName);
        
        // Vérifier la disponibilité du username si fourni manuellement
        if (formData.username) {
          if (usernameStatus.isChecking) {
            setError('Vérification du nom d\'utilisateur en cours...');
            setIsSubmitting(false);
            return;
          }
          
          if (usernameStatus.isAvailable === false) {
            setError('Ce nom d\'utilisateur est déjà pris');
            setIsSubmitting(false);
            return;
          }
        }
        
        const result = await register({
          email: formData.email,
          username: username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          university: formData.university,
          graduationYear: formData.graduationYear,
          isStudent: formData.isStudent,
          bio: formData.bio,
        }, formData.password);
        
        // Gérer la réponse d'inscription
        if (result.success) {
          // Inscription réussie, montrer le modal de vérification
          setPendingUser({
            id: result.user?.id || 'new-user',
            email: formData.email,
            username: username,
            firstName: formData.firstName,
            lastName: formData.lastName
          });
          setShowEmailVerification(true);
          setError(''); // Effacer les erreurs précédentes
          return; // Ne pas fermer le modal
        } else {
          // Erreur lors de l'inscription
          setError('Cet email ou ce pseudo est déjà utilisé');
        }
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setIsSubmitting(false); // Fin du chargement
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    };
    setFormData(newFormData);

    // Valider le mot de passe en temps réel pour l'inscription
    if (!isLogin && (name === 'password' || name === 'confirmPassword')) {
      const password = name === 'password' ? value : newFormData.password;
      const confirmPassword = name === 'confirmPassword' ? value : newFormData.confirmPassword;
      validatePassword(password, confirmPassword);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Header avec fermeture */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        <div className="text-center">
          <div className="bg-white/20 p-3 rounded-full inline-block mb-4">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">JuriNapse</h1>
          <p className="text-blue-100 mt-2">
            {isLogin ? 'Connectez-vous à votre compte' : 'Rejoignez la communauté juridique'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pseudo <span className="text-gray-500 text-xs">(optionnel - généré automatiquement)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Ex: marie.dupont123"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      formData.username && usernameStatus.isAvailable === false
                        ? 'border-red-300 bg-red-50'
                        : formData.username && usernameStatus.isAvailable === true
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300'
                    }`}
                  />
                  {formData.username && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {usernameStatus.isChecking ? (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      ) : usernameStatus.isAvailable === true ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : usernameStatus.isAvailable === false ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                {formData.username && usernameStatus.message && (
                  <p className={`text-xs mt-1 ${
                    usernameStatus.isAvailable === false ? 'text-red-500' : 
                    usernameStatus.isAvailable === true ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {usernameStatus.message}
                  </p>
                )}
                {!formData.username && (
                  <p className="text-xs text-gray-500 mt-1">
                    Si vide, sera généré automatiquement : {formData.firstName && formData.lastName ? generateUsername(formData.firstName, formData.lastName) : 'prenom.nom123'}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="isStudent"
                    checked={formData.isStudent}
                    onChange={() => setFormData(prev => ({ ...prev, isStudent: true }))}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Étudiant</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="isStudent"
                    checked={!formData.isStudent}
                    onChange={() => setFormData(prev => ({ ...prev, isStudent: false }))}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Professionnel</span>
                </label>
              </div>

              {formData.isStudent && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Université
                    </label>
                    <input
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleChange}
                      placeholder="Sorbonne, Assas..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Année de diplôme
                    </label>
                    <input
                      type="number"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleChange}
                      min="2020"
                      max="2030"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email ou Pseudo
              </label>
              <input
                type="text"
                name="emailOrUsername"
                value={formData.emailOrUsername}
                onChange={handleChange}
                placeholder="votre@email.com ou votre.pseudo"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={isLogin ? 6 : 8}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {isLogin && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 caractères
              </p>
            )}
            
            {/* Validation du mot de passe pour l'inscription */}
            {!isLogin && formData.password && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-gray-700">Critères de sécurité :</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className={`flex items-center ${passwordValidation.length ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{passwordValidation.length ? '✓' : '○'}</span>
                    8 caractères min.
                  </div>
                  <div className={`flex items-center ${passwordValidation.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{passwordValidation.uppercase ? '✓' : '○'}</span>
                    1 majuscule
                  </div>
                  <div className={`flex items-center ${passwordValidation.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{passwordValidation.lowercase ? '✓' : '○'}</span>
                    1 minuscule
                  </div>
                  <div className={`flex items-center ${passwordValidation.number ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{passwordValidation.number ? '✓' : '○'}</span>
                    1 chiffre
                  </div>
                  <div className={`flex items-center ${passwordValidation.special ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{passwordValidation.special ? '✓' : '○'}</span>
                    1 spécial (!@#$...)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Champ de confirmation de mot de passe pour l'inscription */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 pr-16 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    formData.confirmPassword && formData.password && formData.confirmPassword !== formData.password
                      ? 'border-red-300 bg-red-50'
                      : formData.confirmPassword && passwordValidation.match
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300'
                  }`}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {formData.confirmPassword && (
                    <div>
                      {passwordValidation.match ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {formData.confirmPassword && !passwordValidation.match && (
                <p className="text-xs text-red-500 mt-1">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isSubmitting ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {isLogin ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
      
      {/* Modal de vérification d'email */}
      <EmailVerificationModal
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        onVerified={(userData) => {
          completeEmailVerification(userData);
          setShowEmailVerification(false);
          onClose?.();
        }}
        email={pendingUser?.email || ''}
        userId={pendingUser?.id || ''}
      />
    </div>
  );
};

export default AuthForm;