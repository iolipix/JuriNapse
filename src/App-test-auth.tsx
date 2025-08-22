import React from 'react';
import { AuthProvider } from './contexts/AuthContext';

// Test progressif des contextes
const TestAuthApp: React.FC = () => {
  console.log('🧪 TestAuthApp rendering...');
  
  return (
    <div style={{ 
      padding: '20px', 
      fontSize: '18px',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>Test AuthProvider</h1>
      <p style={{ color: '#666' }}>AuthProvider fonctionne !</p>
    </div>
  );
};

function App() {
  console.log('🏗️ TestApp wrapper rendering...');
  
  try {
    return (
      <AuthProvider>
        <TestAuthApp />
      </AuthProvider>
    );
  } catch (error) {
    console.error('❌ Error in TestApp wrapper:', error);
    return (
      <div style={{ 
        padding: '20px', 
        color: 'red',
        backgroundColor: '#fff',
        minHeight: '100vh'
      }}>
        <h1>Erreur dans AuthProvider</h1>
        <pre>{String(error)}</pre>
      </div>
    );
  }
}

export default App;
