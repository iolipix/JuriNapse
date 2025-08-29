import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { secureLogger } from './utils/logger';

secureLogger.log('🚀 App.tsx chargé - test AuthProvider uniquement');

const MainApp: React.FC = () => {
  secureLogger.log('🎯 MainApp rendu commencé...');
  
  const { user, isLoading } = useAuth();
  secureLogger.log('📊 État: user=', !!user, 'isLoading=', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <h1>Test AuthProvider seul</h1>
      <p>User: {user ? user.username : 'Non connecté'}</p>
      <p>Loading: {isLoading ? 'Oui' : 'Non'}</p>
    </div>
  );
};

function App() {
  secureLogger.log('🏗️ App() fonction appelée');
  
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
