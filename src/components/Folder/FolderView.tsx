import React, { useState } from 'react';
import { ArrowLeft, Folder, FolderPlus, MoreVertical, Trash2, Check, Plus } from 'lucide-react';
import { useFolder } from '../../contexts/FolderContext';
import { usePost } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';
import FolderCard from './FolderCard';
import CreateFolderModal from './CreateFolderModal';
import PostCard from '../Post/PostCard';
import AddPostToFolderModal from './AddPostToFolderModal';

interface FolderViewProps {
  folderId: string;
  onBack: () => void;
  onOpenFolder: (folderId: string) => void;
  onLogin: () => void;
  onViewUserProfile: (userId: string) => void;
  onTagClick: (tag: string) => void;
  onViewPost: (postId: string) => void;
  onViewDecision?: (decisionNumber: string) => void;
}

const FolderView: React.FC<FolderViewProps> = ({
  folderId,
  onBack,
  onOpenFolder,
  onLogin,
  onViewUserProfile,
  onTagClick,
  onViewPost,
  onViewDecision
}) => {
  const { user } = useAuth();
  const { folders, getFolderById, deleteFolder, loadFolders } = useFolder();
  const { posts } = usePost();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

  const folder = getFolderById(folderId);
  
  // Simplification: utiliser les données disponibles
  const subFolders = folders ? folders.filter(f => f.parentId === folderId) : [];
  
  // Filtrer les posts qui appartiennent à ce dossier
  const allUserPosts = user && posts ? posts.filter(post => post.authorId === user.id) : [];
  const folderPosts = allUserPosts.filter(post => post.folderId === folderId);

  // Auto-hide success message
  React.useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  if (!folder) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </button>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Folder className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Dossier introuvable</h3>
          <p className="text-gray-600">
            Ce dossier n'existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === (folder.ownerId || (typeof folder.owner === 'object' ? folder.owner._id : folder.owner));
  const totalItems = subFolders.length + folderPosts.length;

  const handleDelete = async () => {
    try {
      const folderId = folder?.id || folder?._id;
      if (folderId) {
        await deleteFolder(folderId);
        setShowDeleteConfirm(false);
        setShowSuccessMessage('Dossier supprimé avec succès');
        setTimeout(() => {
          onBack();
        }, 1000);
      }
    } catch (error) {
      setShowSuccessMessage('Erreur lors de la suppression');
    }
  };

  const handlePostAdded = () => {
    setShowSuccessMessage('Post ajouté avec succès');
    // Refresh the folder data to show the new post
    loadFolders();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center space-x-2 mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </button>
        
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-gray-500">
          <span className="text-gray-900 font-medium">{folder.name}</span>
        </div>
      </div>

      {/* Header du dossier */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-4 rounded-xl bg-blue-100 text-blue-600">
              <Folder className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{folder.name}</h1>
              {folder.description && (
                <p className="text-gray-600 mt-1">{folder.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {totalItems} élément{totalItems > 1 ? 's' : ''} • 
                Modifié le {folder.updatedAt ? new Intl.DateTimeFormat('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(folder.updatedAt)) : 'Date inconnue'}
              </p>
            </div>
          </div>

          {/* Actions - Seulement pour le propriétaire */}
          {isOwner && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {                  setShowAddPostModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter un post</span>
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <FolderPlus className="h-4 w-4" />
                <span>Sous-dossier</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 transition-colors text-sm"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      {totalItems === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Folder className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Dossier vide</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Ce dossier ne contient pas encore de publications ou de sous-dossiers.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Sous-dossiers */}
          {subFolders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Sous-dossiers ({subFolders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {subFolders.map(subFolder => (
                  <FolderCard
                    key={subFolder.id}
                    folder={subFolder}
                    onOpen={onOpenFolder}
                    onShare={() => {}}
                    isOwner={isOwner}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Publications */}
          {folderPosts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Publications ({folderPosts.length})
              </h2>
              <div className="space-y-6">
                {folderPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLogin={onLogin}
                    onViewUserProfile={onViewUserProfile}
                    onTagClick={onTagClick}
                    onViewPost={onViewPost}
                    onViewDecision={onViewDecision}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de création de sous-dossier */}
      <CreateFolderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        parentId={folderId}
      />

      {/* Modal d'ajout de post */}
      {showAddPostModal && (
        <AddPostToFolderModal
          isOpen={showAddPostModal}
          onClose={() => {            setShowAddPostModal(false);
          }}
          folderId={folderId}
          onPostAdded={handlePostAdded}
        />
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Supprimer le dossier
              </h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer "{folder.name}" ? Cette action supprimera aussi tous les sous-dossiers. Les publications ne seront pas supprimées.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message de succès */}
      {showSuccessMessage && (
        <div className="fixed top-24 right-6 z-50 transform transition-all">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3">
            <div className="bg-white/20 p-1 rounded-full">
              <Check className="h-4 w-4" />
            </div>
            <span className="font-medium">{showSuccessMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderView;