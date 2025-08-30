import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Post } from '../types';
import api, { postsAPI } from '../services/api';
import { useAuth } from './AuthContext';

// Supprimer la configuration d'axios car elle est maintenant dans api.ts

interface PostContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMorePosts: () => Promise<void>;
  createPost: (postData: Omit<Post, 'id' | 'authorId' | 'author' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'comments' | 'likesWithTimestamp' | 'savesWithTimestamp'>) => Promise<void>;
  updatePost: (postId: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  getPostById: (postId: string) => Post | undefined;
  getPostBySlugOrId: (slugOrId: string) => Promise<Post | null>;
  getTrendingPosts: () => Promise<Post[]>;
  refreshPosts: () => Promise<void>;
  forceReloadPosts: () => Promise<void>; // New method for logout scenarios
  updateSavesCount: (postId: string, increment: number) => void; // Nouvelle méthode pour mettre à jour le compteur
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};

interface PostProviderProps {
  children: ReactNode;
}

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const hasInitializedRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  
  // Récupérer le contexte auth pour s'enregistrer au callback de logout
  const { setOnLogoutCallback } = useAuth();

  const loadPosts = useCallback(async (page = 1, reset = false) => {
    // Éviter les appels trop rapprochés (debounce)
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 2000) { // 2 secondes minimum entre les appels
      console.log('📝 LOAD DEBUG: Debounce active, skipping load');
      return;
    }
    lastLoadTimeRef.current = now;
    
    console.log('📝 LOAD DEBUG: Starting loadPosts, page:', page, 'reset:', reset);
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/posts?page=${page}&limit=12`); // 12 posts par page pour pagination claire
      console.log('📝 LOAD DEBUG: API response:', response.data?.posts?.length, 'posts received');
      
      if (response.data.success && response.data.posts) {
        // Mapper les données avec tous les champs nécessaires
        const mappedPosts = response.data.posts.map((post: any) => {
          const mappedPost = {
            id: post._id || post.id,
            _id: post._id || post.id,
            authorId: post.authorId._id || post.authorId,
            author: post.authorId.username ? {
              id: post.authorId._id || post.authorId.id || post.authorId,
              username: post.authorId.username || 'Utilisateur',
              firstName: post.authorId.firstName || '',
              lastName: post.authorId.lastName || '',
              isStudent: post.authorId.isStudent || false,
              profilePicture: post.authorId.profilePicture || null,
              joinedAt: new Date(post.authorId.createdAt || Date.now())
            } : {
              id: post.authorId._id || post.authorId.id || post.authorId,
              username: post.authorId.username || 'Utilisateur',
              email: post.authorId.email || '',
              firstName: post.authorId.firstName || '',
              lastName: post.authorId.lastName || '',
              isStudent: post.authorId.isStudent || false,
              profilePicture: post.authorId.profilePicture || null,
              joinedAt: new Date(post.authorId.createdAt || Date.now())
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
            // CHAMPS CRITIQUES - forcés explicitement
            pdfFile: post.pdfFile || null,
            isPrivate: Boolean(post.isPrivate),
            decisionNumber: post.decisionNumber || null,
            folderId: post.folderId || null
          };
          
          return mappedPost;
        });
        
        // Gestion de la pagination
        if (reset) {
          setPosts(mappedPosts);
          setCurrentPage(1);
        } else {
          setPosts(prevPosts => [...prevPosts, ...mappedPosts]);
        }
        
        // Vérifier s'il y a plus de posts
        const newHasMore = response.data.pagination && response.data.pagination.page < response.data.pagination.pages;
        setHasMore(newHasMore);
        setCurrentPage(page);
      } else {
        console.error('PostContext: Response not successful:', response.data);
        setError('Erreur lors du chargement des posts');
      }
    } catch (error: any) {
      console.error('PostContext: Exception during loadPosts:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du chargement des posts';
      setError(`Erreur lors du chargement des posts: ${errorMessage}`);
      
      // Si c'est un problème de cache ou de références, vider les posts et retry
      if (error.response?.status === 500) {
        console.log('PostContext: Server error detected, clearing posts and cache');
        setPosts([]);
        
        // Vider le localStorage pour forcer un refresh
        try {
          localStorage.removeItem('cachedPosts');
          localStorage.removeItem('lastPostsUpdate');
        } catch (e) {
          console.log('Could not clear localStorage');
        }
      } else {
        // Fallback to empty posts pour d'autres erreurs
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, []); // Pas de dépendances - loadPosts ne dépend que des paramètres

  useEffect(() => {
    // Charger les posts seulement une fois au montage de l'app
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Charger les posts directement ici pour éviter les dépendances
      const loadInitialPosts = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get('/posts?page=1&limit=12');
          if (response.data.success && response.data.posts) {
            const mappedPosts = response.data.posts.map((post: any) => {
              const mappedPost = {
                id: post._id || post.id,
                _id: post._id || post.id,
                authorId: post.authorId._id || post.authorId,
                author: post.authorId.username ? {
                  id: post.authorId._id || post.authorId.id || post.authorId,
                  username: post.authorId.username || 'Utilisateur',
                  firstName: post.authorId.firstName || '',
                  lastName: post.authorId.lastName || '',
                  isStudent: post.authorId.isStudent || false,
                  profilePicture: post.authorId.profilePicture || null,
                  joinedAt: new Date(post.authorId.createdAt || Date.now())
                } : {
                  id: post.authorId._id || post.authorId.id || post.authorId,
                  username: post.authorId.username || 'Utilisateur',
                  email: post.authorId.email || '',
                  firstName: post.authorId.firstName || '',
                  lastName: post.authorId.lastName || '',
                  isStudent: post.authorId.isStudent || false,
                  profilePicture: post.authorId.profilePicture || null,
                  joinedAt: new Date(post.authorId.createdAt || Date.now())
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
                // CHAMPS CRITIQUES - forcés explicitement
                pdfFile: post.pdfFile || null,
                isPrivate: Boolean(post.isPrivate),
                decisionNumber: post.decisionNumber || null,
                folderId: post.folderId || null
              };
              
              return mappedPost;
            });
            setPosts(mappedPosts);
            // Utiliser la même logique de pagination que loadPosts
            const newHasMore = response.data.pagination && response.data.pagination.page < response.data.pagination.pages;
            setHasMore(newHasMore);
            setCurrentPage(1);
          }
        } catch (error) {
          setError('Erreur lors du chargement des posts');
        } finally {
          setLoading(false);
        }
      };
      
      loadInitialPosts();
    }
  }, []); // Pas de dépendances - charge seulement au montage de l'app

  const createPost = useCallback(async (postData: Omit<Post, 'id' | 'authorId' | 'author' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'comments' | 'likesWithTimestamp' | 'savesWithTimestamp'>) => {
    setLoading(true);
    setError(null);
    try {
      // Ajouter les valeurs par défaut pour les nouveaux champs
      const postDataWithDefaults = {
        ...postData,
        savesCount: 0,
        likesWithTimestamp: [],
        savesWithTimestamp: []
      };
      
      const response = await api.post('/posts', postDataWithDefaults);
      if (response.data.success) {
        await loadPosts(1, true); // Refresh posts list with reset
      } else {
        throw new Error(response.data.message || 'Erreur lors de la création du post');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la création du post');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadPosts]);

  const updatePost = useCallback(async (postId: string, updates: Partial<Post>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/posts/${postId}`, updates);
      if (response.data.success) {
        await loadPosts(); // Refresh posts list
      } else {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour du post');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour du post');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadPosts]);

  const deletePost = useCallback(async (postId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/posts/${postId}`);
      if (response.data.success) {
        await loadPosts(); // Refresh posts list
      } else {
        throw new Error(response.data.message || 'Erreur lors de la suppression du post');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur serveur lors de la suppression du post');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadPosts]);

  const toggleLike = useCallback(async (postId: string) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      
      if (response.data.success && response.data.post) {
        // Mise à jour optimiste - pas besoin de recharger tous les posts
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? {
                  ...post,
                  likes: response.data.post.likes || response.data.post.likedBy?.length || 0,
                  likedBy: response.data.post.likedBy || []
                }
              : post
          )
        );
      } else {
        // Fallback - recharger tous les posts
        await loadPosts();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors du like');
      // En cas d'erreur, on recharge les posts pour être sûr d'avoir les bonnes données
      await loadPosts();
      throw error;
    }
  }, [loadPosts]);

  const addComment = useCallback(async (postId: string, content: string) => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, { content });
      if (response.data.success) {
        await loadPosts(); // Refresh posts list
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'ajout du commentaire');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de l\'ajout du commentaire');
      throw error;
    }
  }, [loadPosts]);

  const getPostById = useCallback((postId: string): Post | undefined => {
    return posts.find(post => post.id === postId);
  }, [posts]);

  const getPostBySlugOrId = useCallback(async (slugOrId: string): Promise<Post | null> => {
    try {
      // D'abord chercher dans les posts en cache
      const cachedPost = posts.find(post => post.id === slugOrId || post.slug === slugOrId);
      if (cachedPost) {
        return cachedPost;
      }

      // Sinon récupérer depuis l'API
      const response = await postsAPI.getPostBySlugOrId(slugOrId);
      if (response.success && response.data) {
        const post = {
          id: response.data._id,
          _id: response.data._id, // Ajout de l'ID MongoDB explicite
          authorId: response.data.authorId && typeof response.data.authorId === 'object' 
            ? (response.data.authorId._id || response.data.authorId.id) 
            : response.data.authorId || null,
          author: response.data.authorId || null,
          type: response.data.type,
          title: response.data.title,
          content: response.data.content,
          tags: response.data.tags || [],
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          likes: response.data.likes || 0,
          likedBy: response.data.likedBy || [],
          likesWithTimestamp: response.data.likesWithTimestamp || [],
          savesCount: response.data.savesCount || 0, // Compteur de sauvegardes
          savesWithTimestamp: response.data.savesWithTimestamp || [], // Timestamps des sauvegardes
          comments: response.data.comments || [],
          slug: response.data.slug,
          pdfFile: response.data.pdfFile ? {
            name: response.data.pdfFile.name,
            url: response.data.pdfFile.url,
            size: response.data.pdfFile.size,
            type: response.data.pdfFile.type || 'application/pdf'
          } : undefined
        };
        return post;
      }
      return null;
    } catch (error: any) {
      return null;
    }
  }, [posts]);

  const getTrendingPosts = useCallback(async (): Promise<Post[]> => {
    try {
      const response = await api.get('/posts/trending');
      if (response.data.success) {
        return response.data.data.map((post: any) => ({
          id: post._id,
          authorId: post.authorId._id || post.authorId,
          author: post.authorId,
          type: post.type,
          title: post.title,
          content: post.content,
          slug: post.slug, // Ajouter le slug du post
          tags: post.tags || [],
          createdAt: new Date(post.createdAt),
          updatedAt: new Date(post.updatedAt),
          likes: post.likedBy ? post.likedBy.length : 0,
          likedBy: post.likedBy || [],
          likesWithTimestamp: post.likesWithTimestamp || [],
          savesCount: post.savesCount || 0, // Compteur de sauvegardes
          savesWithTimestamp: post.savesWithTimestamp || [], // Timestamps des sauvegardes
          comments: post.comments || [],
          pdfFile: post.pdfFile,
          isPrivate: post.isPrivate || false,
          decisionNumber: post.decisionNumber,
          folderId: post.folderId
        }));
      }
      return [];
    } catch (error: any) {
      return [];
    }
  }, []);

  // Méthode pour mettre à jour le compteur de sauvegardes
  const updateSavesCount = useCallback((postId: string, increment: number) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, savesCount: Math.max(0, (post.savesCount || 0) + increment) }
          : post
      )
    );
  }, []);

  const refreshPosts = useCallback(async () => {
    await loadPosts(1, true);
  }, [loadPosts]);

  const forceReloadPosts = useCallback(async () => {
    console.log('📝 POST DEBUG: forceReloadPosts called - bypassing debounce');
    // Force reload without debounce restrictions for logout scenarios
    const originalTime = lastLoadTimeRef.current;
    lastLoadTimeRef.current = 0; // Reset debounce
    try {
      console.log('📝 POST DEBUG: Calling loadPosts with reset=true');
      await loadPosts(1, true);
      console.log('📝 POST DEBUG: loadPosts completed successfully');
    } catch (error) {
      console.log('📝 POST DEBUG: loadPosts error:', error);
    } finally {
      lastLoadTimeRef.current = originalTime;
    }
  }, [loadPosts]);

  // Enregistrer le callback de forceReloadPosts auprès d'AuthContext
  useEffect(() => {
    if (setOnLogoutCallback) {
      setOnLogoutCallback(forceReloadPosts);
    }
  }, [setOnLogoutCallback, forceReloadPosts]);

  const loadMorePosts = useCallback(async () => {
    if (hasMore && !loading) {
      await loadPosts(currentPage + 1, false);
    }
  }, [hasMore, loading, currentPage, loadPosts]);

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
        error,
        hasMore,
        loadMorePosts,
        createPost,
        updatePost,
        deletePost,
        toggleLike,
        addComment,
        getPostById,
        getPostBySlugOrId,
        getTrendingPosts,
        refreshPosts,
        forceReloadPosts,
        updateSavesCount,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
