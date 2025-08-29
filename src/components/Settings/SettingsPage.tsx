import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import BlockedUsersPage from './BlockedUsersPage';

interface SettingsPageProps {
  settingsTab: TabType;
  onBack?: () => void;
  onTagClick?: (tag: string) => void;
  onViewPost?: (postId: string) => void;
  onViewUserProfile?: (userId: string) => void;
}

type TabType = 'blocked' | 'password' | 'notifications' | 'appearance' | 'language' | 'data' | 'premium' | 'privacy' | 'delete-account';

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  settingsTab,
  onBack = () => window.history.back()
}) => {
  const { isDarkMode, setDarkMode } = useTheme();
  const { deleteAccount } = useAuth();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    messages: true,
    friendRequests: true,
    newPosts: false,
    email: true
  });
  const [selectedLanguage, setSelectedLanguage] = useState('fr');
  const [notificationsSaveStatus, setNotificationsSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // État pour la suppression de compte
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteAgreed, setDeleteAgreed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Charger les paramètres de notifications au montage
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const response = await authAPI.getNotificationSettings();
        if (response.success) {
          setNotifications(response.settings);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    };

    loadNotificationSettings();
  }, []);

  // Fonction pour sauvegarder les paramètres de notifications
  const saveNotificationSettings = async (newSettings: typeof notifications) => {
    try {
      setNotificationsSaveStatus('saving');
      const response = await authAPI.updateNotificationSettings(newSettings);
      if (response.success) {
        setNotificationsSaveStatus('saved');
        // Remettre à idle après 2 secondes
        setTimeout(() => setNotificationsSaveStatus('idle'), 2000);
      } else {
        setNotificationsSaveStatus('error');
        setTimeout(() => setNotificationsSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setNotificationsSaveStatus('error');
      setTimeout(() => setNotificationsSaveStatus('idle'), 3000);
    }
  };

  // Handler pour les changements de notifications avec sauvegarde automatique
  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    const newSettings = { ...notifications, [key]: value };
    setNotifications(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') {
      alert('Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }
    
    if (!deleteAgreed) {
      alert('Veuillez confirmer que vous comprenez que cette action est irréversible');
      return;
    }
    
    if (!confirm('Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const success = await deleteAccount();
      if (success) {
        alert('Votre compte a été supprimé avec succès.');
        // L'utilisateur sera automatiquement déconnecté par la fonction deleteAccount
      } else {
        alert('Erreur lors de la suppression du compte. Veuillez réessayer.');
      }
    } catch (error) {
      alert('Erreur lors de la suppression du compte. Veuillez réessayer.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Informations sur l'onglet actuel
  const currentTabInfo = {
    blocked: { title: 'Comptes bloqués', icon: '👤' },
    password: { title: 'Mot de passe', icon: '🔒' },
    notifications: { title: 'Notifications', icon: '🔔' },
    appearance: { title: 'Apparence', icon: '🎨' },
    language: { title: 'Langue', icon: '🌍' },
    data: { title: 'Données (RGPD)', icon: '📥' },
    premium: { title: 'Gestion Premium', icon: '👑' },
    privacy: { title: 'Confidentialité', icon: '🛡️' },
    'delete-account': { title: 'Supprimer le compte', icon: '⚠️' }
  }[settingsTab];

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    // TODO: Appel API pour changer le mot de passe
    alert('Mot de passe changé avec succès !');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const renderTabContent = () => {
    switch (settingsTab) {
      case 'blocked':
        return (
          <div className="settings-tab-content">
            <BlockedUsersPage />
          </div>
        );

      case 'password':
        return (
          <div className="settings-tab-content">
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez votre mot de passe actuel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez votre nouveau mot de passe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirmez votre nouveau mot de passe"
                />
              </div>
              <button
                onClick={handlePasswordChange}
                disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Changer le mot de passe
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-tab-content">
            <div className="space-y-4">
              {/* Feedback de sauvegarde */}
              {notificationsSaveStatus !== 'idle' && (
                <div className={`p-3 rounded-lg text-sm ${
                  notificationsSaveStatus === 'saving' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : notificationsSaveStatus === 'saved'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {notificationsSaveStatus === 'saving' && '💾 Sauvegarde en cours...'}
                  {notificationsSaveStatus === 'saved' && '✅ Paramètres sauvegardés avec succès !'}
                  {notificationsSaveStatus === 'error' && '❌ Erreur lors de la sauvegarde. Veuillez réessayer.'}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Messages privés</label>
                  <p className="text-xs text-gray-500">Recevoir des notifications pour les nouveaux messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.messages}
                    onChange={(e) => handleNotificationChange('messages', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors relative ${
                    notifications.messages ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                      notifications.messages ? 'translate-x-full border-white' : ''
                    }`}></div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Demandes d'ami</label>
                  <p className="text-xs text-gray-500">Recevoir des notifications pour les nouvelles demandes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.friendRequests}
                    onChange={(e) => handleNotificationChange('friendRequests', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors relative ${
                    notifications.friendRequests ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                      notifications.friendRequests ? 'translate-x-full border-white' : ''
                    }`}></div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nouvelles publications</label>
                  <p className="text-xs text-gray-500">Recevoir des notifications pour les posts de vos amis</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.newPosts}
                    onChange={(e) => handleNotificationChange('newPosts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors relative ${
                    notifications.newPosts ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                      notifications.newPosts ? 'translate-x-full border-white' : ''
                    }`}></div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Notifications par email</label>
                  <p className="text-xs text-gray-500">Recevoir un résumé par email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => handleNotificationChange('email', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors relative ${
                    notifications.email ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                      notifications.email ? 'translate-x-full border-white' : ''
                    }`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="settings-tab-content">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Thème</h3>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Mode sombre</label>
                    <p className="text-xs text-gray-500">Activer le thème sombre pour réduire la fatigue oculaire</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors relative ${
                      isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                        isDarkMode ? 'translate-x-full border-white' : ''
                      }`}></div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Aperçu</h3>
                <div className={`p-4 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                  <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                      <div>
                        <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Utilisateur Exemple</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Il y a 2 heures</div>
                      </div>
                    </div>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Voici un aperçu de l'apparence du site avec le thème {isDarkMode ? 'sombre' : 'clair'}.
                    </p>
                    <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      👍 12 · 💬 3 · 🔄 1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="settings-tab-content">
            <div className="space-y-4 max-w-md">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Langue de l'interface</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choisissez la langue d'affichage de l'application. Certaines traductions peuvent ne pas encore être disponibles.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { code: 'fr', name: 'Français', flag: '🇫🇷', available: true },
                  { code: 'en', name: 'English', flag: '🇺🇸', available: false },
                  { code: 'es', name: 'Español', flag: '🇪🇸', available: false },
                  { code: 'de', name: 'Deutsch', flag: '🇩🇪', available: false },
                  { code: 'it', name: 'Italiano', flag: '🇮🇹', available: false },
                  { code: 'pt', name: 'Português', flag: '🇵🇹', available: false },
                  { code: 'ja', name: '日本語', flag: '🇯🇵', available: false },
                  { code: 'zh', name: '中文', flag: '🇨🇳', available: false }
                ].map((language) => (
                  <label
                    key={language.code}
                    className={`
                      flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                      ${selectedLanguage === language.code
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                      }
                      ${!language.available ? 'opacity-60 cursor-not-allowed' : ''}
                    `}
                  >
                    <input
                      type="radio"
                      name="language"
                      value={language.code}
                      checked={selectedLanguage === language.code}
                      onChange={(e) => language.available && setSelectedLanguage(e.target.value)}
                      disabled={!language.available}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{language.flag}</span>
                    <div className="flex-1">
                      <div className={`font-medium ${!language.available ? 'line-through' : ''}`}>
                        {language.name}
                        {!language.available && (
                          <span className="ml-2 bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                            Bientôt
                          </span>
                        )}
                      </div>
                      {selectedLanguage === language.code && (
                        <div className="text-xs text-blue-600 mt-1">Langue actuelle</div>
                      )}
                    </div>
                    {selectedLanguage === language.code && (
                      <div className="text-blue-500">✓</div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'delete-account':
        return (
          <div className="settings-tab-content">
            <div className="space-y-6">
              {/* Avertissement principal */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="text-red-600 dark:text-red-400 text-2xl">⚠️</div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                      Action irréversible
                    </h3>
                    <p className="text-red-700 dark:text-red-300">
                      La suppression de votre compte est définitive et ne peut pas être annulée.
                      Toutes vos données seront supprimées de nos serveurs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ce qui sera supprimé */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  Données qui seront supprimées :
                </h4>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-xl"></span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Profil</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Photo de profil et informations personnelles</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-xl">👥</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Contacts</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Liste d'amis et abonnements</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-xl">⚙️</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Paramètres</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Toutes vos préférences et configurations</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ce qui sera conservé */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <h4 className="text-lg font-medium text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                  <span>💾</span>
                  Ce qui sera conservé :
                </h4>
                <ul className="space-y-2 text-amber-700 dark:text-amber-300">
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    Vos messages resteront visibles mais votre nom apparaîtra comme "Utilisateur introuvable"
                  </li>
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    Vos posts publiés resteront accessibles aux autres utilisateurs
                  </li>
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    Les contenus partagés dans les groupes seront préservés
                  </li>
                </ul>
              </div>

              {/* Alternatives */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-3">
                  Alternatives à considérer :
                </h4>
                <ul className="space-y-2 text-blue-700 dark:text-blue-300">
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    Désactiver temporairement votre compte
                  </li>
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    Modifier vos paramètres de confidentialité
                  </li>
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    Contacter le support pour assistance
                  </li>
                </ul>
              </div>

              {/* Zone de suppression */}
              <div className="border-t pt-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-red-800 dark:text-red-200 mb-4">
                    Supprimer définitivement mon compte
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tapez "SUPPRIMER" pour confirmer :
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="Tapez SUPPRIMER en majuscules"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="confirm-deletion"
                        checked={deleteAgreed}
                        onChange={(e) => setDeleteAgreed(e.target.checked)}
                        className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label htmlFor="confirm-deletion" className="text-sm text-gray-700 dark:text-gray-300">
                        Je comprends que cette action est irréversible
                      </label>
                    </div>
                    
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || deleteConfirmation !== 'SUPPRIMER' || !deleteAgreed}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Suppression en cours...' : 'Supprimer définitivement mon compte'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="settings-tab-content">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚧</div>
              <h4 className="text-lg font-medium text-gray-600 mb-2">Fonctionnalité en développement</h4>
              <p className="text-gray-500">Cette section sera bientôt disponible.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{currentTabInfo?.icon}</span>
              <h1 className="text-2xl font-bold text-gray-900">{currentTabInfo?.title}</h1>
            </div>
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Retour aux paramètres
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
