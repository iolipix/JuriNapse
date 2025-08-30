import React, { useState, useMemo, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { usePost } from '../../contexts';
import { useSubscriptions } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from '../Post/PostCard';

interface FeedPageProps {
  activeTab?: string;
  searchQuery?: string;
  selectedTag?: string;
  onTagClick?: (tag: string) => void;
  onViewUserProfile?: (userId: string) => void;
  onViewPost?: (postId: string) => void;
  onViewDecision?: (decisionNumber: string) => void;
}

const FeedPage: React.FC<FeedPageProps> = ({ 
  searchQuery = '', 
  selectedTag = '', 
  activeTab = 'all',
  onTagClick,
  onViewUserProfile,
  onViewPost,
  onViewDecision
}) => {
  const { posts, loading, error, hasMore, loadMorePosts } = usePost();
  const { subscriptions } = useSubscriptions();
  const { user } = useAuth();
  const [localSelectedTag, setLocalSelectedTag] = useState<string>('');

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 && // Charger avant d'atteindre le bas
        hasMore &&
        !loading
      ) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading]); // Pas de dépendance sur loadMorePosts

  // Determine which tag to use for filtering
  const effectiveSelectedTag = selectedTag || localSelectedTag;

  // Liste des IDs des utilisateurs suivis (amis) pour priorisation dans le fil d'actualité
  const friendsUserIds = useMemo(() => {
    return new Set(subscriptions.map(friend => friend.id || (friend as any)._id).filter(id => id));
  }, [subscriptions]);

  // Calcul des scores de trending avec mise en cache
  const postsWithScores = useMemo(() => {
    // Fonction pour calculer le score de trending basé sur la récence des interactions
    const calculateTrendingScore = (post: any) => {
      const now = new Date();
      let score = 0;
      let totalInteractions = 0;
      let mostRecentInteractionAge = Infinity;
      
      // Score basé sur les likes récents
      if (post.likes > 0) {
        // Utiliser updatedAt comme proxy pour l'interaction la plus récente
        const interactionDate = post.updatedAt || post.createdAt;
        let hoursOld = Infinity;
        
        if (interactionDate) {
          try {
            const interactionDateObj = new Date(interactionDate);
            if (!isNaN(interactionDateObj.getTime())) {
              hoursOld = (now.getTime() - interactionDateObj.getTime()) / (1000 * 60 * 60);
            }
          } catch (error) {
            console.warn('Error parsing likes interaction date:', error);
          }
        }
        
        // Les likes ont la valeur la plus faible
        // Formule : likes² × (1 / (1 + hoursOld/12)) - décroissance rapide sur 12h
        const timeDecay = 1 / (1 + hoursOld / 12);
        const likeScore = isFinite(timeDecay) && isFinite(hoursOld) ? (post.likes * post.likes) * timeDecay * 15 : 0;
        score += isFinite(likeScore) ? likeScore : 0;
        totalInteractions += post.likes;
        mostRecentInteractionAge = Math.min(mostRecentInteractionAge, hoursOld);
      }
      
      // Score basé sur les sauvegardes récentes (remplace les partages)
      if (post.savesCount > 0) {
        const interactionDate = post.updatedAt || post.createdAt;
        let hoursOld = Infinity;
        
        if (interactionDate) {
          try {
            const interactionDateObj = new Date(interactionDate);
            if (!isNaN(interactionDateObj.getTime())) {
              hoursOld = (now.getTime() - interactionDateObj.getTime()) / (1000 * 60 * 60);
            }
          } catch (error) {
            console.warn('Error parsing saves interaction date:', error);
          }
        }
        
        // Les sauvegardes ont une valeur élevée (plus que les likes, moins que les commentaires)
        // Formule : saves² × (1 / (1 + hoursOld/8)) - décroissance sur 8h
        const timeDecay = 1 / (1 + hoursOld / 8);
        const saveScore = isFinite(timeDecay) && isFinite(hoursOld) ? (post.savesCount * post.savesCount) * timeDecay * 30 : 0;
        score += isFinite(saveScore) ? saveScore : 0;
        totalInteractions += post.savesCount;
        mostRecentInteractionAge = Math.min(mostRecentInteractionAge, hoursOld);
      }
      
      // Score basé sur la récence des commentaires
      if (post.comments && post.comments.length > 0) {
        const commentsCount = post.comments.length;
        const interactionDate = post.updatedAt || post.createdAt;
        let hoursOld = Infinity;
        
        if (interactionDate) {
          try {
            const interactionDateObj = new Date(interactionDate);
            if (!isNaN(interactionDateObj.getTime())) {
              hoursOld = (now.getTime() - interactionDateObj.getTime()) / (1000 * 60 * 60);
            }
          } catch (error) {
            console.warn('Error parsing comments interaction date:', error);
          }
        }
        
        // Les commentaires ont la valeur la plus élevée (engagement maximum)
        // Formule : comments² × (1 / (1 + hoursOld/6)) - décroissance sur 6h
        const timeDecay = 1 / (1 + hoursOld / 6);
        const commentScore = isFinite(timeDecay) && isFinite(hoursOld) ? (commentsCount * commentsCount) * timeDecay * 25 : 0;
        score += isFinite(commentScore) ? commentScore : 0;
        totalInteractions += commentsCount;
        mostRecentInteractionAge = Math.min(mostRecentInteractionAge, hoursOld);
      }
      
      // Bonus pour les posts avec beaucoup d'interactions récentes
      if (totalInteractions > 0) {
        const recentBonus = totalInteractions * (1 / (1 + mostRecentInteractionAge / 2));
        score += recentBonus;
      }
      
      return score;
    };

    return posts.map(post => {
      return {
        ...post,
        trendingScore: calculateTrendingScore(post)
      };
    });
  }, [posts]);

  // Unified filtering system using useMemo
  const filteredPosts = useMemo(() => {
    let filtered = postsWithScores;

    // Filter by tag first
    if (effectiveSelectedTag) {
      filtered = filtered.filter(post => post.tags?.includes(effectiveSelectedTag));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by tab
    switch (activeTab) {
      case 'fiches':
        filtered = filtered.filter(post => post.type === 'fiche-arret');
        break;
      case 'publications':
        filtered = filtered.filter(post => 
          post.type === 'conseil' || post.type === 'question' || post.type === 'discussion'
        );
        break;
      case 'cours':
        filtered = filtered.filter(post => post.type === 'cours');
        break;
      case 'protocole':
        filtered = filtered.filter(post => post.type === 'protocole');
        break;
      case 'trending':
        // Filter by trending score and sort by score (interactions récentes = plus haut)
        filtered = filtered
          .filter(post => post.trendingScore >= 1) // Seuil très bas pour capturer toutes les interactions
          .sort((a, b) => b.trendingScore - a.trendingScore) // Tri par score décroissant
          .slice(0, 20); // Afficher plus de posts trending
        break;
      case 'saved':
        // TODO: Implement saved posts functionality
        // For now, show empty results
        filtered = [];
        break;
      case 'feed':
        // Fil d'actualité avec priorisation des posts des amis
        if (user && friendsUserIds.size > 0) {
          // Séparer les posts des amis et des autres
          const friendsPosts = filtered.filter(post => 
            friendsUserIds.has(post.authorId) || 
            friendsUserIds.has(post.author?.id) ||
            friendsUserIds.has((post.author as any)?._id) ||
            friendsUserIds.has((post as any)._id)
          );
          const otherPosts = filtered.filter(post => 
            !friendsUserIds.has(post.authorId) && 
            !friendsUserIds.has(post.author?.id) &&
            !friendsUserIds.has((post.author as any)?._id) &&
            !friendsUserIds.has((post as any)._id)
          );
          
          // Trier les posts des amis par date (plus récents d'abord)
          friendsPosts.sort((a, b) => {
            try {
              const dateA = a?.createdAt ? new Date(a.createdAt) : null;
              const dateB = b?.createdAt ? new Date(b.createdAt) : null;
              if (!dateA && !dateB) return 0;
              if (!dateA || isNaN(dateA.getTime())) return 1;
              if (!dateB || isNaN(dateB.getTime())) return -1;
              return dateB.getTime() - dateA.getTime();
            } catch (error) {
              console.warn('Error sorting friends posts:', error);
              return 0;
            }
          });
          
          // Trier les autres posts par date également
          otherPosts.sort((a, b) => {
            try {
              const dateA = a?.createdAt ? new Date(a.createdAt) : null;
              const dateB = b?.createdAt ? new Date(b.createdAt) : null;
              if (!dateA && !dateB) return 0;
              if (!dateA || isNaN(dateA.getTime())) return 1;
              if (!dateB || isNaN(dateB.getTime())) return -1;
              return dateB.getTime() - dateA.getTime();
            } catch (error) {
              console.warn('Error sorting other posts:', error);
              return 0;
            }
          });
          
          // Combiner : posts des amis d'abord, puis les autres
          filtered = [...friendsPosts, ...otherPosts];
        } else {
          // Si pas d'utilisateur connecté ou pas d'amis, tri normal par date
          filtered.sort((a, b) => {
            try {
              const dateA = a?.createdAt ? new Date(a.createdAt) : null;
              const dateB = b?.createdAt ? new Date(b.createdAt) : null;
              if (!dateA && !dateB) return 0;
              if (!dateA || isNaN(dateA.getTime())) return 1;
              if (!dateB || isNaN(dateB.getTime())) return -1;
              return dateB.getTime() - dateA.getTime();
            } catch (error) {
              console.warn('Error sorting all posts:', error);
              return 0;
            }
          });
        }
        break;
      default:
        // 'all' et autres onglets - tri normal par date uniquement
        filtered.sort((a, b) => {
          try {
            const dateA = a?.createdAt ? new Date(a.createdAt) : null;
            const dateB = b?.createdAt ? new Date(b.createdAt) : null;
            if (!dateA && !dateB) return 0;
            if (!dateA || isNaN(dateA.getTime())) return 1;
            if (!dateB || isNaN(dateB.getTime())) return -1;
            return dateB.getTime() - dateA.getTime();
          } catch (error) {
            console.warn('Error sorting default posts:', error);
            return 0;
          }
        });
        break;
    }
    
    return filtered;
  }, [postsWithScores, effectiveSelectedTag, searchQuery, activeTab, friendsUserIds, user]);

  const popularTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    posts.forEach(post => {
      post.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [posts]);

  const handleTagClick = (tag: string) => {
    const newTag = effectiveSelectedTag === tag ? '' : tag;
    setLocalSelectedTag(newTag);
    if (onTagClick) {
      onTagClick(newTag);
    }
  };

  // Fonction pour obtenir le titre de l'onglet actif
  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'feed':
        return 'Fil d\'actualité';
      case 'fiches':
        return 'Fiches d\'arrêt';
      case 'publications':
        return 'Publications';
      case 'cours':
        return 'Cours';
      case 'protocole':
        return 'Protocole';
      case 'trending':
        return 'Tendances';
      case 'notifications':
        return 'Notifications';
      case 'saved':
        return 'Enregistrés';
      default:
        return 'Fil d\'actualité';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-700">Erreur lors du chargement des posts : {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{getActiveTabTitle()}</h1>
        </div>
      </div>

      {/* Tags - Affichés uniquement dans le fil d'actualité (LIMITÉ A 5) */}
      {popularTags.length > 0 && activeTab === 'feed' && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Tags populaires</h3>
          <div className="flex flex-wrap gap-2">
            {/* Limitation à 5 tags max + indicateur de surplus */}
            {popularTags.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1 rounded-full text-sm ${
                  effectiveSelectedTag === tag
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                #{tag}
              </button>
            ))}
            {popularTags.length > 5 && (
              <span className="px-3 py-1 rounded-full text-sm bg-gray-50 text-gray-500 border border-dashed border-gray-300">
                +{popularTags.length - 5} autres
              </span>
            )}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun post trouvé</p>
          </div>
        ) : (
          filteredPosts.map((post, index) => {
            const isTrending = post.trendingScore >= 1;
            
            return (
              <div key={`${post.id}-${index}-${activeTab}`} className="relative">
                {/* Badges de tendance selon l'onglet */}
                {activeTab === 'trending' ? (
                  // Dans l'onglet trending : badges numérotés pour les 3 premiers, "Tendance" pour les autres
                  index < 3 ? (
                    <div className="absolute -top-2 -left-2 z-10">
                      <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        'bg-gradient-to-r from-orange-600 to-red-500'
                      }`}>
                        <Flame className="h-3 w-3" />
                        <span>#{index + 1}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute -top-2 -left-2 z-10">
                      <div className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                        <Flame className="h-3 w-3" />
                        <span>Tendance</span>
                      </div>
                    </div>
                  )
                ) : (
                  // Dans les autres onglets : badge "Tendance" pour les posts trending
                  isTrending && (
                    <div className="absolute -top-2 -left-2 z-10">
                      <div className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                        <Flame className="h-3 w-3" />
                        <span>Tendance</span>
                      </div>
                    </div>
                  )
                )}

                <PostCard 
                  post={post} 
                  onLogin={() => {}}
                  onViewUserProfile={onViewUserProfile || (() => {})}
                  onTagClick={handleTagClick}
                  onViewPost={onViewPost}
                  onViewDecision={onViewDecision}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Indicateur de chargement pour l'infinite scroll */}
      {loading && posts.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Indicateur fin de liste */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Vous avez vu tous les posts disponibles</p>
        </div>
      )}
    </div>
  );
};

export default FeedPage;
