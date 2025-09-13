import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  
  // CRITICAL FIX: Ne pas utiliser useAuth() directement pour éviter les hooks conditionnels
  // Le contexte auth sera géré différemment pour éviter React error #310

  // CRITICAL FIX: Simplifier loadPosts sans useCallback pour éviter les dépendances circulaires
  const loadPosts = async (page = 1, reset = false) => {
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
  }; // REMOVED useCallback to fix React error #310

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

  // CRITICAL FIX: Supprimer useCallback pour éviter les dépendances circulaires
  const createPost = async (postData: Omit<Post, 'id' | 'authorId' | 'author' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'comments' | 'likesWithTimestamp' | 'savesWithTimestamp'>) => {
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
  };

  const updatePost = async (postId: string, updates: Partial<Post>) => {
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
  };

  const deletePost = async (postId: string) => {
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
  };

  const toggleLike = async (postId: string) => {
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
  };

  const addComment = async (postId: string, content: string) => {
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
  };

  const getPostById = (postId: string): Post | undefined => {
    return posts.find(post => post.id === postId);
  };

  const getPostBySlugOrId = async (slugOrId: string): Promise<Post | null> => {
    try {
      // D'abord chercher dans les posts en cache
      const cachedPost = posts.find(post => post.id === slugOrId || post.slug === slugOrId);
      if (cachedPost) {
        return cachedPost;
      }

      // Sinon récupérer depuis l'API avec headers anti-cache
      const response = await postsAPI.getPostBySlugOrId(slugOrId);
      if (response.success && response.post) {
        const postData = response.post; // API retourne { success: true, post: {...} }
        const post = {
          id: postData._id,
          _id: postData._id, // Ajout de l'ID MongoDB explicite
          authorId: postData.authorId && typeof postData.authorId === 'object' 
            ? (postData.authorId._id || postData.authorId.id) 
            : postData.authorId || null,
          author: postData.authorId || null,
          type: postData.type,
          title: postData.title,
          content: postData.content,
          tags: postData.tags || [],
          createdAt: new Date(postData.createdAt),
          updatedAt: new Date(postData.updatedAt),
          likes: postData.likedBy ? postData.likedBy.length : 0,
          likedBy: postData.likedBy || [],
          likesWithTimestamp: postData.likesWithTimestamp || [],
          savesCount: postData.savesCount || 0, // Compteur de sauvegardes
          savesWithTimestamp: postData.savesWithTimestamp || [], // Timestamps des sauvegardes
          comments: postData.comments || [],
          slug: postData.slug,
          pdfFile: postData.pdfFile ? {
            name: postData.pdfFile.name,
            url: postData.pdfFile.url,
            size: postData.pdfFile.size,
            type: postData.pdfFile.type || 'application/pdf'
          } : undefined,
          isPrivate: postData.isPrivate || false,
          decisionNumber: postData.decisionNumber || null,
          folderId: postData.folderId || null
        };
        return post;
      }
      return null;
    } catch (error: any) {
      return null;
    }
  };

  const getTrendingPosts = async (): Promise<Post[]> => {
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
  };

  // Méthode pour mettre à jour le compteur de sauvegardes
  const updateSavesCount = (postId: string, increment: number) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, savesCount: Math.max(0, (post.savesCount || 0) + increment) }
          : post
      )
    );
  };

  const refreshPosts = async () => {
    await loadPosts(1, true);
  };

  const forceReloadPosts = async () => {
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
  };

  // Enregistrer le callback de forceReloadPosts auprès d'AuthContext
  // REMOVED: authContext usage to fix React error #310
  // useEffect(() => {
  //   if (authContext && authContext.setOnLogoutCallback) {
  //     authContext.setOnLogoutCallback(forceReloadPosts);
  //   }
  // }, [forceReloadPosts]);

  const loadMorePosts = async () => {
    if (hasMore && !loading) {
      await loadPosts(currentPage + 1, false);
    }
  };

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
