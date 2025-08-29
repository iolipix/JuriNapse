import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';
import { fixProfilePictureUrl } from '../utils/apiUrlFixer';

interface AuthContextType {
  user: User | null;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  loginWithToken: (token: string, userData: any) => void; // Nouvelle méthode pour connexion par code
  register: (userData: Omit<User, 'id' | 'joinedAt'>, password: string) => Promise<{ success: boolean; user?: any; needsVerification?: boolean }>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  deleteAccount: (password: string) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
  completeEmailVerification: (userData: any) => void;
  isLoading: boolean;
  needsEmailVerification: boolean;
  pendingVerificationUserId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [pendingVerificationUserId, setPendingVerificationUserId] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Fonction utilitaire pour créer un objet utilisateur
  const createUserData = React.useCallback((userData: any) => ({
    id: userData.id,
    email: userData.email,
    username: userData.username,
    firstName: userData.firstName,
    lastName: userData.lastName,
    university: userData.university,
    graduationYear: userData.graduationYear,
    isStudent: userData.isStudent,
    bio: userData.bio,
    profilePicture: fixProfilePictureUrl(userData.profilePicture), // Fix des URLs Vercel → Railway
    joinedAt: new Date(userData.joinedAt)
  }), []);

  const checkAuth = React.useCallback(async () => {
    // Éviter les appels multiples - ne charge qu'une fois
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    setIsLoading(true);
    
    try {
      const response = await authAPI.getProfile();
      
      if (response.success) {
        setUser(createUserData(response.user));
      } else {
        setUser(null);
      }
    } catch (error) {
      // En cas d'erreur (token expiré, etc.), déconnecter l'utilisateur
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [createUserData]);

  useEffect(() => {
    // Vérifier l'authentification au montage du composant
    checkAuth();
  }, []); // Pas de dépendances - ne charge qu'une fois au montage

  const login = React.useCallback(async (emailOrUsername: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(emailOrUsername, password);
      
      if (response.success) {
        setUser(createUserData(response.user));
        
        // Sauvegarder le token dans localStorage pour fallback
        if (response.token) {
          localStorage.setItem('jurinapse_token', response.token);
        }
        
        return true;
      } else if (response.requiresVerification) {
        // L'utilisateur doit vérifier son email
        setNeedsEmailVerification(true);
        setPendingVerificationUserId(response.userId || response.email);
        return false;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      console.log('🔍 DEBUG - Login error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.response?.data?.message,
        requiresVerification: error.response?.data?.requiresVerification
      });
      
      // Vérifier si l'erreur est liée à la vérification d'email
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || '';
      const statusCode = error.response?.status;
      
      // Status 403 avec requiresVerification = compte non vérifié
      if (statusCode === 403 && errorData?.requiresVerification) {
        console.log('🚫 Account requires verification - redirecting to verification page');
        console.log('🔍 DEBUG - Setting needsEmailVerification = true');
        setNeedsEmailVerification(true);
        setPendingVerificationUserId(errorData?.userId || errorData?.email || (emailOrUsername.includes('@') ? emailOrUsername : null));
        return false;
      }
      
      // Autres cas de vérification d'email
      if (errorData?.requiresVerification || errorData?.needsEmailVerification || errorMessage.includes('vérifi') || errorMessage.includes('activ')) {
        console.log('🔍 DEBUG - Fallback verification condition matched');
        setNeedsEmailVerification(true);
        // Utiliser l'userId fourni par le serveur ou l'email comme fallback
        setPendingVerificationUserId(errorData?.userId || (emailOrUsername.includes('@') ? emailOrUsername : null));
      }
      
      return false;
    }
  }, [createUserData]);

  // Nouvelle méthode pour connexion avec token (après validation email)
  const loginWithToken = React.useCallback((token: string, userData: any) => {
    // Sauvegarder le token
    localStorage.setItem('jurinapse_token', token);
    
    // Créer l'objet utilisateur avec les données reçues
    const user = createUserData(userData);
    setUser(user);
  }, [createUserData]);

  const register = React.useCallback(async (userData: Omit<User, 'id' | 'joinedAt'>, password: string): Promise<{ success: boolean; user?: any; needsVerification?: boolean }> => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.register(userData, password);
      
      if (response.success) {
        // Ne pas connecter automatiquement l'utilisateur, il doit vérifier son email
        setNeedsEmailVerification(true);
        setPendingVerificationUserId(response.user.id);
        
        setIsLoading(false);
        return { 
          success: true, 
          user: response.user, 
          needsVerification: true 
        };
      }
      
      setIsLoading(false);
      return { success: false };
    } catch (error) {
      console.error('Register error:', error);
      setIsLoading(false);
      return { success: false };
    }
  }, []);

  const completeEmailVerification = React.useCallback((userData: any) => {
    setUser(createUserData(userData));
    setNeedsEmailVerification(false);
    setPendingVerificationUserId(null);
  }, [createUserData]);

  const logout = React.useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = React.useCallback(async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    try {      const response = await authAPI.updateProfile(userData);      
      if (response.success) {
        setUser(createUserData(response.user));        return true;
      }      return false;
    } catch (error) {      return false;
    }
  }, [user, createUserData]);

  const deleteAccount = React.useCallback(async (password: string): Promise<boolean> => {
    console.log('🔐 AUTH DEBUG: deleteAccount called with password length:', password.length);
    if (!user) {
      console.log('🔐 AUTH DEBUG: No user found, returning false');
      return false;
    }
    
    try {
      console.log('🔐 AUTH DEBUG: Calling authAPI.deleteAccount');
      const response = await authAPI.deleteAccount(password);
      console.log('🔐 AUTH DEBUG: API response:', response);
      
      if (response.success) {
        console.log('🔐 AUTH DEBUG: Success - logging out user');
        // Après la suppression, déconnecter l'utilisateur
        logout();
        return true;
      }
      console.log('🔐 AUTH DEBUG: API returned success=false');
      return false;
    } catch (error) {
      console.error('🔐 AUTH DEBUG: Exception caught:', error);
      return false;
    }
  }, [user, logout]);

  const refreshUserData = React.useCallback(async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success) {
        setUser(createUserData(response.user));
      }
    } catch (error) {    }
  }, [createUserData]);

  const value: AuthContextType = {
    user,
    login,
    loginWithToken,
    register,
    logout,
    updateProfile,
    deleteAccount,
    refreshUserData,
    completeEmailVerification,
    isLoading,
    needsEmailVerification,
    pendingVerificationUserId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};