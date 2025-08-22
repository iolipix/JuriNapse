import React from 'react';
import { Shield, Lock, Eye, Users, Database, Mail } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Politique de confidentialité</h1>
        </div>
        <p className="text-gray-600">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 mb-4">
            <Eye className="h-5 w-5 text-blue-600" />
            <span>1. Collecte des données</span>
          </h2>
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Données que nous collectons :</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Données d'identification</strong> : nom, prénom, adresse e-mail</li>
              <li>• <strong>Données de navigation</strong> : pages visitées, temps de session</li>
              <li>• <strong>Données techniques</strong> : adresse IP, type de navigateur</li>
              <li>• <strong>Cookies et traceurs</strong> : préférences, authentification</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 mb-4">
            <Database className="h-5 w-5 text-blue-600" />
            <span>2. Utilisation des données</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Finalités légitimes :</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Fonctionnement du service</li>
                <li>• Sécurité des comptes</li>
                <li>• Support technique</li>
                <li>• Conformité légale</li>
              </ul>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Avec consentement :</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Analyses statistiques</li>
                <li>• Amélioration de l'expérience</li>
                <li>• Communications marketing</li>
                <li>• Personnalisation</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 mb-4">
            <Lock className="h-5 w-5 text-blue-600" />
            <span>3. Cookies et traceurs</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-medium">Type</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-medium">Finalité</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-medium">Durée</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-medium">Consentement</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-green-600">Nécessaires</td>
                  <td className="border border-gray-300 px-4 py-3">Authentification, sécurité</td>
                  <td className="border border-gray-300 px-4 py-3">Session / 1 an</td>
                  <td className="border border-gray-300 px-4 py-3">Pas requis</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium text-blue-600">Analytiques</td>
                  <td className="border border-gray-300 px-4 py-3">Statistiques d'usage</td>
                  <td className="border border-gray-300 px-4 py-3">2 ans</td>
                  <td className="border border-gray-300 px-4 py-3">Requis</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-purple-600">Marketing</td>
                  <td className="border border-gray-300 px-4 py-3">Publicité personnalisée</td>
                  <td className="border border-gray-300 px-4 py-3">1 an</td>
                  <td className="border border-gray-300 px-4 py-3">Requis</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium text-orange-600">Fonctionnels</td>
                  <td className="border border-gray-300 px-4 py-3">Préférences utilisateur</td>
                  <td className="border border-gray-300 px-4 py-3">6 mois</td>
                  <td className="border border-gray-300 px-4 py-3">Requis</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 mb-4">
            <Users className="h-5 w-5 text-blue-600" />
            <span>4. Vos droits RGPD</span>
          </h2>
          <div className="bg-indigo-50 p-6 rounded-lg">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Droits d'accès et de contrôle :</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• <strong>Droit d'accès</strong> : consulter vos données</li>
                  <li>• <strong>Droit de rectification</strong> : corriger vos données</li>
                  <li>• <strong>Droit à l'effacement</strong> : supprimer vos données</li>
                  <li>• <strong>Droit d'opposition</strong> : refuser le traitement</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Droits de portabilité :</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• <strong>Droit à la portabilité</strong> : exporter vos données</li>
                  <li>• <strong>Droit de limitation</strong> : restreindre le traitement</li>
                  <li>• <strong>Retrait du consentement</strong> : à tout moment</li>
                  <li>• <strong>Droit de réclamation</strong> : auprès de la CNIL</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 mb-4">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>5. Sécurité des données</span>
          </h2>
          <div className="bg-green-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-4">
              Nous mettons en place des mesures techniques et organisationnelles appropriées pour protéger vos données :
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Chiffrement</strong> : SSL/TLS pour les transmissions</li>
              <li>• <strong>Accès contrôlé</strong> : authentification forte</li>
              <li>• <strong>Sauvegarde</strong> : copies de sécurité régulières</li>
              <li>• <strong>Formation</strong> : sensibilisation du personnel</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 mb-4">
            <Mail className="h-5 w-5 text-blue-600" />
            <span>6. Contact et réclamations</span>
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Délégué à la protection des données :</h3>
                <p className="text-gray-700 text-sm mb-2">
                  <strong>Email :</strong> dpo@lexilis.com
                </p>
                <p className="text-gray-700 text-sm mb-2">
                  <strong>Adresse :</strong> [Votre adresse]
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>Téléphone :</strong> [Votre téléphone]
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">En cas de litige :</h3>
                <p className="text-gray-700 text-sm mb-2">
                  Vous pouvez introduire une réclamation auprès de la CNIL :
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>Site web :</strong> <a href="https://www.cnil.fr" className="text-blue-600 underline">www.cnil.fr</a><br />
                  <strong>Adresse :</strong> 3 Place de Fontenoy - TSA 80715 - 75334 PARIS CEDEX 07
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="bg-blue-100 border-l-4 border-blue-500 p-6">
            <h3 className="font-medium text-blue-900 mb-2">Modifications de cette politique</h3>
            <p className="text-blue-800 text-sm">
              Cette politique peut être mise à jour occasionnellement. 
              Nous vous informerons des changements importants par email ou via une notification sur le site.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
