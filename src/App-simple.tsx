import React from 'react';

// Version simplifiée pour tester
const App: React.FC = () => {
  console.log('🎯 Simple App rendering...');
  
  return (
    <div style={{ 
      padding: '20px', 
      fontSize: '18px',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>Test Lexilis App</h1>
      <p style={{ color: '#666' }}>Si vous voyez ceci, React fonctionne !</p>
      <p style={{ color: '#666' }}>Date: {new Date().toLocaleString()}</p>
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#e8f5e8',
        border: '1px solid #4caf50',
        borderRadius: '4px'
      }}>
        ✅ L'application se charge correctement
      </div>
    </div>
  );
};

export default App;
