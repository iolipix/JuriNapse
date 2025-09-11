// Configuration de l'API
// const API_BASE_URL = 'http://10.113.74.55:5000'; // IP locale pour mobile
// const API_BASE_URL = 'http://localhost:5000'; // Pour le développement local
const API_BASE_URL = 'https://jurinapse-production.up.railway.app'; // URL de production

// Types pour TypeScript
export interface LoginData {
  emailOrUsername: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  university: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  university: string;
  roles: string;
  isEmailVerified: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  requiresVerification?: boolean;
}

// Service d'authentification
class AuthService {
  private token: string | null = null;

  // Méthode utilitaire pour faire des requêtes HTTP
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}/api/auth${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      defaultHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      console.log(`📡 API Response (${response.status}):`, data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  // Connexion
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/login', {
        method: 'POST',
        body: JSON.stringify({
          emailOrUsername: loginData.emailOrUsername,
          password: loginData.password
        }),
      });

      // Si la connexion réussit, stocker le token
      if (response.success && response.token) {
        this.token = response.token;
      }

      return response;
    } catch (error) {
      // Vérifier si c'est une erreur de vérification d'email (status 403)
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('403') || errorMessage.includes('vérifi') || errorMessage.includes('activ')) {
          return {
            success: false,
            message: 'Vous devez vérifier votre email avant de pouvoir vous connecter.',
            requiresVerification: true,
          };
        }
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Email/pseudo ou mot de passe incorrect',
      };
    }
  }

  // Inscription
  async register(registerData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
      });

      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur d\'inscription',
      };
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await this.makeRequest('/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.warn('Erreur lors de la déconnexion:', error);
    } finally {
      // Toujours supprimer le token local
      this.token = null;
    }
  }

  // Récupérer le profil utilisateur
  async getProfile(): Promise<User | null> {
    try {
      if (!this.token) {
        throw new Error('Aucun token d\'authentification');
      }

      const response = await this.makeRequest('/profile');
      return response.user || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  // Récupérer le token actuel
  getToken(): string | null {
    return this.token;
  }

  // Définir le token (pour la restauration de session)
  setToken(token: string): void {
    this.token = token;
  }

  // Effacer le token
  clearToken(): void {
    this.token = null;
  }
}

// Export d'une instance unique du service
export const authService = new AuthService();
export default authService;
