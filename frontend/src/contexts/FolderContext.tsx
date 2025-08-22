import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Folder } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface FolderContextType {
  folders: Folder[];
  loading: boolean;
  error: string | null;
  createFolder: (folderData: Omit<Folder, 'id' | 'owner' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFolder: (folderId: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  getFolderById: (folderId: string) => Folder | undefined;
  loadFolders: () => Promise<void>;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

interface FolderProviderProps {
  children: ReactNode;
}

export const FolderProvider: React.FC<FolderProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Éviter les recharges inutiles
  const loadedForUser = React.useRef<string | null>(null);

  useEffect(() => {
    // Ne charger que si l'utilisateur change
    if (user && loadedForUser.current !== user.id) {
      loadedForUser.current = user.id;
      loadFolders();
    } else if (!user) {
      loadedForUser.current = null;
      setFolders([]);
    }
  }, [user]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/folders');
      
      const foldersData = Array.isArray(response.data?.data) ? response.data.data : 
                         Array.isArray(response.data) ? response.data : [];
      
      // Map MongoDB _id to id for consistency
      const mappedFolders = foldersData.map((folder: any) => ({
        ...folder,
        id: folder._id || folder.id
      }));
      
      setFolders(mappedFolders);
    } catch (err) {
      setError('Erreur lors du chargement des dossiers');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (folderData: Omit<Folder, 'id' | 'owner' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/folders', folderData);
      setFolders(prev => [...prev, response.data]);
    } catch (err) {
      setError('Erreur lors de la création du dossier');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateFolder = async (folderId: string, updates: Partial<Folder>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put('/folders/' + folderId, updates);
      setFolders(prev => prev.map(folder => 
        (folder.id === folderId || folder._id === folderId) ? response.data : folder
      ));
    } catch (err) {
      setError('Erreur lors de la mise à jour du dossier');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.delete('/folders/' + folderId);
      
      // Vérifier si la réponse indique un succès
      if (response.data?.success === false) {
        throw new Error(response.data.message || 'Erreur lors de la suppression du dossier');
      }
      
      setFolders(prev => prev.filter(folder => 
        folder.id !== folderId && folder._id !== folderId
      ));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la suppression du dossier';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFolderById = (folderId: string): Folder | undefined => {
    return folders.find(folder => folder.id === folderId || folder._id === folderId);
  };

  const value: FolderContextType = {
    folders: Array.isArray(folders) ? folders : [],
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    getFolderById,
    loadFolders
  };

  return (
    <FolderContext.Provider value={value}>
      {children}
    </FolderContext.Provider>
  );
};

export const useFolder = (): FolderContextType => {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error('useFolder must be used within a FolderProvider');
  }
  return context;
};
