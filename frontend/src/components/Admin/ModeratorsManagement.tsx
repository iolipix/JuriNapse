import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Shield, Search, X, UserPlus, Crown } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'user' | 'moderator' | 'administrator';
  profilePicture?: string;
}

interface ModeratorsManagementProps {
  onBack: () => void;
}

const ModeratorsManagement: React.FC<ModeratorsManagementProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [moderators, setModerators] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Charger les modérateurs existants
  useEffect(() => {
    loadModerators();
  }, []);

  // Rechercher des utilisateurs quand la query change
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadModerators = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/moderators', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setModerators(data.moderators || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des modérateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (searching) return;
    
    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/search-users?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrer les utilisateurs qui ne sont pas déjà modérateurs ou administrateurs
        const filteredUsers = data.users.filter((user: User) => 
          user.role === 'user' && !moderators.find(mod => mod._id === user._id)
        );
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setSearching(false);
    }
  };

  const handlePromoteToModerator = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/promote-moderator/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Recharger les modérateurs
        await loadModerators();
        // Enlever l'utilisateur des résultats de recherche
        setSearchResults(prev => prev.filter(user => user._id !== userId));
        setSearchQuery('');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la promotion:', error);
      alert('Erreur lors de la promotion de l\'utilisateur');
    }
  };

  const handleDemoteFromModerator = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir rétrograder ce modérateur ?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/demote-moderator/${userId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          // Recharger les modérateurs
          await loadModerators();
        } else {
          const error = await response.json();
          alert(`Erreur: ${error.message}`);
        }
      } catch (error) {
        console.error('Erreur lors de la rétrogradation:', error);
        alert('Erreur lors de la rétrogradation du modérateur');
      }
    }
  };

  const formatDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName} (@${user.username})`;
    }
    return `@${user.username}`;
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

      {/* Section recherche et promotion */}
      <div className="mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <UserPlus className="h-5 w-5 text-green-600 mr-2" />
            Promouvoir un utilisateur
          </h2>
          
          {/* Barre de recherche */}
          <div className="mb-4">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom d'utilisateur, prénom ou nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Résultats de recherche */}
          {searchQuery.length >= 2 && (
            <div className="border border-gray-200 rounded-lg">
              {searching ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Recherche en cours...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-gray-600">Aucun utilisateur trouvé</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {user.profilePicture ? (
                            <img 
                              src={user.profilePicture} 
                              alt={user.username}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{formatDisplayName(user)}</h3>
                          <p className="text-gray-600 text-sm">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePromoteToModerator(user._id)}
                        className="flex items-center space-x-2 px-4 py-2 text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <Crown className="h-4 w-4" />
                        <span>Promouvoir</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section modérateurs actuels */}
      <div className="mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            Modérateurs actuels ({moderators.length})
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Chargement...</p>
            </div>
          ) : moderators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun modérateur configuré pour le moment</p>
              <p className="text-gray-500 text-sm mt-1">
                Utilisez la recherche ci-dessus pour promouvoir des utilisateurs
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {moderators.map((moderator) => (
                <div key={moderator._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-blue-50">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {moderator.profilePicture ? (
                        <img 
                          src={moderator.profilePicture} 
                          alt={moderator.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <Shield className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{formatDisplayName(moderator)}</h3>
                      <p className="text-gray-600 text-sm">{moderator.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDemoteFromModerator(moderator._id)}
                    className="flex items-center justify-center p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                    title="Rétrograder ce modérateur"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
