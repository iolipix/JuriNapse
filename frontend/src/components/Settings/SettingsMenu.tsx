import React from 'react';

interface SettingsMenuProps {
  onNavigateToTab: (tab: string) => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onNavigateToTab }) => {
  const menuItems = [
    {
      id: 'blocked',
      label: 'Comptes bloqués',
      icon: '👤',
      description: 'Gérer les utilisateurs que vous avez bloqués',
      available: true
    },
    {
      id: 'password',
      label: 'Mot de passe',
      icon: '🔒',
      description: 'Changer votre mot de passe de connexion',
      available: true
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      description: 'Configurer vos préférences de notifications',
      available: true
    },
    {
      id: 'appearance',
      label: 'Apparence',
      icon: '🎨',
      description: 'Thème sombre/clair et personnalisation visuelle',
      available: true
    },
    {
      id: 'language',
      label: 'Langue',
      icon: '🌍',
      description: 'Choisir la langue de l\'interface',
      available: true
    },
    {
      id: 'cookies',
      label: 'Cookies et confidentialité',
      icon: '🍪',
      description: 'Gérer vos préférences de cookies et de confidentialité',
      available: true
    },
    {
      id: 'data',
      label: 'Données (RGPD)',
      icon: '📥',
      description: 'Télécharger ou supprimer vos données personnelles',
      available: false
    },
    {
      id: 'premium',
      label: 'Gestion Premium',
      icon: '👑',
      description: 'Voir votre statut premium et historique',
      available: true
    },
    {
      id: 'privacy',
      label: 'Confidentialité',
      icon: '🛡️',
      description: 'Paramètres de confidentialité et sécurité',
      available: false
    },
    {
      id: 'delete-account',
      label: 'Supprimer le compte',
      icon: '⚠️',
      description: 'Supprimer définitivement votre compte et toutes vos données',
      available: true,
      dangerous: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          </div>
        </div>
      </div>

      {/* Menu principal */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 grid-cols-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Clicked on:', item.id, 'Available:', item.available);
                if (item.available) {
                  onNavigateToTab(item.id);
                }
              }}
              disabled={!item.available}
              className={`
                p-6 bg-white rounded-lg shadow-sm border transition-all duration-200 text-left cursor-pointer
                ${item.available
                  ? (item.dangerous 
                    ? 'hover:shadow-md hover:border-red-200 hover:bg-red-50 border-red-100'
                    : 'hover:shadow-md hover:border-blue-200'
                  )
                  : 'opacity-60 cursor-not-allowed bg-gray-50'
                }
              `}
            >
              <div className="flex items-start space-x-4">
                <div className={`text-2xl ${!item.available ? 'opacity-50' : ''}`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2 ${!item.available ? 'line-through text-gray-900' : (item.dangerous ? 'text-red-700' : 'text-gray-900')}`}>
                    {item.label}
                    {!item.available && (
                      <span className="ml-2 bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-normal">
                        Bientôt
                      </span>
                    )}
                  </h3>
                  <p className={`text-sm ${item.dangerous ? 'text-red-600' : 'text-gray-600'}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
