import React from 'react';
import { User, Clock } from 'lucide-react';
import { RandomInstanceAd, SponsoredContent } from '../components/Ads';
import { usePremiumStatus } from '../hooks/usePremiumStatus';

const TestSponsoredContentBlocking: React.FC = () => {
  const { isPremium } = usePremiumStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header avec statut premium */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Test du Système de Blocage du Contenu Sponsorisé
          </h1>
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-blue-500" />
            <span className="text-gray-700">Statut Premium:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isPremium 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isPremium ? 'Premium Actif' : 'Standard'}
            </span>
          </div>
        </div>

        {/* Contenu principal avec publicités intégrées */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Post simulé 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Article de test 1
              </h3>
              <p className="text-gray-600">
                Ceci est un article de test pour démontrer l'affichage du contenu normal.
              </p>
              <div className="flex items-center text-sm text-gray-500 mt-4">
                <Clock className="h-4 w-4 mr-1" />
                <span>Il y a 2 heures</span>
              </div>
            </div>

            {/* Contenu sponsorisé (bloqué pour premium) */}
            <SponsoredContent>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-xs text-gray-500 mb-4 font-medium">
                  Contenu sponsorisé
                </div>
                <RandomInstanceAd width={468} height={60} className="mx-auto" />
              </div>
            </SponsoredContent>

            {/* Post simulé 2 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Article de test 2
              </h3>
              <p className="text-gray-600">
                Voici un autre article pour montrer la continuité du contenu.
              </p>
              <div className="flex items-center text-sm text-gray-500 mt-4">
                <Clock className="h-4 w-4 mr-1" />
                <span>Il y a 4 heures</span>
              </div>
            </div>

            {/* Autre contenu sponsorisé */}
            <SponsoredContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="text-xs text-yellow-600 mb-3 font-medium">
                  Contenu sponsorisé - Promotion spéciale
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-yellow-800 mb-2">
                    Offre Partenaire Exclusive
                  </h4>
                  <p className="text-yellow-700 mb-4">
                    Découvrez nos services partenaires avec une remise de 20%
                  </p>
                  <RandomInstanceAd width={300} height={250} className="mx-auto" />
                </div>
              </div>
            </SponsoredContent>

            {/* Post simulé 3 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Article de test 3
              </h3>
              <p className="text-gray-600">
                Dernier article pour compléter le test d'affichage.
              </p>
              <div className="flex items-center text-sm text-gray-500 mt-4">
                <Clock className="h-4 w-4 mr-1" />
                <span>Il y a 6 heures</span>
              </div>
            </div>

          </div>

          {/* Sidebar avec publicités */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              
              {/* Publicité sidebar (bloquée pour premium) */}
              <SponsoredContent>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="text-xs text-gray-500 mb-4 font-medium">
                    Contenu sponsorisé
                  </div>
                  <RandomInstanceAd width={300} height={600} className="mx-auto" />
                </div>
              </SponsoredContent>

              {/* Widget normal (toujours visible) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Contenu Normal
                </h4>
                <p className="text-gray-600 text-sm">
                  Ce contenu n'est pas sponsorisé et reste visible pour tous les utilisateurs, 
                  premium ou standard.
                </p>
              </div>

              {/* Autre contenu sponsorisé sidebar */}
              <SponsoredContent>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="text-xs text-blue-600 mb-3 font-medium">
                    Contenu sponsorisé - Formation
                  </div>
                  <h4 className="text-lg font-semibold text-blue-800 mb-2">
                    Formation Juridique
                  </h4>
                  <p className="text-blue-700 text-sm mb-4">
                    Perfectionnez vos connaissances juridiques
                  </p>
                  <RandomInstanceAd width={300} height={250} className="mx-auto" />
                </div>
              </SponsoredContent>

            </div>
          </div>

        </div>

        {/* Instructions pour le test */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Instructions de Test
          </h3>
          <div className="space-y-3 text-blue-800">
            <p>
              <strong>Utilisateur Standard:</strong> Vous devriez voir tous les blocs de contenu sponsorisé 
              avec leurs publicités associées.
            </p>
            <p>
              <strong>Utilisateur Premium:</strong> Tous les blocs marqués "Contenu sponsorisé" 
              doivent être complètement masqués. Seul le contenu normal reste visible.
            </p>
            <p>
              <strong>Test:</strong> Activez/désactivez le statut premium pour vérifier que le 
              contenu sponsorisé apparaît et disparaît correctement.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TestSponsoredContentBlocking;