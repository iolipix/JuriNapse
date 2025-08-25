import React from 'react';

interface SimpleAdBannerProps {
  className?: string;
}

const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({ className = '' }) => {
  // Mode test simple - pas de dépendance au contexte
  return (
    <div 
      className={`border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-gray-600 ${className}`}
      style={{ 
        width: '100%',
        height: '250px',
        maxWidth: '300px'
      }}
    >
      <div className="text-center p-4">
        <div className="text-lg font-semibold mb-2">🎯 Publicité Test</div>
        <div className="text-sm opacity-75">
          Emplacement publicitaire<br/>
          300×250px
        </div>
      </div>
    </div>
  );
};

export default SimpleAdBanner;
