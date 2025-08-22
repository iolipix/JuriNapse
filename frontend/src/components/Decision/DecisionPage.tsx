import React, { useState } from 'react';
import { ArrowLeft, Scale, FileText, SortAsc, SortDesc, TrendingUp, ChevronDown, AlertTriangle, Plus } from 'lucide-react';
import { usePost } from '../../contexts';
import PostCard from '../Post/PostCard';

interface DecisionPageProps {
  decisionNumber: string;
  onBack: () => void;
  onLogin: () => void;
  onViewUserProfile: (userId: string) => void;
  onTagClick: (tag: string) => void;
  onViewPost: (postId: string) => void;
}

type SortType = 'most-liked' | 'newest' | 'oldest';

const DecisionPage: React.FC<DecisionPageProps> = ({
  decisionNumber,
  onBack,
  onLogin,
  onViewUserProfile,
  onTagClick,
  onViewPost
}) => {
  const { posts } = usePost();
  const [sortType, setSortType] = useState<SortType>('most-liked');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalType, setProposalType] = useState<'add' | 'modify'>('add');
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

  // Auto-hide success message
  React.useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Filtrer les fiches d'arrêt pour cette décision
  const decisionPosts = posts.filter(post => 
    post.type === 'fiche-arret' && 
    post.decisionNumber === decisionNumber &&
    !post.isPrivate
  );

  // Trier les posts selon le critère sélectionné
  const getSortedPosts = () => {
    const sortedPosts = [...decisionPosts];
    
    switch (sortType) {
      case 'oldest':
        return sortedPosts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'newest':
        return sortedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'most-liked':
      default:
        return sortedPosts.sort((a, b) => {
          if (b.likes !== a.likes) {
            return b.likes - a.likes;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
  };

  const sortedPosts = getSortedPosts();

  const getSortLabel = (sort: SortType) => {
    switch (sort) {
      case 'most-liked': return 'Plus likées';
      case 'newest': return 'Plus récentes';
      case 'oldest': return 'Plus anciennes';
      default: return 'Plus likées';
    }
  };

  const getSortIcon = (sort: SortType) => {
    switch (sort) {
      case 'most-liked': return <TrendingUp className="h-4 w-4" />;
      case 'newest': return <SortDesc className="h-4 w-4" />;
      case 'oldest': return <SortAsc className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const handleProposalClick = () => {
    // Toujours proposer un ajout puisqu'il n'y a pas de texte
    setProposalType('add');
    setShowProposalModal(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Navigation */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 transition-colors touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm sm:text-base">Retour</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
              <Scale className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Décision n° {decisionNumber}
              </h1>
              <p className="text-gray-600">
                {sortedPosts.length} fiche{sortedPosts.length > 1 ? 's' : ''} d'arrêt disponible{sortedPosts.length > 1 ? 's' : ''} pour cette décision
              </p>
            </div>
          </div>

          {/* Tri seulement si plusieurs posts */}
          {sortedPosts.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                {getSortIcon(sortType)}
                <span>{getSortLabel(sortType)}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {(['most-liked', 'newest', 'oldest'] as SortType[]).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => {
                        setSortType(sort);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 text-left text-sm transition-colors ${
                        sortType === sort
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {getSortIcon(sort)}
                      <span>{getSortLabel(sort)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Texte de la décision */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Scale className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Texte de la décision</h2>
          </div>
          
          {/* Bouton de proposition sur le texte */}
          <button
            onClick={handleProposalClick}
            className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Proposer ajout</span>
          </button>
        </div>
        
        <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-800 mb-1">
              Texte de décision non disponible
            </p>
            <p className="text-sm text-orange-700">
              Le texte officiel de cette décision n'est pas encore disponible dans notre base de données. 
              Vous pouvez consulter les fiches d'arrêt ci-dessous pour des analyses détaillées.
            </p>
          </div>
        </div>
      </div>

      {/* Titre de la section fiches */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Fiches d'arrêt</span>
        </h2>
        <p className="text-gray-600 mt-1">
          Analyses et commentaires de cette décision par la communauté
        </p>
      </div>

      {/* Liste des fiches */}
      {sortedPosts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <FileText className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Aucune fiche d'arrêt
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Aucune fiche d'arrêt n'a encore été publiée pour cette décision. 
            Soyez le premier à partager votre analyse !
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedPosts.map((post, index) => (
            <div key={post.id} className="relative">
              {/* Badge de position pour les 3 premières fiches les plus likées */}
              {index < 3 && post.likes > 0 && (
                <div className="absolute -top-2 -left-2 z-10">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                    'bg-gradient-to-r from-orange-600 to-red-500'
                  }`}>
                    <TrendingUp className="h-3 w-3" />
                    <span>#{index + 1}</span>
                  </div>
                </div>
              )}
              
              <PostCard
                post={post}
                onLogin={onLogin}
                onViewUserProfile={onViewUserProfile}
                onTagClick={onTagClick}
                onViewPost={onViewPost}
                onViewDecision={() => {}} // Pas de navigation vers une autre décision depuis cette page
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal de proposition d'ajout/modification */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {proposalType === 'add' ? 'Proposer l\'ajout du texte' : 'Proposer une modification'}
                </h3>
                <button
                  onClick={() => setShowProposalModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <AlertTriangle className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Scale className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        Contribuer à la base de données juridique
                      </p>
                      <p className="text-sm text-blue-700">
                        {proposalType === 'add' 
                          ? 'Vous pouvez proposer l\'ajout du texte officiel de cette décision pour enrichir notre base de données.'
                          : 'Vous pouvez suggérer des modifications pour améliorer la précision du texte existant.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <textarea
                    placeholder={proposalType === 'add' 
                      ? 'Collez ici le texte officiel de la décision...'
                      : 'Décrivez les modifications que vous souhaitez apporter...'
                    }
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  
                  <textarea
                    placeholder="Commentaire ou justification (optionnel)"
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowProposalModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      setShowProposalModal(false);
                      setShowSuccessMessage('Proposition envoyée ! Merci pour votre contribution.');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Envoyer la proposition
                  </button>
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500">
                    Vos propositions seront examinées par notre équipe avant publication
                  </p>
                </div>
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
              <Plus className="h-4 w-4" />
            </div>
            <span className="font-medium">{showSuccessMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionPage;