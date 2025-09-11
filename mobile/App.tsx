import React, { useState } from 'react';
import AuthScreen from './screens/AuthScreenNew';
import HomeScreen from './screens/HomeScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return <HomeScreen onLogout={handleLogout} />;
}
