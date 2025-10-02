// Hook pour nettoyer les styles AdSense problématiques
import { useEffect } from 'react';

export const useAdSenseCleanup = () => {
  useEffect(() => {
    const cleanupAdSenseStyles = () => {
      // Nettoyer tous les éléments AdSense
      const adElements = document.querySelectorAll(
        '.adsbygoogle, [data-ad-client], iframe[src*="googleads"], iframe[src*="googlesyndication"]'
      );
      
      adElements.forEach(element => {
        if (element instanceof HTMLElement) {
          // Supprimer les styles problématiques
          element.style.border = 'none';
          element.style.boxShadow = 'none';
          element.style.background = 'transparent';
          element.style.outline = 'none';
          element.style.maxWidth = '300px';
          element.style.overflow = 'hidden';
        }
      });

      // Supprimer les div containers AdSense problématiques
      const adContainers = document.querySelectorAll('div[id*="google_ads"]');
      adContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.style.border = 'none';
          container.style.boxShadow = 'none';
          container.style.background = 'transparent';
          container.style.maxWidth = '300px';
          container.style.overflow = 'hidden';
        }
      });
    };

    // Exécuter immédiatement
    cleanupAdSenseStyles();

    // Nettoyer après les chargements d'AdSense
    const observer = new MutationObserver((mutations) => {
      let shouldCleanup = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.classList?.contains('adsbygoogle') || 
                  node.querySelector?.('.adsbygoogle') ||
                  node.getAttribute?.('data-ad-client')) {
                shouldCleanup = true;
              }
            }
          });
        }
      });
      
      if (shouldCleanup) {
        setTimeout(cleanupAdSenseStyles, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Nettoyer périodiquement (au cas où)
    const interval = setInterval(cleanupAdSenseStyles, 2000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);
};

export default useAdSenseCleanup;