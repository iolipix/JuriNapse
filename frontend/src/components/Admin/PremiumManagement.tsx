import React, { useState, useEffect } from 'react';
import { Crown, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

interface GrantPremiumForm {
  userId: string;
  username: string;
  durationInDays: number | '';
}

const PremiumManagement: React.FC = () => {
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantForm, setGrantForm] = useState<GrantPremiumForm>({
    userId: '',
    username: '',
    durationInDays: 30
  });
  const [submitting, setSubmitting] = useState(false);

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

  // Attribuer le premium
  const handleGrantPremium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantForm.userId || submitting) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/admin/grant-premium', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jurinapse_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: grantForm.userId,
          durationInDays: grantForm.durationInDays || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'attribution du premium');
      }

      const data = await response.json();
      alert(`Premium ${grantForm.durationInDays ? 'temporaire' : 'permanent'} attribué avec succès à ${grantForm.username}`);
      
      // Recharger la liste et fermer le formulaire
      await loadPremiumUsers();
      setShowGrantForm(false);
      setGrantForm({ userId: '', username: '', durationInDays: 30 });
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Utilisateur
                </label>
                <input
                  type="text"
                  id="userId"
                  value={grantForm.userId}
                  onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ID de l'utilisateur"
                  required
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom d'utilisateur (référence)
                </label>
                <input
                  type="text"
                  id="username"
                  value={grantForm.username}
                  onChange={(e) => setGrantForm({ ...grantForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom d'utilisateur"
                />
              </div>
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Durée (jours)
              </label>
              <input
                type="number"
                id="duration"
                value={grantForm.durationInDays}
                onChange={(e) => setGrantForm({ ...grantForm, durationInDays: e.target.value ? parseInt(e.target.value) : '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de jours (laisser vide pour permanent)"
                min="1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Laissez vide ou 0 pour un premium permanent
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowGrantForm(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || !grantForm.userId}
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