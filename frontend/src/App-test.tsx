secureLogger.log('🚀 App starting...');

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PostProvider, usePost } from './contexts/PostContext';
import { MessagingProvider } from './contexts';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { FolderProvider } from './contexts/FolderContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { secureLogger } from './utils/logger';

secureLogger.log('📝 Imports loaded successfully');

// Composant de test simple
const TestApp: React.FC = () => {
  secureLogger.log('🎯 TestApp rendering...');
  
  return (
    <div style={{ padding: '20px', fontSize: '18px' }}>
      <h1>Test App - Si vous voyez ceci, React fonctionne !</h1>
      <p>Date: {new Date().toLocaleString()}</p>
    </div>
  );
};

function App() {
  secureLogger.log('🏗️ App wrapper rendering...');
  
  try {
    return (
      <AuthProvider>
        <SocketProvider>
          <SubscriptionProvider>
            <NotificationProvider>
              <PostProvider>
                <FolderProvider>
                  <MessagingProvider>
                    <TestApp />
                  </MessagingProvider>
                </FolderProvider>
              </PostProvider>
            </NotificationProvider>
          </SubscriptionProvider>
        </SocketProvider>
      </AuthProvider>
    );
  } catch (error) {
    secureLogger.error('❌ Error in App wrapper:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Erreur de chargement</h1>
        <pre>{String(error)}</pre>
      </div>
    );
  }
}

secureLogger.log('✅ App component defined');

export default App;
