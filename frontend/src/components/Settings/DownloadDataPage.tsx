import React, { useState } from 'react';
import { ArrowLeft, Download, Shield, Clock, CheckCircle, FileText } from 'lucide-react';
import { api } from '../../services/api';

interface DownloadDataPageProps {
  onBack: () => void;
}

const DownloadDataPage: React.FC<DownloadDataPageProps> = ({ onBack }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'requested' | 'processing' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleRequestData = async () => {
    setIsRequesting(true);
    setMessage(null);

    try {
      const response = await api.post('/auth/request-data-export');
      
      if (response.data.success) {
        setRequestStatus('requested');
        setMessage('Votre demande a été enregistrée. Vous recevrez un email lorsque vos données seront prêtes.');
      }
    } catch (error: any) {
      setRequestStatus('error');
      setMessage(error.response?.data?.message || 'Erreur lors de la demande d\'exportation');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get('/auth/download-data', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mes-donnees-jurinapse.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setMessage('Erreur lors du téléchargement. Veuillez réessayer.');
    }
  };

  const dataCategories = [
    {
      title: 'Profil utilisateur',
      description: 'Informations personnelles, préférences, paramètres',
      icon: <Shield className="h-5 w-5" />
    },
    {
      title: 'Publications et contenus',
      description: 'Vos posts, fiches d\'arrêt, commentaires, likes',
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: 'Activité sociale',
      description: 'Abonnements, abonnés, groupes, messages',
      icon: <CheckCircle className="h-5 w-5" />
    },
    {
      title: 'Données techniques',
      description: 'Logs de connexion, adresses IP, métadonnées',
      icon: <Clock className="h-5 w-5" />
    }
  ];

  const renderIdleState = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">
              Conformité RGPD
            </h3>
            <p className="text-blue-700 text-sm">
              Conformément au Règlement Général sur la Protection des Données (RGPD), 
              vous avez le droit d'obtenir une copie de toutes les données personnelles 
              que nous détenons à votre sujet.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Données incluses dans l'export :</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {dataCategories.map((category, index) => (
            <div key={index} className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-gray-600 mt-1">
                  {category.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{category.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Informations importantes :</h4>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• Le traitement de votre demande peut prendre jusqu'à 30 jours</li>
          <li>• Vous recevrez un email de notification lorsque vos données seront prêtes</li>
          <li>• Les données seront disponibles au téléchargement pendant 7 jours</li>
          <li>• Le fichier sera au format JSON/CSV dans une archive ZIP</li>
        </ul>
      </div>

      <button
        onClick={handleRequestData}
        disabled={isRequesting}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        <Download className="h-5 w-5" />
        <span>{isRequesting ? 'Demande en cours...' : 'Demander l\'export de mes données'}</span>
      </button>
    </div>
  );

  const renderRequestedState = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="font-semibold text-green-800 mb-2">
          Demande enregistrée avec succès
        </h3>
        <p className="text-green-700 text-sm">
          Votre demande d'export de données a été enregistrée. 
          Nous préparons vos données et vous enverrons un email lorsqu'elles seront prêtes.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Prochaines étapes :</h4>
        <ol className="text-blue-700 text-sm space-y-2">
          <li className="flex items-start space-x-2">
            <span className="font-semibold text-blue-800">1.</span>
            <span>Nous préparons vos données (peut prendre jusqu'à 30 jours)</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-semibold text-blue-800">2.</span>
            <span>Vous recevrez un email de notification</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-semibold text-blue-800">3.</span>
            <span>Revenez sur cette page pour télécharger vos données</span>
          </li>
        </ol>
      </div>

      <div className="text-center">
        <p className="text-gray-500 text-sm">
          Une nouvelle demande remplacera la précédente si elle est en cours de traitement.
        </p>
        <button
          onClick={() => {
            setRequestStatus('idle');
            setMessage(null);
          }}
          className="mt-3 text-blue-600 hover:underline text-sm"
        >
          Faire une nouvelle demande
        </button>
      </div>
    </div>
  );

  const renderReadyState = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <Download className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="font-semibold text-green-800 mb-2">
          Vos données sont prêtes !
        </h3>
        <p className="text-green-700 text-sm">
          Votre export de données est maintenant disponible au téléchargement.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Attention :</h4>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• Le lien de téléchargement expire dans 7 jours</li>
          <li>• Après téléchargement, les fichiers seront supprimés de nos serveurs</li>
          <li>• Conservez ces données en sécurité</li>
        </ul>
      </div>

      <button
        onClick={handleDownload}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
      >
        <Download className="h-5 w-5" />
        <span>Télécharger mes données</span>
      </button>
    </div>
  );

  const renderErrorState = () => (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-4">⚠️</div>
        <h3 className="font-semibold text-red-800 mb-2">
          Erreur lors de la demande
        </h3>
        <p className="text-red-700 text-sm">
          {message || 'Une erreur est survenue lors du traitement de votre demande.'}
        </p>
      </div>

      <button
        onClick={() => {
          setRequestStatus('idle');
          setMessage(null);
        }}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center space-x-3">
          <Download className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Télécharger mes données</h1>
        </div>
      </div>

      {/* Message */}
      {message && requestStatus === 'idle' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{message}</p>
        </div>
      )}

      {/* Content */}
      <div className="bg-white border rounded-lg p-6">
        {requestStatus === 'idle' && renderIdleState()}
        {requestStatus === 'requested' && renderRequestedState()}
        {requestStatus === 'ready' && renderReadyState()}
        {requestStatus === 'error' && renderErrorState()}
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          Questions sur vos données ? <a href="mailto:privacy@jurinapse.com" className="text-blue-600 hover:underline">Contactez notre DPO</a>
        </p>
      </div>
    </div>
  );
};

export default DownloadDataPage;
