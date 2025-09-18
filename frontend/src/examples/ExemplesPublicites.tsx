import React from 'react';
import { RandomAdBanner, RandomAd, useRandomAd } from '../components/Ads/RandomAdBanner';

/**
 * Exemples d'utilisation du nouveau système de publicités aléatoires
 */

// Exemple 1: Publicité aléatoire basique
export const ExemplePubliciteBasique: React.FC = () => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Publicité Aléatoire</h3>
      <RandomAdBanner className="mx-auto" />
    </div>
  );
};

// Exemple 2: Publicité avec taille spécifique
export const ExemplePubliciteTaille: React.FC = () => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Publicité 300x250</h3>
      <RandomAdBanner 
        width={300} 
        height={250} 
        className="mx-auto border rounded-lg" 
      />
    </div>
  );
};

// Exemple 3: Publicité avec format prédéfini
export const ExemplePubliciteFormat: React.FC = () => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Publicité Format Medium</h3>
      <RandomAd 
        format="medium" 
        className="mx-auto shadow-lg" 
      />
    </div>
  );
};

// Exemple 4: Utilisation avancée avec hook
export const ExemplePubliciteAvancee: React.FC = () => {
  const selectedAd = useRandomAd(300, 250, ['prestige-photo-medium']);
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Publicité Sélectionnée</h3>
      <p className="text-sm text-gray-600 mb-2">
        Publicité actuelle: {selectedAd.id}
      </p>
      <RandomAdBanner 
        width={300} 
        height={250} 
        excludeIds={['prestige-photo-medium']}
        className="mx-auto" 
      />
    </div>
  );
};

// Exemple 5: Sidebar avec publicités aléatoires
export const ExempleSidebarPublicites: React.FC = () => {
  return (
    <div className="w-80 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Sidebar Publicités</h3>
      
      <div className="space-y-6">
        <RandomAdBanner 
          width={300} 
          height={250} 
          className="mx-auto" 
        />
        
        <RandomAdBanner 
          width={300} 
          height={250} 
          className="mx-auto" 
        />
      </div>
    </div>
  );
};

// Exemple 6: Rotation multiple dans un feed
export const ExempleFeedPublicites: React.FC = () => {
  const posts = Array.from({ length: 6 }, (_, i) => ({ id: i, title: `Post ${i + 1}` }));
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h3 className="text-lg font-semibold mb-4">Feed avec Publicités</h3>
      
      {posts.map((post, index) => (
        <div key={post.id} className="mb-6">
          {/* Post */}
          <div className="bg-white p-4 rounded-lg border mb-4">
            <h4 className="font-medium">{post.title}</h4>
            <p className="text-gray-600 text-sm">Contenu du post...</p>
          </div>
          
          {/* Insérer une publicité tous les 2 posts */}
          {(index + 1) % 2 === 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 text-center">Contenu sponsorisé</p>
              <RandomAdBanner 
                width={300} 
                height={250} 
                className="mx-auto" 
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default {
  ExemplePubliciteBasique,
  ExemplePubliciteTaille,
  ExemplePubliciteFormat,
  ExemplePubliciteAvancee,
  ExempleSidebarPublicites,
  ExempleFeedPublicites
};