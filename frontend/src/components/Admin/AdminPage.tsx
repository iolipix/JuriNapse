import React, { useState } from 'react';
import { Shield, Users, Settings, BarChart3, FileText, AlertTriangle, Crown } from 'lucide-react';
import PremiumManagement from './PremiumManagement';

interface AdminPageProps {
  activeSubTab?: string;
  onSubTabChange?: (subTab: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ activeSubTab = 'moderators', onSubTabChange }) => {
  const [currentSubTab, setCurrentSubTab] = useState(activeSubTab);

  const handleSubTabChange = (subTab: string) => {
    setCurrentSubTab(subTab);
    if (onSubTabChange) {
      onSubTabChange(subTab);
    }
  };

  // Définition des sous-onglets d'administration
  const adminSubTabs = [
    { id: 'moderators', label: 'Gestion des modérateurs', icon: Users, description: 'Gérer les rôles et permissions des modérateurs' },
    { id: 'premium', label: 'Gestion Premium', icon: Crown, description: 'Attribuer et gérer les abonnements premium' },
    { id: 'users', label: 'Gestion des utilisateurs', icon: Shield, description: 'Modérer et gérer tous les utilisateurs' },
    { id: 'content', label: 'Modération du contenu', icon: FileText, description: 'Gérer les posts, commentaires et signalements' },
    { id: 'analytics', label: 'Statistiques', icon: BarChart3, description: 'Statistiques détaillées de la plateforme' },
    { id: 'system', label: 'Configuration système', icon: Settings, description: 'Paramètres globaux et maintenance' },
  ];

  const renderModeratorsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestion des modérateurs</h3>
        <p className="text-gray-600 mb-4">
          Gérez les rôles et permissions des modérateurs de la plateforme. 
          Vous pouvez promouvoir des utilisateurs au rang de modérateur ou rétrograder des modérateurs existants.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-yellow-800 font-medium">Fonctionnalité en développement</h4>
              <p className="text-yellow-700 text-sm mt-1">
                Cette section sera bientôt disponible. Vous pourrez y gérer les modérateurs directement depuis l'interface.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Modérateurs actuels</h4>
            <p className="text-gray-600 text-sm">Aucun modérateur configuré pour le moment.</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Actions disponibles</h4>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• Promouvoir un utilisateur au rang de modérateur</li>
              <li>• Rétrograder un modérateur au rang d'utilisateur</li>
              <li>• Configurer les permissions spécifiques</li>
              <li>• Consulter l'historique des actions de modération</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlaceholderTab = (tabName: string) => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{tabName}</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-blue-800 font-medium">Section en développement</h4>
              <p className="text-blue-700 text-sm mt-1">
                Cette fonctionnalité sera disponible dans une prochaine mise à jour.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentSubTab) {
      case 'moderators':
        return renderModeratorsTab();
      case 'premium':
        return <PremiumManagement />;
      case 'users':
        return renderPlaceholderTab('Gestion des utilisateurs');
      case 'content':
        return renderPlaceholderTab('Modération du contenu');
      case 'analytics':
        return renderPlaceholderTab('Statistiques');
      case 'system':
        return renderPlaceholderTab('Configuration système');
      default:
        return renderModeratorsTab();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
        </div>
        <p className="text-gray-600">
          Panneau d'administration pour gérer la plateforme JuriNapse
        </p>
      </div>

      {/* Navigation des sous-onglets */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {adminSubTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentSubTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Description de l'onglet actuel */}
        <div className="px-6 py-4 bg-gray-50">
          <p className="text-gray-600 text-sm">
            {adminSubTabs.find(tab => tab.id === currentSubTab)?.description}
          </p>
        </div>
      </div>

      {/* Contenu de l'onglet */}
      {renderContent()}
    </div>
  );
};

export default AdminPage;
