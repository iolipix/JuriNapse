import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Post } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { usePost } from './PostContext';

interface SavedPostsContextType {
  savedPosts: Post[];
  loading: boolean;
  error: string | null;
  savePost: (postId: string) => Promise<void>;
  unsavePost: (postId: string) => Promise<void>;
  toggleSavePost: (postId: string) => Promise<void>;
  isPostSaved: (postId: string) => boolean;
  checkIfPostSaved: (postId: string) => Promise<boolean>;
  refreshSavedPosts: () => Promise<void>;
}

const SavedPostsContext = createContext<SavedPostsContextType | undefined>(undefined);

export const useSavedPosts = () => {
  const context = useContext(SavedPostsContext);
  if (!context) {
    throw new Error('useSavedPosts must be used within a SavedPostsProvider');
  }
  return context;
};

interface SavedPostsProviderProps {
  children: ReactNode;
}

export const SavedPostsProvider: React.FC<SavedPostsProviderProps> = ({ children }) => {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { updateSavesCount } = usePost(); // Récupérer la méthode pour mettre à jour les compteurs

  // Charger les posts sauvegardés
  const refreshSavedPosts = useCallback(async () => {
    if (!user) {
      setSavedPosts([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/users/saved-posts');
      if (response.data.success) {
        // Mapper les posts sauvegardés avec la même structure que dans PostContext
        const mappedPosts = response.data.savedPosts.map((post: any) => {
          return {
            id: post._id || post.id,
            _id: post._id || post.id,
            authorId: post.authorId._id || post.authorId,
            author: post.authorId ? {
              id: post.authorId._id || post.authorId.id || post.authorId,
              username: post.authorId.username || 'Utilisateur',
              firstName: post.authorId.firstName || '',
              lastName: post.authorId.lastName || '',
              isStudent: post.authorId.isStudent || false,
              profilePicture: post.authorId.profilePicture || null,
              joinedAt: new Date(post.authorId.createdAt || Date.now())
            } : {
              id: post.authorId._id || post.authorId.id || post.authorId,
              username: 'Utilisateur',
              email: '',
              firstName: '',
              lastName: '',
              isStudent: false,
              profilePicture: null,
              joinedAt: new Date()
            },
            type: post.type,
            title: post.title,
            content: post.content,
            slug: post.slug,
            tags: post.tags || [],
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.updatedAt),
            likes: post.likedBy ? post.likedBy.length : 0,
            likedBy: post.likedBy || [],
            likesWithTimestamp: post.likesWithTimestamp || [],
            savesCount: post.savesCount || 0, // Compteur de sauvegardes
            savesWithTimestamp: post.savesWithTimestamp || [], // Timestamps des sauvegardes
            comments: post.comments ? post.comments.slice(0, 3).map((comment: any) => ({
              id: comment._id || comment.id,
              postId: post._id || post.id,
              authorId: comment.authorId._id || comment.authorId,
              author: comment.authorId.username ? {
                id: comment.authorId._id || comment.authorId.id || comment.authorId,
                username: comment.authorId.username || 'Utilisateur',
                firstName: comment.authorId.firstName || '',
                lastName: comment.authorId.lastName || '',
                isStudent: comment.authorId.isStudent || false,
                profilePicture: comment.authorId.profilePicture || null,
                joinedAt: new Date(comment.authorId.createdAt || Date.now())
              } : {
                id: comment.authorId._id || comment.authorId,
                username: comment.authorId.username || 'Utilisateur',
                email: comment.authorId.email || '',
                firstName: comment.authorId.firstName || '',
                lastName: comment.authorId.lastName || '',
                isStudent: comment.authorId.isStudent || false,
                profilePicture: comment.authorId.profilePicture || null,
                joinedAt: new Date(comment.authorId.createdAt || Date.now())
              },
              content: comment.content,
              createdAt: new Date(comment.createdAt),
              updatedAt: new Date(comment.updatedAt),
              likes: comment.likedBy ? comment.likedBy.length : 0,
              likedBy: comment.likedBy || []
            })) : [],
            pdfFile: post.pdfFile || null,
            isPrivate: Boolean(post.isPrivate),
            decisionNumber: post.decisionNumber || null,
            folderId: post.folderId || null,
            savedAt: new Date(post.savedAt) // Maintenant nous avons la date de sauvegarde
          };
        });
        setSavedPosts(mappedPosts);
      } else {
        setError('Erreur lors du chargement des posts sauvegardés');
      }
    } catch (error: any) {
      setError('Erreur lors du chargement des posts sauvegardés');
      setSavedPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Sauvegarder un post
  const savePost = useCallback(async (postId: string) => {
    if (!user) {
      throw new Error('Vous devez être connecté pour sauvegarder un post');
    }

    try {
      const response = await api.post(`/posts/${postId}/save`);
      if (response.data.success) {
        // Mettre à jour le compteur dans PostContext
        updateSavesCount(postId, 1);
        // Recharger la liste des posts sauvegardés
        await refreshSavedPosts();
      } else {
        throw new Error(response.data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la sauvegarde du post');
    }
  }, [user, refreshSavedPosts, updateSavesCount]);

  // Désauvegarder un post
  const unsavePost = useCallback(async (postId: string) => {
    if (!user) {
      throw new Error('Vous devez être connecté pour désauvegarder un post');
    }

    try {
      const response = await api.delete(`/posts/${postId}/save`);
      if (response.data.success) {
        // Mettre à jour le compteur dans PostContext
        updateSavesCount(postId, -1);
        // Retirer le post de la liste locale
        setSavedPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      } else {
        throw new Error(response.data.message || 'Erreur lors de la désauvegarde');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la désauvegarde du post');
    }
  }, [user, updateSavesCount]);

  // Vérifier si un post est sauvegardé
  const isPostSaved = useCallback((postId: string): boolean => {
    return savedPosts.some(post => post.id === postId);
  }, [savedPosts]);

  // Vérifier si un post est sauvegardé côté serveur
  const checkIfPostSaved = useCallback(async (postId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await api.get(`/posts/${postId}/saved`);
      return response.data.isSaved;
    } catch (error) {
      return false;
    }
  }, [user]);

  // Toggle sauvegarder/désauvegarder un post
  const toggleSavePost = useCallback(async (postId: string) => {
    if (!user) {
      throw new Error('Vous devez être connecté pour sauvegarder un post');
    }

    const isSaved = isPostSaved(postId);
    
    if (isSaved) {
      await unsavePost(postId);
    } else {
      await savePost(postId);
    }
  }, [user, isPostSaved, savePost, unsavePost]);

  // Charger les posts sauvegardés au montage et quand l'utilisateur change
  useEffect(() => {
    if (user) {
      refreshSavedPosts();
    } else {
      setSavedPosts([]);
    }
  }, [user, refreshSavedPosts]);

  return (
    <SavedPostsContext.Provider
      value={{
        savedPosts,
        loading,
        error,
        savePost,
        unsavePost,
        toggleSavePost,
        isPostSaved,
        checkIfPostSaved,
        refreshSavedPosts,
      }}
    >
      {children}
    </SavedPostsContext.Provider>
  );
};
