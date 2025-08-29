import React, { useState, useEffect, useRef } from 'react';
import { Scale, Search, User, Plus, LogIn, MessageSquare, Star, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SearchUtils } from '../../utils/searchUtils';
import { secureLogger } from '../../utils/logger';
import { fixProfilePictureUrl } from '../../utils/apiUrlFixer';

interface NavbarProps {
  onCreatePost: () => void;
  onLogin: () => void;
  onHome: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onProfileClick: () => void;
  onMessagesClick: () => void;
  onViewUserProfile: (userId: string) => void;
  onViewPost: (postId: string) => void;
  onViewDecision?: (decisionNumber: string) => void;
  unreadMessagesCount?: number;
  onToggleMobileMenu?: () => void;
}

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'decision';
  title: string;
  subtitle: string;
  description?: string;
  score: number;
  data: any;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onCreatePost, 
  onLogin, 
  onHome, 
  searchQuery, 
  onSearchChange, 
  onProfileClick,
  onMessagesClick,
  onViewUserProfile,
  onViewPost,
  onViewDecision,
  unreadMessagesCount = 0,
  onToggleMobileMenu
}) => {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fermer les résultats de recherche quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche en temps réel avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performAdvancedSearch(searchQuery).catch(console.error);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
      }
    }, 300); // Debounce de 300ms

    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
    }

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performAdvancedSearch = async (query: string) => {
    const normalizedQuery = SearchUtils.normalizeText(query);
    const results: SearchResult[] = [];
    
    try {
      // Rechercher dans les utilisateurs via l'API MongoDB avec paramètre de recherche
      const usersResponse = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`, {
        credentials: 'include'
      });
      
      let users: any[] = [];
      if (usersResponse.ok) {
        const data = await usersResponse.json();
        users = data.success ? data.data : []; // Changé de data.users à data.data
      } else {
        console.error('❌ Erreur API users:', await usersResponse.text());
      }
      
      // Les utilisateurs sont déjà filtrés côté serveur, pas besoin de refiltrer
      if (users && Array.isArray(users)) {
        users.forEach((u: any) => {
          const score = SearchUtils.calculateRelevanceScore(query, u, 'user');
          const fullName = `${u.firstName} ${u.lastName}`;
          
          results.push({
            id: u.id,
            type: 'user',
            title: fullName,
            subtitle: `@${u.username}`,
            description: u.university || (u.isStudent ? 'Étudiant' : 'Professionnel'),
            score,
            data: u
          });
        });
      }

      // Rechercher dans les posts via l'API MongoDB avec paramètre de recherche
      const postsResponse = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}&limit=10`, {
        credentials: 'include'
      });
      
      let posts: any[] = [];
      if (postsResponse.ok) {
        const data = await postsResponse.json();
        posts = data.success ? data.data : []; // Changé de data.posts à data.data
      } else {
        console.error('❌ Erreur API posts:', await postsResponse.text());
      }
      
      // Les posts sont déjà filtrés côté serveur, pas besoin de refiltrer
      if (posts && Array.isArray(posts)) {
        posts.forEach((p: any) => {
          const score = SearchUtils.calculateRelevanceScore(query, p, 'post');
          
          results.push({
            id: p._id,
            type: 'post',
            title: p.title,
            subtitle: `Par ${p.authorId.username}`,
            description: p.content.length > 80 ? p.content.substring(0, 80) + '...' : p.content,
            score,
            data: p
          });
        });
      }

      // Rechercher dans les décisions (numéros de décision des fiches d'arrêt)
      const decisionPosts = (posts && Array.isArray(posts)) ? posts.filter((p: any) => {
        if (user && false) return false; // TODO: Implémenter la vérification des utilisateurs bloqués
        if (p.isPrivate && p.authorId !== user?.id) return false;
        
        return p.type === 'fiche-arret' && p.decisionNumber && 
               SearchUtils.fuzzyMatch(normalizedQuery, SearchUtils.normalizeText(p.decisionNumber), 0.6);
      }) : [];

      // Extraire les numéros de décision uniques
      const uniqueDecisions = Array.from(new Set(
        decisionPosts.map((p: any) => p.decisionNumber)
      ));

      uniqueDecisions.forEach(decisionNumber => {
        const relatedPosts = decisionPosts.filter((p: any) => p.decisionNumber === decisionNumber);
        const totalLikes = relatedPosts.reduce((sum: number, p: any) => sum + p.likes, 0);
        
        const decisionData = {
          decisionNumber,
          postsCount: relatedPosts.length,
          totalLikes
        };
        
        const score = SearchUtils.calculateRelevanceScore(query, decisionData, 'decision');
        
        results.push({
          id: decisionNumber as string,
          type: 'decision',
          title: `Décision n° ${decisionNumber}`,
          subtitle: `${relatedPosts.length} fiche${relatedPosts.length > 1 ? 's' : ''} d'arrêt`,
          description: `${totalLikes} likes au total`,
          score,
          data: decisionData
        });
      });

      // Trier par score de pertinence décroissant et limiter les résultats
      const sortedResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, 8); // Limiter à 8 résultats
      
      setSearchResults(sortedResults);
      setIsSearching(false);
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleMessagesClick = () => {
    if (!user) {
      onLogin();
      return;
    }
    onMessagesClick();
  };

  const handleProfileClick = () => {
    if (!user) {
      onLogin();
      return;
    }
    onProfileClick();
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'user') {
      onViewUserProfile(result.id);
    } else if (result.type === 'post') {
      onViewPost(result.id);
    } else if (result.type === 'decision' && onViewDecision) {
      onViewDecision(result.id);
    }
    setShowSearchResults(false);
    onSearchChange('');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'post':
        return <Search className="h-4 w-4 text-green-600" />;
      case 'decision':
        return <Scale className="h-4 w-4 text-purple-600" />;
      default:
        return <Search className="h-4 w-4 text-gray-600" />;
    }
  };

  const getResultBadge = (type: string) => {
    switch (type) {
      case 'user':
        return <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Utilisateur</span>;
      case 'post':
        return <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Publication</span>;
      case 'decision':
        return <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Décision</span>;
      default:
        return null;
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            {/* Menu burger - Visible en mobile/tablette seulement */}
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Logo - Bouton d'accueil */}
            <button
              onClick={onHome}
              className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl shadow-lg">
                <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                JuriNapse
              </span>
            </button>
          </div>

          {/* Search Bar Améliorée - Responsive */}
          <div className="flex-1 max-w-lg mx-2 sm:mx-4 lg:mx-8 relative" ref={searchRef}>
            <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="search"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoComplete="off"
                role="searchbox"
                aria-label="Rechercher des utilisateurs, posts et décisions"
                spellCheck="false"
                data-1p-ignore="true"
                data-lpignore="true"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </form>

            {/* Résultats de recherche améliorés */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Recherche en cours...
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-medium text-gray-700">
                        {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}-${index}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                      >
                        {result.type === 'user' ? (
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {result.data.profilePicture ? (
                              <img 
                                src={(() => {
                                  const fixedUrl = fixProfilePictureUrl(result.data.profilePicture);
                                  const imageSource = fixedUrl || result.data.profilePicture;
                                  return imageSource.startsWith('data:') ? imageSource : `data:image/jpeg;base64,${imageSource}`;
                                })()} 
                                alt={result.data.username}
                                className="h-full w-full object-cover"
                                onError={(e) => {                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <User className={`h-5 w-5 text-blue-600 ${result.data.profilePicture ? 'hidden' : ''}`} />
                          </div>
                        ) : (
                          <div className="h-10 w-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            {getResultIcon(result.type)}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-gray-900 truncate">
                              {result.title}
                            </p>
                            {result.score > 15 && (
                              <div title="Résultat très pertinent">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {result.subtitle}
                          </p>
                          {result.description && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {result.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0">
                          {getResultBadge(result.type)}
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Aucun résultat trouvé</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Essayez avec d'autres mots-clés
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Section - Responsive */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            {user ? (
              <>
                <button
                  onClick={onCreatePost}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-2 sm:px-4 py-2 rounded-lg flex items-center space-x-1 sm:space-x-2 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Publier</span>
                </button>

                <button
                  onClick={handleMessagesClick}
                  className="p-2 text-gray-400 hover:text-gray-600 relative transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium text-[10px] sm:text-xs">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </button>

                {/* Profile Button - Avec photo de profil */}
                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-1 sm:space-x-2 hover:bg-gray-50 rounded-lg p-1 sm:p-2 transition-colors"
                >
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                    {user.profilePicture ? (
                      <img 
                        src={(() => {
                          const fixedUrl = fixProfilePictureUrl(user.profilePicture);
                          const imageSource = fixedUrl || user.profilePicture;
                          // Si c'est une URL d'API, l'utiliser directement avec cache-busting
                          if (imageSource.startsWith('/api/') || imageSource.startsWith('http')) {
                            const separator = imageSource.includes('?') ? '&' : '?';
                            return `${imageSource}${separator}t=${Date.now()}`;
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
                        onError={(e) => {                          e.currentTarget.style.display = 'none';
                          const fallbackIcon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                          if (fallbackIcon) {
                            fallbackIcon.classList.remove('hidden');
                          }
                        }}
                      />
                    ) : null}
                    <User className={`h-4 w-4 text-blue-600 fallback-icon ${user.profilePicture ? 'hidden' : ''}`} />
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-900">
                    {user.username}
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-2 sm:px-4 py-2 rounded-lg flex items-center space-x-1 sm:space-x-2 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Se connecter</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;