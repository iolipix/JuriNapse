import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Navigation */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 transition-colors touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="text-sm sm:text-base">Retour</span>
      </button>

      {/* Contenu simple */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          Conditions d'utilisation
        </h1>
        <p className="text-base sm:text-lg text-gray-700">
          Le site est en cours de création, je n'ai pas eu le temps de les rédiger.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
