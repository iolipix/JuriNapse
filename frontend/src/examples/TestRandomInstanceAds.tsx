import React from 'react';
import { RandomInstanceAd } from '../components/Ads';

const TestRandomInstanceAds: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test Publicités Aléatoires par Instance
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            📋 Fonctionnement du Nouveau Système
          </h2>
          <div className="space-y-2 text-gray-700">
            <p>• <strong>Aléatoire à la génération</strong> : Chaque publicité génère sa marque indépendamment</p>
            <p>• <strong>Stable sur la page</strong> : Une fois générée, la pub ne change plus</p>
            <p>• <strong>Mix possible</strong> : Sur une même page, on peut avoir Prestige Photo ET AI Web</p>
            <p>• <strong>50/50 distribution</strong> : Chaque pub a 50% de chance d'être l'une ou l'autre</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Publicité 1 (300x250)</h3>
            <RandomInstanceAd width={300} height={250} />
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Publicité 2 (300x250)</h3>
            <RandomInstanceAd width={300} height={250} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Publicité 3 (300x600)</h3>
            <RandomInstanceAd width={300} height={600} />
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Publicité 4 (300x250)</h3>
            <RandomInstanceAd width={300} height={250} />
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Publicité 5 (300x250)</h3>
            <RandomInstanceAd width={300} height={250} />
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
          <h3 className="font-semibold text-blue-800 mb-2">
            🔄 Test du Comportement
          </h3>
          <div className="text-blue-700 space-y-1">
            <p>1. <strong>Rechargez la page</strong> → Les publicités changeront aléatoirement</p>
            <p>2. <strong>Restez sur la page</strong> → Les publicités restent stables</p>
            <p>3. <strong>Observez le mix</strong> → Vous pouvez avoir différentes marques sur la même page</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Résultats Possibles par Page :</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <strong>Exemple 1 :</strong><br/>
              Pub 1: Prestige Photo<br/>
              Pub 2: AI Web<br/>
              Pub 3: Prestige Photo
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>Exemple 2 :</strong><br/>
              Pub 1: AI Web<br/>
              Pub 2: AI Web<br/>
              Pub 3: Prestige Photo
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>Exemple 3 :</strong><br/>
              Pub 1: Prestige Photo<br/>
              Pub 2: Prestige Photo<br/>
              Pub 3: Prestige Photo
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>Exemple 4 :</strong><br/>
              Pub 1: AI Web<br/>
              Pub 2: Prestige Photo<br/>
              Pub 3: AI Web
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRandomInstanceAds;