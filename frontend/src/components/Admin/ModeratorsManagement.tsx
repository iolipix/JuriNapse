import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Shield, AlertTriangle, UserCheck, UserX, Search } from 'lucide-react';

interface ModeratorsManagementProps {
  onBack: () => void;
}

const ModeratorsManagement: React.FC<ModeratorsManagementProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [moderators, setModerators] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Charger les données depuis l'API
    setLoading(false);
    // Données de démonstration
    setModerators([]);
    setUsers([]);
  }, []);

  const handlePromoteToModerator = async (userId: string) => {
    // TODO: Implémenter la promotion
    console.log('Promouvoir utilisateur:', userId);
  };

  const handleDemoteFromModerator = async (userId: string) => {
    // TODO: Implémenter la rétrogradation
    console.log('Rétrograder modérateur:', userId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header avec retour */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au panneau d'administration
        </button>
        
        <div className="flex items-center space-x-3 mb-2">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gestion des modérateurs</h1>
        </div>
        <p className="text-gray-600">
          Gérez les rôles et permissions des modérateurs de la plateforme
        </p>
      </div>

      {/* Section modérateurs actuels */}
      <div className="mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            Modérateurs actuels
          </h2>
          
          {moderators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun modérateur configuré pour le moment</p>
              <p className="text-gray-500 text-sm mt-1">
                Utilisez la section ci-dessous pour promouvoir des utilisateurs
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {moderators.map((moderator) => (
                <div key={moderator.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{moderator.username}</h3>
                      <p className="text-gray-600 text-sm">{moderator.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDemoteFromModerator(moderator.id)}
                    className="flex items-center space-x-2 px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <UserX className="h-4 w-4" />
                    <span>Rétrograder</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section promotion d'utilisateurs */}
      <div className="mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <UserCheck className="h-5 w-5 text-green-600 mr-2" />
            Promouvoir des utilisateurs
          </h2>
          
          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Fonctionnalité en développement */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-yellow-800 font-medium">Fonctionnalité en développement</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  La recherche et la promotion d'utilisateurs sera disponible dans une prochaine mise à jour.
                  Cette interface vous permettra de :
                </p>
                <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                  <li>• Rechercher des utilisateurs par nom ou email</li>
                  <li>• Consulter leur profil et historique</li>
                  <li>• Les promouvoir au rang de modérateur</li>
                  <li>• Configurer leurs permissions spécifiques</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations sur les permissions */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions des modérateurs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Autorisations accordées :</h4>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• Modérer les posts et commentaires</li>
              <li>• Supprimer du contenu inapproprié</li>
              <li>• Avertir et suspendre des utilisateurs</li>
              <li>• Accéder aux signalements</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Restrictions :</h4>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• Ne peuvent pas supprimer d'autres modérateurs</li>
              <li>• Accès limité aux statistiques globales</li>
              <li>• Ne peuvent pas modifier les paramètres système</li>
              <li>• Toutes leurs actions sont enregistrées</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeratorsManagement;
