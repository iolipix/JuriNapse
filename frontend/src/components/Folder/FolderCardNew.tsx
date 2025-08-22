import { useState } from 'react';
import { Folder, MoreVertical, Trash2, FileText } from 'lucide-react';
import { Folder as FolderType } from '../../types';
import { useFolder } from '../../contexts/FolderContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePost } from '../../contexts/PostContext';
import { secureLogger } from '../../utils/logger';

interface FolderCardProps {
  folder: FolderType;
  onOpen: (folderId: string) => void;
  onShare?: (folderId: string) => void;
  isOwner: boolean;
}

function FolderCard({ folder, onOpen, isOwner }: FolderCardProps) {
  const { deleteFolder } = useFolder();
  const { user } = useAuth();
  const { posts } = usePost();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Compter les posts qui appartiennent à ce dossier
  const userPosts = user ? posts.filter(post => post.authorId === user.id) : [];
  const folderPosts = userPosts.filter(post => post.folderId === (folder.id || folder._id));
  const totalItems = folderPosts.length;

  const handleDelete = async () => {
    if (isDeleting) return; // Empêcher les clics multiples
    
    const folderId = folder.id || folder._id;
    if (folderId) {
      try {
        setIsDeleting(true);
        setDeleteError(null);
        await deleteFolder(folderId);
        setShowDeleteConfirm(false);
      } catch (error: any) {
        secureLogger.error('Erreur lors de la suppression:', error);
        
        // Extraire le message d'erreur de l'API
        if (error.response?.data?.message) {
          setDeleteError(error.response.data.message);
        } else if (error.message) {
          setDeleteError(error.message);
        } else {
          setDeleteError('Une erreur inattendue s\'est produite lors de la suppression');
        }
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Fermer le modal en cliquant à l'extérieur
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowDeleteConfirm(false);
      setDeleteError(null);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Date inconnue';
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Menu dropdown */}
      {showMenu && (
        <>
          {/* Backdrop pour fermer le menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-8 right-2 z-20 w-48 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="py-1">
              {isOwner && (
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleModalBackdropClick}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer le dossier "{folder.name}" ? Cette action est irréversible.
            </p>
            
            {/* Avertissement si le dossier contient des posts */}
            {totalItems > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Ce dossier contient {totalItems} publication{totalItems > 1 ? 's' : ''}. 
                  Vous devez d'abord déplacer ou supprimer le{totalItems > 1 ? 's' : ''} contenu avant de pouvoir supprimer le dossier.
                </p>
              </div>
            )}
            
            {/* Affichage des erreurs */}
            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-800">❌ {deleteError}</p>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || totalItems > 0}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder card content */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => {
          const folderId = folder.id || folder._id;
          if (folderId) onOpen(folderId);
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Folder className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {folder.name}
              </h3>
              {folder.description && (
                <p className="text-sm text-gray-600 mt-1">{folder.description}</p>
              )}
            </div>
          </div>
          
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Folder metadata */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{totalItems} publication{totalItems > 1 ? 's' : ''}</span>
          </div>
          <div>
            Créé le {formatDate(folder.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FolderCard;
