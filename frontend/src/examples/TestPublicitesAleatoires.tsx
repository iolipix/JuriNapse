import React from 'react';
import { 
  RandomAdBanner, 
  RandomAd, 
  PrestigePhotoAd, 
  AIWebAd 
} from '../components/Ads';

// 🧪 Composant de test pour le système de publicités aléatoires
const TestPublicitesAleatoires: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎯 Test Système Publicités Aléatoires
        </h1>
        
        {/* Section 1: Rotation pure */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🎲 Rotation Pure (toutes marques)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Format Medium (300x250)</h3>
              <RandomAdBanner width={300} height={250} />
            </div>
            <div>
              <h3 className="font-medium mb-2">Format Half (300x600)</h3>
              <RandomAdBanner width={300} height={600} />
            </div>
          </div>
        </section>

        {/* Section 2: Composants Random */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🔄 RandomAd Component</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium mb-2">Format: medium</h3>
              <RandomAd format="medium" />
            </div>
            <div>
              <h3 className="font-medium mb-2">Format: half</h3>
              <RandomAd format="half" />
            </div>
            <div>
              <h3 className="font-medium mb-2">Format: any</h3>
              <RandomAd format="any" />
            </div>
          </div>
        </section>

        {/* Section 3: Prestige Photo */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🎯 Prestige Photo (avec rotation interne)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">PrestigePhotoAd medium</h3>
              <PrestigePhotoAd format="medium" />
            </div>
            <div>
              <h3 className="font-medium mb-2">PrestigePhotoAd half</h3>
              <PrestigePhotoAd format="half" />
            </div>
          </div>
        </section>

        {/* Section 4: AI Web */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🤖 AI Web (avec rotation interne)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">AIWebAd medium</h3>
              <AIWebAd format="medium" />
            </div>
            <div>
              <h3 className="font-medium mb-2">AIWebAd half</h3>
              <AIWebAd format="half" />
            </div>
          </div>
        </section>

        {/* Section 5: Statistiques */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">📊 Répartition Théorique</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-medium text-blue-900">🎯 Prestige Photo</h3>
              <p className="text-blue-700">33.3% (2/6 publicités)</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-medium text-green-900">🤖 AI Web</h3>
              <p className="text-green-700">33.3% (2/6 publicités)</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium text-gray-900">📱 Formats génériques</h3>
              <p className="text-gray-700">33.3% (2/6 publicités)</p>
            </div>
          </div>
        </section>

        {/* Bouton de refresh */}
        <div className="text-center">
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Recharger pour voir d'autres publicités
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestPublicitesAleatoires;