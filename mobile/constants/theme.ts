// Couleurs exactes du site JuriNapse
export const COLORS = {
  // Couleurs principales du site
  primary: '#3b82f6',      // Bleu principal du site
  primaryDark: '#2563eb',  // Bleu plus foncé
  primaryLight: '#60a5fa', // Bleu plus clair
  
  // Couleurs de fond
  background: '#ffffff',    // Fond blanc du site
  backgroundGray: '#f8fafc', // Fond gris clair
  
  // Couleurs de texte
  textPrimary: '#1e293b',   // Texte principal foncé
  textSecondary: '#64748b', // Texte secondaire gris
  textMuted: '#94a3b8',     // Texte atténué
  
  // Couleurs d'état
  success: '#10b981',       // Vert pour succès
  error: '#ef4444',         // Rouge pour erreurs
  warning: '#f59e0b',       // Orange pour avertissements
  
  // Couleurs de bordure
  border: '#e2e8f0',        // Bordure claire
  borderFocus: '#3b82f6',   // Bordure au focus
  
  // Couleurs de gradient (comme sur le site)
  gradientStart: '#2563eb',
  gradientMiddle: '#3b82f6',
  gradientEnd: '#4338ca',
  
  // Couleurs des ombres
  shadow: '#0f172a',
  shadowLight: '#64748b',
};

// Thème complet pour l'app
export const THEME = {
  colors: COLORS,
  
  // Espacements cohérents avec le site
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Rayons de bordure
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  // Tailles de police
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Poids de police
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Ombres
  shadows: {
    sm: {
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 8,
    },
  },
};
