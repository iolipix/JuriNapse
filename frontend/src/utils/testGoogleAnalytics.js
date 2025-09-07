// 🧪 Test Google Analytics - JuriNapse
// Pour vérifier que le tracking fonctionne

const testGoogleAnalytics = () => {
  console.log('🧪 TESTS GOOGLE ANALYTICS - JURINAPSE');
  console.log('ID configuré: G-3NV8LWDG0D');
  console.log('='.repeat(50));

  // Test 1: Vérifier si gtag est chargé
  if (typeof window.gtag === 'function') {
    console.log('✅ Google Analytics chargé');
    
    // Test 2: Envoyer un événement de test
    window.gtag('event', 'test_event', {
      event_category: 'Test',
      event_label: 'Integration Test',
      value: 1
    });
    console.log('📊 Événement de test envoyé');
    
    // Test 3: Tracker une page de test
    window.gtag('config', 'G-3NV8LWDG0D', {
      page_title: 'Test Page',
      page_location: window.location.href
    });
    console.log('📄 Page de test trackée');
    
  } else {
    console.log('❌ Google Analytics non chargé');
    console.log('💡 Vérifiez que le script est bien dans <head>');
  }

  // Test 4: Vérifier le consentement
  const consent = localStorage.getItem('analytics_consent');
  console.log('🍪 Consentement Analytics:', consent || 'Non défini');
  
  // Test 5: Vérifier la configuration
  console.log('⚙️ Configuration:');
  console.log('- ID Measurement:', 'G-3NV8LWDG0D');
  console.log('- Domaine:', window.location.hostname);
  console.log('- HTTPS:', window.location.protocol === 'https:' ? '✅' : '❌');
  
  console.log('='.repeat(50));
  console.log('✅ Tests terminés. Vérifiez la console Google Analytics dans 24h.');
};

// Lancer le test automatiquement
if (typeof window !== 'undefined') {
  // Attendre que Google Analytics soit chargé
  setTimeout(testGoogleAnalytics, 2000);
}

export { testGoogleAnalytics };
