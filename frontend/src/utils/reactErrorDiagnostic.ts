// DIAGNOSTIC REACT ERROR #310
// Ce fichier aide à identifier et déboguer l'erreur React #310

export const reactErrorDiagnostic = {
  logError310: (error: Error, componentStack?: string) => {
    console.error('🚨 REACT ERROR #310 DETECTED');
    console.error('Error details:', error);
    console.error('Component stack:', componentStack);
    
    // Informations détaillées sur les hooks conditionnels
    console.error(`
🔍 REACT ERROR #310 DIAGNOSTIC:
1. Cette erreur survient quand des hooks sont appelés conditionnellement
2. Causes communes:
   - useCallback/useMemo avec dépendances instables
   - Hooks appelés dans des conditions (if/switch)
   - Hooks appelés dans des boucles
   - Contexte undefined qui change l'ordre des hooks

3. SOLUTIONS APPLIQUÉES:
   ✅ Supprimé tous les useCallback dans PostContext
   ✅ Supprimé l'utilisation conditionnelle d'useAuth()
   ✅ Simplifié les dépendances des hooks
   ✅ Éliminé les dépendances circulaires

4. Si l'erreur persiste, vérifier:
   - Les composants qui utilisent usePost()
   - L'ordre d'appel des hooks dans les composants
   - Les dépendances des useEffect
    `);
  },

  checkHookStability: () => {
    console.log('🔍 CHECKING HOOK STABILITY');
    
    // Vérifier si React est en mode développement
    const isDev = process.env.NODE_ENV === 'development';
    console.log('React Development Mode:', isDev);
    
    // Vérifier les contextes disponibles
    try {
      const PostContext = require('../contexts/PostContext');
      console.log('PostContext available:', !!PostContext);
    } catch (e) {
      console.warn('PostContext import error:', e);
    }
    
    try {
      const AuthContext = require('../contexts/AuthContext');
      console.log('AuthContext available:', !!AuthContext);
    } catch (e) {
      console.warn('AuthContext import error:', e);
    }
  },

  forceComponentRefresh: () => {
    // Forcer un refresh des composants React
    console.log('🔄 FORCING COMPONENT REFRESH');
    
    // Vider le cache React si possible
    if (window && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      try {
        (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = null;
        console.log('React DevTools hook cleared');
      } catch (e) {
        console.warn('Could not clear React DevTools hook');
      }
    }
    
    // Forcer un re-render global
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
};

// Export global pour debugging dans la console
if (typeof window !== 'undefined') {
  (window as any).reactErrorDiagnostic = reactErrorDiagnostic;
}
