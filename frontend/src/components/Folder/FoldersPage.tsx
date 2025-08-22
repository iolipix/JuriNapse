import React, { useState, useEffect } from 'react';
import { Folder, FolderPlus, Search, Grid as Grid3X3, List } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFolder } from '../../contexts/FolderContext';
import FolderCard from './FolderCard';
import CreateFolderModal from './CreateFolderModal';
import FolderView from './FolderView';
import { secureLogger } from '../../utils/logger';

interface FoldersPageProps {
  onLogin: () => void;
  onViewUserProfile: (userId: string) => void;
  onTagClick: (tag: string) => void;
  onViewPost: (postId: string) => void;
  onViewDecision?: (decisionNumber: string) => void;
}

const FoldersPage: React.FC<FoldersPageProps> = ({
  onLogin,
  onViewUserProfile,
  onTagClick,
  onViewPost,
  onViewDecision
}) => {
  const { user } = useAuth();
  const { folders } = useFolder();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Log pour déboguer la navigation
  const handleFolderOpen = (folderId: string) => {
    if (folderId && folderId !== '') {
      setIsNavigating(true);
      setCurrentFolderId(folderId);
      setTimeout(() => {
        setIsNavigating(false);
      }, 100);
    }
  };
  
  // Fonction pour revenir à la liste des dossiers
  const handleBackToFolders = () => {
    setCurrentFolderId(null);
    setIsNavigating(false);
  };
  const [searchQuery, setSearchQuery] = useState('');
  
  // Charger la préférence de vue depuis localStorage
  const loadViewPreference = (): 'grid' | 'list' => {
    if (!user) return 'grid';
    
    try {
      // TODO: Charger les préférences depuis l'API MongoDB
      return 'grid';
    } catch {
      return 'grid';
    }
  };

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(loadViewPreference);

  // Sauvegarder la préférence de vue quand elle change
  const handleViewModeChange = (newViewMode: 'grid' | 'list') => {
    setViewMode(newViewMode);
    
    if (user) {
      try {
        // TODO: Sauvegarder les préférences via l'API MongoDB
        localStorage.setItem('folders-view-mode', newViewMode);
      } catch (error) {
        secureLogger.error('Erreur lors de la sauvegarde de la préférence:', error);
      }
    }
  };

  // Charger la préférence au changement d'utilisateur
  useEffect(() => {
    if (user) {
      const preference = loadViewPreference();
      setViewMode(preference);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
          <Folder className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Connectez-vous</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Vous devez être connecté pour gérer vos dossiers.
          </p>
        </div>
      </div>
    );
  }

  // Si on visualise un dossier spécifique
  if (currentFolderId && !isNavigating) {
    return (
      <div className="p-6">
        <FolderView
          folderId={currentFolderId}
          onBack={handleBackToFolders}
          onOpenFolder={setCurrentFolderId}
          onLogin={onLogin}
          onViewUserProfile={onViewUserProfile}
          onTagClick={onTagClick}
          onViewPost={onViewPost}
          onViewDecision={onViewDecision}
        />
      </div>
    );
  }

  // Filtrer les dossiers de l'utilisateur actuel (dossiers racine)
  const rootFolders = user && Array.isArray(folders) ? folders.filter(folder => {
    const ownerId = typeof folder.owner === 'object' ? folder.owner._id : folder.owner || folder.ownerId;
    return ownerId === user.id && !folder.parentId;
  }) : [];

  // Filtrer les dossiers selon la recherche
  const filteredFolders = rootFolders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (folder.description && folder.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleShareFolder = (_folderId: string) => {
    // TODO: Implémenter le partage de dossier
  };

  return (
    <div className="p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Folder className="h-6 w-6" />
            <span>Mes dossiers</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Organisez vos publications dans des dossiers
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher un dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          
          {/* Toggle vue avec persistance */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vue en grille (3 par ligne)"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vue en liste (1 par ligne)"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Nouveau dossier</span>
          </button>
        </div>
      </div>

      {/* Contenu */}
      {filteredFolders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Folder className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchQuery ? 'Aucun dossier trouvé' : 'Aucun dossier'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {searchQuery 
              ? `Aucun dossier ne correspond à "${searchQuery}". Essayez avec d'autres mots-clés.`
              : 'Créez votre premier dossier pour organiser vos publications par thème, matière ou projet.'
            }
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <FolderPlus className="h-5 w-5" />
              <span>Créer un dossier</span>
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Dossiers */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Dossiers ({filteredFolders.length})
              </h2>
              
              {/* Indicateur de vue active */}
              <div className="text-sm text-gray-500">
                {viewMode === 'grid' ? (
                  <span className="flex items-center space-x-1">
                    <Grid3X3 className="h-4 w-4" />
                    <span>Vue en grille (3 par ligne)</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1">
                    <List className="h-4 w-4" />
                    <span>Vue en liste (1 par ligne)</span>
                  </span>
                )}
              </div>
            </div>
            
            <div className={`grid gap-8 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredFolders.map((folder) => {
                // Créer un dossier avec l'id forcé
                const folderWithId = {
                  ...folder,
                  id: folder._id || folder.id
                };
                return (
                  <FolderCard
                    key={folder._id || folder.id}
                    folder={folderWithId}
                    onOpen={(id) => {
                      handleFolderOpen(id);
                    }}
                    onShare={handleShareFolder}
                    isOwner={true}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de dossier */}
      <CreateFolderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        parentId={null}
      />
    </div>
  );
};

export default FoldersPage;