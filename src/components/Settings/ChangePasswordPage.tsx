import React, { useState } from 'react';
import { ArrowLeft, Key, Eye, EyeOff, Check, X } from 'lucide-react';
import { api } from '../../services/api';

interface ChangePasswordPageProps {
  onBack: () => void;
}

const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage(null);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setMessage({ type: 'error', text: 'Veuillez saisir votre mot de passe actuel' });
      return false;
    }
    if (!formData.newPassword) {
      setMessage({ type: 'error', text: 'Veuillez saisir un nouveau mot de passe' });
      return false;
    }
    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit être différent de l\'ancien' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Erreur lors de la modification du mot de passe' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const getStrengthColor = (score: number) => {
    if (score < 2) return 'bg-red-400';
    if (score < 4) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  const getStrengthText = (score: number) => {
    if (score < 2) return 'Faible';
    if (score < 4) return 'Moyen';
    return 'Fort';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center space-x-3">
          <Key className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Modifier le mot de passe</h1>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`border rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-6">
        {/* Current Password */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe actuel
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              placeholder="Saisissez votre mot de passe actuel"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPasswords.current ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              placeholder="Saisissez votre nouveau mot de passe"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPasswords.new ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* Password Strength */}
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center space-x-2 mb-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getStrengthColor(passwordStrength(formData.newPassword))}`}
                    style={{ width: `${(passwordStrength(formData.newPassword) / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">
                  {getStrengthText(passwordStrength(formData.newPassword))}
                </span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Le mot de passe doit contenir :</p>
                <ul className="space-y-1 ml-4">
                  <li className={formData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                    • Au moins 8 caractères
                  </li>
                  <li className={/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-400'}>
                    • Une majuscule
                  </li>
                  <li className={/[a-z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-400'}>
                    • Une minuscule
                  </li>
                  <li className={/[0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-400'}>
                    • Un chiffre
                  </li>
                  <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-400'}>
                    • Un caractère spécial
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmer le nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              placeholder="Confirmez votre nouveau mot de passe"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPasswords.confirm ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* Password Match Indicator */}
          {formData.confirmPassword && (
            <div className="mt-2">
              {formData.newPassword === formData.confirmPassword ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-xs">Les mots de passe correspondent</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-600">
                  <X className="h-4 w-4" />
                  <span className="text-xs">Les mots de passe ne correspondent pas</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Modification en cours...' : 'Modifier le mot de passe'}
          </button>
        </div>
      </form>

      {/* Security Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">Conseils de sécurité</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• Utilisez un mot de passe unique pour ce compte</li>
          <li>• Évitez les informations personnelles dans votre mot de passe</li>
          <li>• Changez votre mot de passe régulièrement</li>
          <li>• Ne partagez jamais votre mot de passe</li>
        </ul>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
