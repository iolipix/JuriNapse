import React from 'react';
import { RandomInstanceAd, RandomAdBanner } from '../components/Ads';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { Crown, Users, Star } from 'lucide-react';

const TestPremiumAds: React.FC = () => {
  const { isPremium, user } = usePremiumStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test Système Premium - Publicités
        </h1>
        
        {/* Statut utilisateur */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Crown className="h-6 w-6 mr-2" />
            Statut Utilisateur
          </h2>
          
          {user ? (
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>Utilisateur :</strong> {user.username} ({user.firstName} {user.lastName})
              </p>
              <p className="text-gray-700">
                <strong>Statut Premium :</strong> 
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                  isPremium 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isPremium ? '👑 Premium' : '👤 Standard'}
                </span>
              </p>
              <p className="text-gray-700">
                <strong>Publicités :</strong> 
                <span className={`ml-2 ${isPremium ? 'text-green-600' : 'text-blue-600'}`}>
                  {isPremium ? '✅ Cachées (Premium)' : '👁️ Visibles (Standard)'}
                </span>
              </p>
            </div>
          ) : (
            <div className="text-gray-500 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Non connecté - Les publicités sont visibles
            </div>
          )}
        </div>

        {/* Explication du système */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Fonctionnement du Système Premium
          </h3>
          <div className="text-blue-700 space-y-2">
            <p>• <strong>Utilisateurs Standard</strong> : Voient toutes les publicités (Prestige Photo + AIAWEB)</p>
            <p>• <strong>Utilisateurs Premium</strong> : Ne voient aucune publicité (expérience sans pub)</p>
            <p>• <strong>Vérification automatique</strong> : Basée sur le rôle premium de l'utilisateur connecté</p>
            <p>• <strong>Temps réel</strong> : Les publicités disparaissent instantanément quand le premium est accordé</p>
          </div>
        </div>

        {/* Zone de test des publicités */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Zone de Test des Publicités
          </h3>
          
          {isPremium ? (
            <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-yellow-800 mb-2">
                Expérience Premium Activée
              </h4>
              <p className="text-yellow-700">
                Aucune publicité n'est affichée car vous avez le statut Premium.
              </p>
              <p className="text-sm text-yellow-600 mt-2">
                Les emplacements publicitaires ci-dessous sont masqués.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-gray-600 text-center mb-6">
                Les publicités ci-dessous sont visibles car vous n'avez pas le statut Premium.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <h4 className="font-medium mb-3">Publicité 1 (300x250)</h4>
                  <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                    <RandomInstanceAd width={300} height={250} />
                  </div>
                </div>
                
                <div className="text-center">
                  <h4 className="font-medium mb-3">Publicité 2 (300x250)</h4>
                  <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                    <RandomInstanceAd width={300} height={250} />
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-6">
                <h4 className="font-medium mb-3">Publicité Sidebar (300x600)</h4>
                <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg inline-block">
                  <RandomInstanceAd width={300} height={600} />
                </div>
              </div>
              
              <div className="text-center mt-6">
                <h4 className="font-medium mb-3">Ancien Système RandomAdBanner (300x250)</h4>
                <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg inline-block">
                  <RandomAdBanner width={300} height={250} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions pour tester */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-4">Instructions de Test</h3>
          <div className="space-y-2 text-gray-700">
            <p><strong>Pour tester le système :</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Connectez-vous avec un compte standard → Les publicités sont visibles</li>
              <li>Demandez à un modérateur d'accorder le premium → Les publicités disparaissent</li>
              <li>Demandez la révocation du premium → Les publicités réapparaissent</li>
              <li>Rechargez la page → Le statut est maintenu</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPremiumAds;