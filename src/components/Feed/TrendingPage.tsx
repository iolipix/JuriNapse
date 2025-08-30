import React, { useState, useEffect } from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { usePost } from '../../contexts';
import PostCard from '../Post/PostCard';

interface TrendingPageProps {
  onLogin: () => void;
  onViewUserProfile: (userId: string) => void;
  onTagClick: (tag: string) => void;
  onViewPost?: (postId: string) => void;
}

const TrendingPage: React.FC<TrendingPageProps> = ({ 
  onLogin, 
  onViewUserProfile, 
  onTagClick, 
  onViewPost 
}) => {
  const { posts, loading, error, getTrendingPosts } = usePost();
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);

  useEffect(() => {
    const loadTrendingPosts = async () => {
      try {
        const trending = await getTrendingPosts();
        setTrendingPosts(trending);
      } catch (error) {
        // Fallback: utiliser la logique locale avec le nouveau système de scoring
        const localTrending = posts && Array.isArray(posts) ? posts
          .map(post => ({
            ...post,
            trendingScore: calculateTrendingScore(post)
          }))
          .filter(post => post.trendingScore >= 5) // Seuil réduit pour les tests
          .sort((a, b) => b.trendingScore - a.trendingScore) // Tri par score décroissant
          .slice(0, 10) : [];
        
        setTrendingPosts(localTrending);
      }
    };

    loadTrendingPosts();
  }, [posts, getTrendingPosts]);

  // Fonction pour calculer le score de trending basé sur la récence des interactions
  const calculateTrendingScore = (post: any) => {
    const now = new Date();
    let score = 0;
    
    // Score basé sur les likes (avec décroissance temporelle)
    if (post.likes > 0) {
      const postDate = post.createdAt ? new Date(post.createdAt) : null;
      const hoursOld = postDate && !isNaN(postDate.getTime()) ? (now.getTime() - postDate.getTime()) / (1000 * 60 * 60) : Infinity;
      
      // Plus le post est récent, plus le score est élevé
      const timeDecay = 1 / (1 + hoursOld / 24);
      score += post.likes * timeDecay * 8; // Réduit de 10 à 8
    }
    
    // Score basé sur les sauvegardes (remplace les partages)
    if (post.savesCount > 0) {
      const postDate = post.createdAt ? new Date(post.createdAt) : null;
      const hoursOld = postDate && !isNaN(postDate.getTime()) ? (now.getTime() - postDate.getTime()) / (1000 * 60 * 60) : Infinity;
      
      // Les sauvegardes ont plus de valeur que les likes
      const timeDecay = 1 / (1 + hoursOld / 18); // Décroissance plus lente que les likes
      score += post.savesCount * timeDecay * 25; // Facteur élevé pour les sauvegardes
    }
    
    // Score basé sur les commentaires (plus de poids que les likes et sauvegardes)
    if (post.comments && Array.isArray(post.comments) && post.comments.length > 0) {
      post.comments.forEach((comment: any) => {
        const commentDate = comment.createdAt ? new Date(comment.createdAt) : null;
        const hoursOld = commentDate && !isNaN(commentDate.getTime()) ? (now.getTime() - commentDate.getTime()) / (1000 * 60 * 60) : Infinity;
        
        // Les commentaires récents ont plus de valeur
        const timeDecay = 1 / (1 + hoursOld / 12); // Décroissance plus rapide pour les commentaires
        score += timeDecay * 20; // Facteur élevé pour les commentaires
      });
    }
    
    return score;
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
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-orange-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tendances</h1>
        </div>
        <p className="text-gray-600">
          Découvrez les publications les plus populaires du moment
        </p>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {trendingPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <TrendingUp className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tendance</h3>
            <p className="text-gray-500">
              Aucune publication n'est en tendance en ce moment. Revenez plus tard !
            </p>
          </div>
        ) : (
          trendingPosts.map((post, index) => (
            <div key={post.id} className="relative">
              {/* Badge de classement pour les 3 premiers */}
              {index < 3 && (
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
              )}
              
              <PostCard 
                post={post} 
                onLogin={onLogin}
                onViewUserProfile={onViewUserProfile}
                onTagClick={onTagClick}
                onViewPost={onViewPost}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrendingPage;
