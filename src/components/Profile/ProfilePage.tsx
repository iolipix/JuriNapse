import React, { useState, useRef, useEffect } from 'react';
import { User, Calendar, BookOpen, Edit3, Save, X, Bookmark, FileText, Camera, Check, Folder, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePost } from '../../contexts';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useSavedPosts } from '../../contexts/SavedPostsContext';
import { authAPI } from '../../services/api';
import PostCard from '../Post/PostCard';
import SubscriptionModal from '../Subscription/SubscriptionModal';
import FoldersPage from '../Folder/FoldersPage';

interface ProfilePageProps {
  onLogin: () => void;
  onViewUserProfile: (userId: string) => void;
  onTagClick: (tag: string) => void;
  onViewPost: (postId: string) => void;
  onViewDecision?: (decisionNumber: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onLogin, onViewUserProfile, onTagClick, onViewPost, onViewDecision }) => {
  const { user, updateProfile, refreshUserData } = useAuth();
  const { posts, loading, refreshPosts } = usePost();
  const { savedPosts } = useSavedPosts();
  const { getFollowersCount, getFollowingCount, getConnections } = useSubscription();
  const [isEditing, setIsEditing] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'posts' | 'folders' | 'saved'>('posts');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<{
    isOpen: boolean;
    type: 'followers' | 'following' | 'connections';
  }>({ isOpen: false, type: 'followers' });
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    university: user?.university || '',
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.profilePicture || null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États pour la vérification du username
  const [usernameStatus, setUsernameStatus] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
  }>({ isChecking: false, isAvailable: null, message: '' });

  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour vérifier la disponibilité du username
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus({
        isChecking: false,
        isAvailable: null,
        message: username.length > 0 ? 'Le nom d\'utilisateur doit contenir au moins 3 caractères' : ''
      });
      return;
    }

    // Ne pas vérifier si c'est le même username que l'utilisateur actuel
    if (username === user?.username) {
      setUsernameStatus({
        isChecking: false,
        isAvailable: true,
        message: 'Votre nom d\'utilisateur actuel'
      });
      return;
    }

    setUsernameStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const result = await authAPI.checkUsernameAvailability(username);
      setUsernameStatus({
        isChecking: false,
        isAvailable: result.available,
        message: result.message
      });
    } catch (error) {
      setUsernameStatus({
        isChecking: false,
        isAvailable: null,
        message: 'Erreur lors de la vérification'
      });
    }
  };

  // Debounce pour la vérification du username
  useEffect(() => {
    if (isEditing && editData.username) {
      // Annuler le timeout précédent
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }

      // Démarrer un nouveau timeout
      usernameCheckTimeoutRef.current = setTimeout(() => {
        checkUsernameAvailability(editData.username);
      }, 500); // 500ms de délai
    } else {
      // Réinitialiser le statut si on n'est pas en édition
      setUsernameStatus({ isChecking: false, isAvailable: null, message: '' });
    }

    // Cleanup
    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [editData.username, isEditing, user?.username]);

  // Synchroniser les données utilisateur au chargement
  React.useEffect(() => {
    if (user) {
      setEditData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
        bio: user?.bio || '',
        university: user?.university || '',
      });
      setProfilePicture(user?.profilePicture || null);
    }
  }, [user?.id]); // Seulement si l'ID de l'utilisateur change

  // Auto-hide success message
  React.useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // S'assurer que les posts sont chargés quand on arrive sur le profil
  useEffect(() => {
    if (user && posts.length === 0 && !loading) {
      refreshPosts();
    }
  }, [user, posts.length, loading, refreshPosts]);

  if (!user) return null;

  // Filtrer les posts de l'utilisateur
  const userPosts = React.useMemo(() => {
    return posts.filter(post => post.authorId === user.id);
  }, [posts, user.id]);
  
  // États pour les statistiques
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  
  // Charger les statistiques de l'utilisateur
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const [followers, following, connections] = await Promise.all([
          getFollowersCount(user.id),
          getFollowingCount(user.id),
          Promise.resolve(getConnections(user.id))
        ]);
        setFollowersCount(followers);
        setFollowingCount(following);
        setConnectionsCount(connections.length);
      } catch (error) {      }
    };

    if (user?.id) {
      loadUserStats();
    }
  }, [user?.id, getFollowersCount, getFollowingCount, getConnections]);
  
  const totalLikes = React.useMemo(() => {
    // Calculer le nombre total de likes reçus sur tous les posts de l'utilisateur
    return userPosts.reduce((total, post) => total + (post.likes || 0), 0);
  }, [userPosts]);

  const handleSave = async () => {    
    // Vérifier si le username est en cours de vérification
    if (usernameStatus.isChecking) {      alert('Vérification du nom d\'utilisateur en cours...');
      return;
    }

    // Vérifier si le username n'est pas disponible (seulement si il a changé)
    if (editData.username !== user?.username && usernameStatus.isAvailable === false) {      alert('Ce nom d\'utilisateur n\'est pas disponible');
      return;
    }

    // Si le username n'a pas changé, pas besoin de vérifier la disponibilité
    if (editData.username === user?.username) {    }
    try {
      const success = await updateProfile({
        ...editData,
        profilePicture: profilePicture || undefined,
      });      
      if (success) {
        setIsEditing(false);
        setShowSuccessMessage('Profil mis à jour avec succès !');
      } else {
        alert('Erreur lors de la mise à jour du profil');
      }
    } catch (error) {      alert('Erreur lors de la mise à jour du profil');
    }
  };

  const handleCancel = () => {
    setEditData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      bio: user?.bio || '',
      university: user?.university || '',
    });
    setProfilePicture(user?.profilePicture || null);
    setIsEditing(false);
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert('La taille de l\'image ne doit pas dépasser 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        setProfilePicture(imageData);
        
        // Uploader l'image vers le backend
        await uploadProfilePicture(imageData, file.name, file.type, file.size);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePicture = async (imageData: string, originalName: string, mimeType: string, size: number) => {
    try {
      const response = await fetch('/api/auth/profile-picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Pour envoyer les cookies
        body: JSON.stringify({
          imageData,
          originalName,
          mimeType,
          size
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload de la photo de profil');
      }

      const data = await response.json();
      setShowSuccessMessage('Photo de profil mise à jour avec succès !');
      
      // Forcer la synchronisation des données utilisateur depuis le serveur
      await refreshUserData();
      
      // Mettre à jour l'état local avec les nouvelles données
      setProfilePicture(data.profilePictureUrl);
      
    } catch (error) {      alert('Erreur lors de l\'upload de la photo de profil');
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      const response = await fetch('/api/auth/profile-picture', {
        method: 'DELETE',
        credentials: 'include', // Pour envoyer les cookies
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la photo de profil');
      }

      setProfilePicture(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Mettre à jour le profil
      updateProfile({
        ...editData,
        profilePicture: '',
      });
      
      setShowSuccessMessage('Photo de profil supprimée avec succès !');
      
    } catch (error) {      alert('Erreur lors de la suppression de la photo de profil');
    }
  };

  const handleViewUserProfile = (userId: string) => {
    // Fermer la modal et naviguer vers le profil
    setShowSubscriptionModal({ isOpen: false, type: 'followers' });
    onViewUserProfile(userId);
  };

  const renderTabContent = () => {
    if (activeProfileTab === 'folders') {
      return (
        <FoldersPage
          onLogin={onLogin}
          onViewUserProfile={onViewUserProfile}
          onTagClick={onTagClick}
          onViewPost={onViewPost}
          onViewDecision={onViewDecision}
        />
      );
    }

    if (activeProfileTab === 'saved') {
      return (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Bookmark className="h-5 w-5" />
            <span>Publications sauvegardées</span>
          </h2>
          {savedPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Bookmark className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune publication sauvegardée</h3>
              <p className="text-gray-600">
                Sauvegardez des publications intéressantes pour les retrouver facilement ici.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {savedPosts.map((post: any) => (
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
          )}
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Mes publications</span>
        </h2>
        {loading && userPosts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-blue-500 mb-4">
              <Loader2 className="h-8 w-8 mx-auto animate-spin" />
            </div>
            <p className="text-gray-600">Chargement de vos publications...</p>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <BookOpen className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune publication</h3>
            <p className="text-gray-600">
              Vous n'avez pas encore publié de contenu. Commencez par partager une fiche d'arrêt ou un conseil !
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {userPosts.map((post) => (
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
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6 flex-1 min-w-0">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                {(isEditing ? profilePicture : user.profilePicture) ? (
                  <img 
                    src={(() => {
                      const imageSource = isEditing ? profilePicture! : user.profilePicture!;
                      // Si c'est une URL d'API, l'utiliser directement
                      if (imageSource.startsWith('/api/') || imageSource.startsWith('http')) {
                        return imageSource;
                      }
                      // Si c'est déjà du base64 complet, l'utiliser directement
                      if (imageSource.startsWith('data:')) {
                        return imageSource;
                      }
                      // Sinon, ajouter le préfixe base64
                      return `data:image/jpeg;base64,${imageSource}`;
                    })()}
                    alt={user.username}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallbackIcon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                      if (fallbackIcon) {
                        fallbackIcon.classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}
                <User className={`h-10 w-10 text-blue-600 fallback-icon ${(isEditing ? profilePicture : user.profilePicture) ? 'hidden' : ''}`} />
              </div>
              
              {isEditing && (
                <div className="absolute -bottom-2 -right-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                    title="Changer la photo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Prénom"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Nom"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={editData.username}
                      onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Pseudo"
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        editData.username !== user?.username && usernameStatus.isAvailable === false
                          ? 'border-red-300 bg-red-50'
                          : editData.username !== user?.username && usernameStatus.isAvailable === true
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300'
                      }`}
                    />
                    {editData.username && editData.username !== user?.username && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {usernameStatus.isChecking ? (
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        ) : usernameStatus.isAvailable === true ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : usernameStatus.isAvailable === false ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {editData.username && editData.username !== user?.username && usernameStatus.message && (
                    <p className={`text-xs -mt-2 ${
                      usernameStatus.isAvailable === false ? 'text-red-500' : 
                      usernameStatus.isAvailable === true ? 'text-green-500' : 'text-gray-500'
                    }`}>
                      {usernameStatus.message}
                    </p>
                  )}
                  {user.isStudent && (
                    <input
                      type="text"
                      value={editData.university}
                      onChange={(e) => setEditData(prev => ({ ...prev, university: e.target.value }))}
                      placeholder="Université"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  {profilePicture && (
                    <button
                      onClick={handleRemoveProfilePicture}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Supprimer la photo de profil
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-gray-600 font-medium">
                    @{user.username}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {user.isStudent ? 'Étudiant' : 'Professionnel'}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    {user.university && (
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{user.university}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Membre depuis {new Intl.DateTimeFormat('fr-FR', {
                          month: 'long',
                          year: 'numeric'
                        }).format(new Date(user.joinedAt))}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Boutons d'action - Conteneur fixe */}
          <div className="flex-shrink-0 ml-4">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm whitespace-nowrap"
                >
                  <Save className="h-4 w-4" />
                  <span>Sauver</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm whitespace-nowrap"
                >
                  <X className="h-4 w-4" />
                  <span>Annuler</span>
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Modifier</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">À propos</h3>
          {isEditing ? (
            <textarea
              value={editData.bio}
              onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Parlez-nous de vous, vos domaines d'expertise, vos intérêts..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          ) : (
            <p className="text-gray-600">
              {user.bio || 'Pas encore de description ajoutée.'}
            </p>
          )}
        </div>

        {/* Stats - Suppression du compteur de publications */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowSubscriptionModal({ isOpen: true, type: 'followers' })}
              className="flex-1 text-center hover:bg-gray-50 rounded-lg p-3 transition-colors"
            >
              <div className="text-2xl font-bold text-green-600">{followersCount}</div>
              <div className="text-sm text-gray-500">Abonnés</div>
            </button>
            <button
              onClick={() => setShowSubscriptionModal({ isOpen: true, type: 'following' })}
              className="flex-1 text-center hover:bg-gray-50 rounded-lg p-3 transition-colors"
            >
              <div className="text-2xl font-bold text-purple-600">{followingCount}</div>
              <div className="text-sm text-gray-500">Abonnements</div>
            </button>
            <button
              onClick={() => setShowSubscriptionModal({ isOpen: true, type: 'connections' })}
              className="flex-1 text-center hover:bg-gray-50 rounded-lg p-3 transition-colors"
            >
              <div className="text-2xl font-bold text-orange-600">{connectionsCount}</div>
              <div className="text-sm text-gray-500">Connexions</div>
            </button>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-red-600">{totalLikes}</div>
              <div className="text-sm text-gray-500">J'aime reçus</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveProfileTab('posts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeProfileTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Publications ({userPosts.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveProfileTab('folders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeProfileTab === 'folders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Folder className="h-4 w-4" />
                <span>Dossiers</span>
              </div>
            </button>
            <button
              onClick={() => setActiveProfileTab('saved')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeProfileTab === 'saved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bookmark className="h-4 w-4" />
                <span>Sauvegardés ({savedPosts.length})</span>
              </div>
            </button>
          </nav>
        </div>
        
        <div className={activeProfileTab === 'folders' ? 'p-6' : 'p-6'}>
          {renderTabContent()}
        </div>
      </div>

      {/* Modal des abonnements */}
      <SubscriptionModal
        isOpen={showSubscriptionModal.isOpen}
        onClose={() => setShowSubscriptionModal({ isOpen: false, type: 'followers' })}
        userId={user.id}
        type={showSubscriptionModal.type}
        onViewUserProfile={handleViewUserProfile}
      />

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

export default ProfilePage;