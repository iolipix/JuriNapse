import React from 'react';
import { secureLogger } from './utils/logger';

function App() {
  secureLogger.log('🏗️ App() fonction appelée - version minimale');
  
  return (
    <div>
      <h1>Application de test</h1>
      <p>Si vous voyez ceci, React fonctionne correctement.</p>
    </div>
  );
}

export default App;
