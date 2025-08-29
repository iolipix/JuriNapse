import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'joinedAt'>, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  refreshUserData: () => Promise<void>;
  isLoading: boolean;
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
    profilePicture: userData.profilePicture,
    joinedAt: new Date(userData.joinedAt)
  }), []);

  const checkAuth = React.useCallback(async () => {
    // Éviter les appels multiples - ne charge qu'une fois
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    try {
      const response = await authAPI.getProfile();
      
      if (response.success) {
        setUser(createUserData(response.user));
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [createUserData]);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté - seulement au montage de l'app
    checkAuth();
  }, []); // Pas de dépendances - charge seulement au montage de l'app

  const login = React.useCallback(async (emailOrUsername: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(emailOrUsername, password);
      
      if (response.success) {
        setUser(createUserData(response.user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, [createUserData]);

  const register = React.useCallback(async (userData: Omit<User, 'id' | 'joinedAt'>, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.register(userData, password);
      
      if (response.success) {
        setUser(createUserData(response.user));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {      setIsLoading(false);
      return false;
    }
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

  const deleteAccount = React.useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await authAPI.deleteAccount();
      if (response.success) {
        // Après la suppression, déconnecter l'utilisateur
        logout();
        return true;
      }
      return false;
    } catch (error) {
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
    register,
    logout,
    updateProfile,
    deleteAccount,
    refreshUserData,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};