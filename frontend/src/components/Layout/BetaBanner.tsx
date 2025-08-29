import React from 'react';
import { Info, X, Zap } from 'lucide-react';

interface BetaBannerProps {
  onDismiss?: () => void;
  dismissible?: boolean;
  variant?: 'default' | 'animated' | 'minimal';
}

const BetaBanner: React.FC<BetaBannerProps> = ({ 
  onDismiss, 
  dismissible = false, 
  variant = 'default' 
}) => {
  if (variant === 'minimal') {
    return (
      <div className="bg-blue-600 text-white text-center py-2 text-sm sticky top-16 z-40">
        <span className="font-medium">Version Bêta</span>
        <span className="mx-2">•</span>
        <span>Site en développement</span>
      </div>
    );
  }

  if (variant === 'animated') {
    return (
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-sm border-b border-blue-300 overflow-hidden sticky top-16 z-40">
        {/* Animation de particules en arrière-plan */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-6 h-6 bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-2 left-1/3 w-4 h-4 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-1.5 rounded-full animate-pulse">
                <Zap className="h-4 w-4" />
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-bold text-lg">Version Bêta</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-blue-100 text-sm hidden sm:inline animate-pulse">
                  Découvrez les dernières fonctionnalités en avant-première !
                </span>
                <span className="text-blue-100 text-sm sm:hidden">
                  Avant-première
                </span>
              </div>
            </div>
            
            {dismissible && onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Masquer le bandeau"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Variant par défaut
  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-sm border-b border-blue-300 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-1.5 rounded-full">
              <Info className="h-4 w-4" />
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-semibold">Version Bêta</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-blue-100 text-sm hidden sm:inline">
                Cette version est en cours de développement. Merci de votre patience !
              </span>
              <span className="text-blue-100 text-sm sm:hidden">
                En développement
              </span>
            </div>
          </div>
          
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Masquer le bandeau"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BetaBanner;
