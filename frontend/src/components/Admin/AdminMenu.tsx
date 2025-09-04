import React from 'react';
import { Shield, Users, FileText, BarChart3, Settings, AlertTriangle, ArrowLeft } from 'lucide-react';

interface AdminMenuProps {
  onNavigateToTab: (tab: string) => void;
  onBack?: () => void;
}

const AdminMenu: React.FC<AdminMenuProps> = ({ onNavigateToTab, onBack }) => {
  const adminMenuItems = [
    {
      id: 'moderators',
      title: 'Gestion des modérateurs',
      description: 'Gérer les rôles et permissions des modérateurs',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'users',
      title: 'Gestion des utilisateurs',
      description: 'Modérer et gérer tous les utilisateurs de la plateforme',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'content',
      title: 'Modération du contenu',
      description: 'Gérer les posts, commentaires et signalements',
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'analytics',
      title: 'Statistiques',
      description: 'Statistiques détaillées et analyses de la plateforme',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'system',
      title: 'Configuration système',
      description: 'Paramètres globaux, maintenance et configuration',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </button>
        )}
        
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
        </div>
        <p className="text-gray-600">
          Panneau d'administration pour gérer la plateforme JuriNapse
        </p>
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigateToTab(item.id)}
              className={`text-left p-6 rounded-lg border ${item.borderColor} ${item.bgColor} hover:shadow-md transition-all duration-200 group`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${item.bgColor} border ${item.borderColor} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations importantes</h3>
        <ul className="text-gray-600 text-sm space-y-2">
          <li>• Toutes les actions d'administration sont enregistrées dans les logs système</li>
          <li>• Les modifications importantes nécessitent une confirmation supplémentaire</li>
          <li>• En cas de problème, contactez l'équipe technique immédiatement</li>
          <li>• La sauvegarde automatique est effectuée quotidiennement à 3h00</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminMenu;
