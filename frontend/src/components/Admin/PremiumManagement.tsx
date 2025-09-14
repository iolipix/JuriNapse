import React, { useState, useEffect } from 'react';
import { Crown, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';

interface PremiumUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  premiumInfo: {
    hasPremium: boolean;
    isPermanent: boolean;
    expiresAt: string | null;
    grantedBy: { id: string; username: string } | null;
    grantedAt: string | null;
    daysRemaining: number | null;
  };
}

interface SearchUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isStudent?: boolean;
  university?: string;
}

interface GrantPremiumForm {
  selectedUser: SearchUser | null;
  expiresAt: string; // Format datetime-local
  isPermanent: boolean;
}

const PremiumManagement: React.FC = () => {
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantForm, setGrantForm] = useState<GrantPremiumForm>({
    selectedUser: null,
    expiresAt: '',
    isPermanent: false
  });
  const [submitting, setSubmitting] = useState(false);
  
  // États pour la recherche d'utilisateurs
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Charger la liste des utilisateurs premium
  const loadPremiumUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/premium-users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jurinapse_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs premium');
      }

      const data = await response.json();
      setPremiumUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPremiumUsers();
  }, []);

  // Rechercher des utilisateurs
  const searchUsers = async (query: string) => {
    console.log('🔍 Recherche d\'utilisateurs avec query:', query);
    
    if (query.length < 2) {
      console.log('❌ Query trop courte, arrêt de la recherche');
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const url = `/api/admin/users?search=${encodeURIComponent(query)}&limit=10`;
      const token = localStorage.getItem('jurinapse_token');
      
      console.log('📡 Appel API vers:', url);
      console.log('🔑 Token présent:', !!token);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Réponse reçue - Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP:', response.status, errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Données reçues:', data);
      console.log('👥 Nombre d\'utilisateurs trouvés:', data.users?.length || 0);
      
      setSearchResults(data.users || []);
      setShowSearchResults(true);
    } catch (err) {
      console.error('💥 Erreur de recherche complète:', err);
      setError(`Erreur de recherche: ${err.message}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Gérer le changement de recherche avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Sélectionner un utilisateur
  const selectUser = (user: SearchUser) => {
    setGrantForm({ ...grantForm, selectedUser: user });
    setSearchQuery(`${user.firstName} ${user.lastName} (@${user.username})`);
    setShowSearchResults(false);
  };

  // Attribuer le premium
  const handleGrantPremium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantForm.selectedUser || submitting) return;

    try {
      setSubmitting(true);
      
      // Calculer la date d'expiration ou null pour permanent
      let expiresAt = null;
      if (!grantForm.isPermanent && grantForm.expiresAt) {
        expiresAt = new Date(grantForm.expiresAt).toISOString();
      }
      
      const response = await fetch('/api/admin/grant-premium', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jurinapse_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: grantForm.selectedUser._id,
          expiresAt: expiresAt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'attribution du premium');
      }

      const data = await response.json();
      alert(`Premium ${grantForm.isPermanent ? 'permanent' : 'temporaire'} attribué avec succès à ${grantForm.selectedUser.username}`);
      
      // Recharger la liste et fermer le formulaire
      await loadPremiumUsers();
      setShowGrantForm(false);
      setGrantForm({ selectedUser: null, expiresAt: '', isPermanent: false });
      setSearchQuery('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  // Révoquer le premium
  const handleRevokePremium = async (userId: string, username: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir révoquer le premium de ${username} ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/revoke-premium/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jurinapse_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la révocation du premium');
      }

      alert(`Premium révoqué avec succès pour ${username}`);
      await loadPremiumUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  // Nettoyer les premiums expirés
  const handleCleanupExpired = async () => {
    if (!confirm('Êtes-vous sûr de vouloir nettoyer tous les premiums expirés ?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/cleanup-expired-premiums', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jurinapse_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du nettoyage');
      }

      const data = await response.json();
      alert(`Nettoyage terminé. ${data.modifiedCount} utilisateurs affectés.`);
      await loadPremiumUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (user: PremiumUser) => {
    if (!user.premiumInfo.hasPremium) return 'text-gray-500';
    if (user.premiumInfo.isPermanent) return 'text-green-600';
    if (user.premiumInfo.daysRemaining && user.premiumInfo.daysRemaining <= 7) return 'text-red-600';
    return 'text-blue-600';
  };

  const getStatusIcon = (user: PremiumUser) => {
    if (!user.premiumInfo.hasPremium) return <XCircle className="h-4 w-4" />;
    if (user.premiumInfo.isPermanent) return <Crown className="h-4 w-4" />;
    if (user.premiumInfo.daysRemaining && user.premiumInfo.daysRemaining <= 7) return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Crown className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Gestion du Premium</h3>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowGrantForm(!showGrantForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Crown className="h-4 w-4 mr-2" />
              Attribuer Premium
            </button>
            <button
              onClick={handleCleanupExpired}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Clock className="h-4 w-4 mr-2" />
              Nettoyer expirés
            </button>
          </div>
        </div>

        <p className="text-gray-600">
          Gérez les abonnements premium de vos utilisateurs. Vous pouvez attribuer un premium temporaire ou permanent, 
          consulter les expiration et révoquer les abonnements.
        </p>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-red-800 font-medium">Erreur</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Formulaire d'attribution */}
      {showGrantForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Attribuer le Premium</h4>
          <form onSubmit={handleGrantPremium} className="space-y-4">
            {/* Recherche d'utilisateur */}
            <div>
              <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-1">
                Rechercher un utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="userSearch"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tapez le nom, nom d'utilisateur ou email..."
                  autoComplete="off"
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              
              {/* Résultats de recherche */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => selectUser(user)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-medium">
                              {user.firstName?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                          {user.university && (
                            <p className="text-xs text-gray-400">{user.university}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.isStudent ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.isStudent ? 'Étudiant' : 'Professionnel'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Utilisateur sélectionné */}
              {grantForm.selectedUser && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">
                          {grantForm.selectedUser.firstName?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {grantForm.selectedUser.firstName} {grantForm.selectedUser.lastName}
                        </p>
                        <p className="text-sm text-gray-500">@{grantForm.selectedUser.username}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGrantForm({ ...grantForm, selectedUser: null });
                        setSearchQuery('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Type de premium */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type de premium
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="premiumType"
                    checked={grantForm.isPermanent}
                    onChange={() => setGrantForm({ ...grantForm, isPermanent: true, expiresAt: '' })}
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Premium permanent</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="premiumType"
                    checked={!grantForm.isPermanent}
                    onChange={() => setGrantForm({ ...grantForm, isPermanent: false })}
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Premium temporaire</span>
                </label>
              </div>
            </div>

            {/* Date et heure d'expiration (si temporaire) */}
            {!grantForm.isPermanent && (
              <div>
                <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-1">
                  Date et heure d'expiration
                </label>
                <input
                  type="datetime-local"
                  id="expiresAt"
                  value={grantForm.expiresAt}
                  onChange={(e) => setGrantForm({ ...grantForm, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Sélectionnez la date et l'heure exacte d'expiration du premium
                </p>
              </div>
            )}

            {/* Boutons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowGrantForm(false);
                  setGrantForm({ selectedUser: null, expiresAt: '', isPermanent: false });
                  setSearchQuery('');
                }}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || !grantForm.selectedUser}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Attribution...' : 'Attribuer Premium'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des utilisateurs premium */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Utilisateurs Premium ({premiumUsers.length})
        </h4>
        
        {premiumUsers.length === 0 ? (
          <div className="text-center py-8">
            <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun utilisateur premium pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Utilisateur</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Statut</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Expiration</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Attribué par</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {premiumUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">@{user.username}</div>
                        <div className="text-sm text-gray-500">{user.fullName}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`flex items-center space-x-2 ${getStatusColor(user)}`}>
                        {getStatusIcon(user)}
                        <span className="text-sm font-medium">
                          {user.premiumInfo.isPermanent ? 'Permanent' : 
                           user.premiumInfo.daysRemaining ? `${user.premiumInfo.daysRemaining} jours` : 'Expiré'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.premiumInfo.isPermanent ? 'Jamais' : formatDate(user.premiumInfo.expiresAt)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.premiumInfo.grantedBy ? user.premiumInfo.grantedBy.username : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleRevokePremium(user.id, user.username)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Révoquer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumManagement;