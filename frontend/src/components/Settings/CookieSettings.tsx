import React, { useState } from 'react';
import { Shield, Save, RotateCcw, Info } from 'lucide-react';
import { useCookieConsent, CookiePreferences } from '../../hooks/useCookieConsent';

const CookieSettings: React.FC = () => {
  const { preferences, hasConsent, updatePreferences, clearConsent } = useCookieConsent();
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(
    preferences || {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    }
  );
  const [isSaving, setIsSaving] = useState(false);

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return; // Les cookies nécessaires ne peuvent pas être désactivés
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updatePreferences(localPreferences);
      // Simulation d'un délai de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const resetPreferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    setLocalPreferences(resetPreferences);
  };

  const handleClearAll = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tous vos consentements ? Vous devrez les reconfigurer.')) {
      clearConsent();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Paramètres des cookies</h1>
        </div>
        <p className="text-gray-600">
          Gérez vos préférences concernant l'utilisation des cookies et le traitement de vos données.
        </p>
        {hasConsent && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ Vos préférences ont été enregistrées le {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Cookies nécessaires */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cookies nécessaires
              </h3>
              <p className="text-gray-600 mb-4">
                Ces cookies sont indispensables au bon fonctionnement du site. Ils permettent l'authentification, 
                la sécurisation des sessions et le respect de vos préférences de base.
              </p>
              <div className="text-sm text-gray-500">
                <p><strong>Exemples :</strong> session d'authentification, préférences de langue, sécurité CSRF</p>
                <p><strong>Durée :</strong> Session ou jusqu'à 1 an</p>
              </div>
            </div>
            <div className="ml-4 flex items-center">
              <span className="text-sm text-green-600 font-medium mr-2">Toujours actif</span>
              <div className="w-12 h-6 bg-green-500 rounded-full flex items-center">
                <div className="w-5 h-5 bg-white rounded-full ml-6 shadow-md"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Cookies analytiques */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cookies analytiques
              </h3>
              <p className="text-gray-600 mb-4">
                Ces cookies nous permettent de comprendre comment vous utilisez le site pour améliorer votre expérience. 
                Les données sont anonymisées et utilisées uniquement à des fins statistiques.
              </p>
              <div className="text-sm text-gray-500">
                <p><strong>Exemples :</strong> Google Analytics, statistiques de pages vues, temps de session</p>
                <p><strong>Durée :</strong> Jusqu'à 2 ans</p>
              </div>
            </div>
            <div className="ml-4 flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.analytics}
                  onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                  localPreferences.analytics ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    localPreferences.analytics ? 'translate-x-6' : 'translate-x-1'
                  }`}></div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Cookies marketing */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cookies marketing
              </h3>
              <p className="text-gray-600 mb-4">
                Ces cookies permettent de personnaliser les publicités et le contenu selon vos intérêts. 
                Ils peuvent être utilisés par nos partenaires publicitaires.
              </p>
              <div className="text-sm text-gray-500">
                <p><strong>Exemples :</strong> pixels de conversion, remarketing, publicités personnalisées</p>
                <p><strong>Durée :</strong> Jusqu'à 1 an</p>
              </div>
            </div>
            <div className="ml-4 flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.marketing}
                  onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                  localPreferences.marketing ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    localPreferences.marketing ? 'translate-x-6' : 'translate-x-1'
                  }`}></div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Cookies fonctionnels */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cookies fonctionnels
              </h3>
              <p className="text-gray-600 mb-4">
                Ces cookies améliorent les fonctionnalités et la personnalisation du site, 
                comme la mémorisation de vos préférences d'affichage ou vos favoris.
              </p>
              <div className="text-sm text-gray-500">
                <p><strong>Exemples :</strong> préférences d'affichage, favoris, personnalisation UI</p>
                <p><strong>Durée :</strong> Jusqu'à 6 mois</p>
              </div>
            </div>
            <div className="ml-4 flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.functional}
                  onChange={(e) => handlePreferenceChange('functional', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                  localPreferences.functional ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    localPreferences.functional ? 'translate-x-6' : 'translate-x-1'
                  }`}></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
          
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Réinitialiser</span>
          </button>
        </div>

        <div className="flex gap-3 text-sm">
          <a 
            href="/politique-confidentialite" 
            target="_blank"
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 underline"
          >
            <Info className="h-4 w-4" />
            <span>Politique de confidentialité</span>
          </a>
          
          <button
            onClick={handleClearAll}
            className="text-red-600 hover:text-red-700 underline"
          >
            Supprimer tous les consentements
          </button>
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">💡 Bon à savoir</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Vous pouvez modifier ces préférences à tout moment</li>
          <li>• La désactivation de certains cookies peut limiter les fonctionnalités</li>
          <li>• Vos choix sont enregistrés localement dans votre navigateur</li>
          <li>• En cas de suppression de vos données de navigation, vous devrez reconfigurer ces préférences</li>
        </ul>
      </div>
    </div>
  );
};

export default CookieSettings;
