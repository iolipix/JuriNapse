import React, { useState } from 'react';
import { 
  BrandConsistentAd, 
  PrestigePhotoOnlyAd, 
  AIWebOnlyAd 
} from '../components/Ads';

// 🧪 Test du nouveau système de marque cohérente
const TestMarqueCoherente: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const clearSession = () => {
    try {
      sessionStorage.removeItem('jurinapse_ad_brand_session');
      setRefreshKey(prev => prev + 1);
    } catch (e) {
      console.log('SessionStorage not available');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎯 Test Système Marque Cohérente
        </h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-blue-900 mb-2">📋 Comment ça marche :</h2>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• <strong>Une seule marque par session</strong> : Soit Prestige Photo, soit AI Web</li>
            <li>• <strong>Choix au premier chargement</strong> : 50% de chance pour chaque marque</li>
            <li>• <strong>Cohérence garantie</strong> : Toutes les pubs de la session = même marque</li>
            <li>• <strong>Bonnes dimensions</strong> : Chaque marque utilise ses propres images</li>
          </ul>
        </div>

        {/* Contrôles */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex gap-4">
            <button 
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🔄 Rafraîchir les publicités
            </button>
            <button 
              onClick={clearSession}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              🗑️ Nouvelle session (changer de marque)
            </button>
          </div>
        </div>

        {/* Section 1: Marque cohérente */}
        <section className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">🎲 Marque Cohérente (Une seule marque)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Format 300x250 (rectangulaire)</h3>
              <BrandConsistentAd key={`${refreshKey}-1`} width={300} height={250} />
            </div>
            <div>
              <h3 className="font-medium mb-2">Format 300x600 (vertical)</h3>
              <BrandConsistentAd key={`${refreshKey}-2`} width={300} height={600} />
            </div>
          </div>
        </section>

        {/* Section 2: Plus de publicités cohérentes */}
        <section className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">🔄 Même marque sur toute la page</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium mb-2">Pub 1</h3>
              <BrandConsistentAd key={`${refreshKey}-3`} width={300} height={250} />
            </div>
            <div>
              <h3 className="font-medium mb-2">Pub 2</h3>
              <BrandConsistentAd key={`${refreshKey}-4`} width={300} height={250} />
            </div>
            <div>
              <h3 className="font-medium mb-2">Pub 3</h3>
              <BrandConsistentAd key={`${refreshKey}-5`} width={300} height={250} />
            </div>
          </div>
        </section>

        {/* Section 3: Comparaison marques spécifiques */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🆚 Comparaison des marques</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium mb-4 text-center">🎯 Prestige Photo (forcée)</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Format 300x250</p>
                  <PrestigePhotoOnlyAd width={300} height={250} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Format 300x600</p>
                  <PrestigePhotoOnlyAd width={300} height={600} />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-4 text-center">🤖 AI Web (forcée)</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Format 300x250</p>
                  <AIWebOnlyAd width={300} height={250} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Format 300x600</p>
                  <AIWebOnlyAd width={300} height={600} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TestMarqueCoherente;