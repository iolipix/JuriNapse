// Configuration de l'URL de l'API
const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  return 'https://jurinapse-production.up.railway.app/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'moderator' | 'administrator';
  isActive: boolean;
  createdAt: string;
  university?: string;
}

export interface UsersPaginationResponse {
  success: boolean;
  users: AdminUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface RoleStats {
  role: 'user' | 'moderator' | 'administrator';
  count: number;
}

export interface RoleStatsResponse {
  success: boolean;
  stats: RoleStats[];
}

export const adminAPI = {
  /**
   * Obtenir tous les utilisateurs avec pagination et filtres
   */
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<UsersPaginationResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);

    const response = await fetch(`${API_BASE_URL}/admin/users?${searchParams}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des utilisateurs');
    }

    return await response.json();
  },

  /**
   * Mettre à jour le rôle d'un utilisateur
   */
  updateUserRole: async (userId: string, role: 'user' | 'moderator' | 'administrator'): Promise<{ success: boolean; message: string; user: any }> => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ role })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour du rôle');
    }

    return await response.json();
  },

  /**
   * Activer/Désactiver un utilisateur
   */
  toggleUserActive: async (userId: string): Promise<{ success: boolean; message: string; user: any }> => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-active`, {
      method: 'PUT',
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la modification du statut');
    }

    return await response.json();
  },

  /**
   * Obtenir les statistiques des rôles
   */
  getRoleStats: async (): Promise<RoleStatsResponse> => {
    const response = await fetch(`${API_BASE_URL}/admin/role-stats`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }

    return await response.json();
  }
};
