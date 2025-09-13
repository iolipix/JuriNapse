import React, { useState, useEffect } from 'react';
import { FileText, Shield } from 'lucide-react';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';

const LegalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  // Détecter l'URL actuelle et ajuster l'onglet au chargement
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/charte-confidentialite') {
      setActiveTab('privacy');
    } else {
      setActiveTab('terms');
    }
  }, []);

  // Fonction pour changer d'onglet et mettre à jour l'URL
  const handleTabChange = (tab: 'terms' | 'privacy') => {
    setActiveTab(tab);
    const newUrl = tab === 'privacy' ? '/charte-confidentialite' : '/conditions-utilisation';
    window.history.pushState({}, '', newUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête avec onglets */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => handleTabChange('terms')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'terms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Conditions Générales d'Utilisation</span>
            </button>
            
            <button
              onClick={() => handleTabChange('privacy')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'privacy'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Charte sur le Respect de la Vie Privée</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="py-8">
        {activeTab === 'terms' && <TermsOfService />}
        {activeTab === 'privacy' && <PrivacyPolicy />}
      </div>
    </div>
  );
};

export default LegalPage;
