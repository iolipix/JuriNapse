import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api';

interface Post {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    username: string;
  };
  folderId?: string;
  createdAt: string;
}

interface AddPostToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  onPostAdded: (post: Post) => void;
}

const AddPostToFolderModal: React.FC<AddPostToFolderModalProps> = ({
  isOpen,
  onClose,
  folderId,
  onPostAdded,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPostId(null); // Reset la sélection quand le modal s'ouvre
      fetchUserPosts();
    }
  }, [isOpen]);

  const fetchUserPosts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/posts/user');
      const data = response.data;
      
      // Filtrer les posts qui ne sont pas déjà dans ce dossier
      const availablePosts = data.filter((post: Post) => 
        !post.folderId || post.folderId !== folderId
      );
      
      setPosts(availablePosts);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPost = async () => {
    if (!selectedPostId) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/posts/${selectedPostId}/move-to-folder`, { folderId });
      const updatedPost = response.data;
      onPostAdded(updatedPost);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de l\'ajout du post');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          (e.currentTarget as any)._mouseDownOnBackdrop = true;
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && (e.currentTarget as any)._mouseDownOnBackdrop) {
          onClose();
        }
        (e.currentTarget as any)._mouseDownOnBackdrop = false;
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Ajouter un post au dossier
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun post disponible à ajouter</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                {selectedPostId ? (
                  <span className="text-blue-600">✓ 1 post sélectionné</span>
                ) : (
                  <span>Cliquez sur un post pour le sélectionner</span>
                )}
              </div>
              {posts.map((post, index) => {
                const isSelected = selectedPostId === post._id;
                
                return (
                  <div
                    key={`${post._id}-${index}`}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const newSelectedId = isSelected ? null : post._id;
                      setSelectedPostId(newSelectedId);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 mb-1">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-600 overflow-hidden" style={{ 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical' 
                        }}>
                          {post.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAddPost}
              disabled={!selectedPostId || loading}
              className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                !selectedPostId || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPostToFolderModal;
