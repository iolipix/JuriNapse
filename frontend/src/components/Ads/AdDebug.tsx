import React from 'react';
import { useAds } from './AdProvider';

const AdDebug: React.FC = () => {
  const { config, isLoaded, error } = useAds();

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
      <h3 className="font-bold">🐛 Debug Publicités</h3>
      <div className="mt-2 space-y-1 text-sm">
        <div>✅ Enabled: {config.enabled ? 'OUI' : 'NON'}</div>
        <div>🧪 Test Mode: {config.testMode ? 'OUI' : 'NON'}</div>
        <div>🆔 Client ID: {config.clientId}</div>
        <div>📦 Script Loaded: {isLoaded ? 'OUI' : 'NON'}</div>
        <div>❌ Error: {error || 'Aucune'}</div>
        <div className="mt-2">
          <div>🔧 ENV ENABLED: {import.meta.env.VITE_GOOGLE_ADS_ENABLED}</div>
          <div>🔧 ENV TEST: {import.meta.env.VITE_GOOGLE_ADS_TEST_MODE}</div>
          <div>🔧 ENV CLIENT: {import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID}</div>
        </div>
      </div>
    </div>
  );
};

export default AdDebug;
