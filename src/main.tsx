import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
// Force usage of the canonical frontend App to avoid duplicate App bundles.
import App from '../frontend/src/App.tsx';
// Build marker
if (typeof window !== 'undefined') {
  (window as any).__buildVariant = 'unified-frontend-app';
  console.log('[BuildMarker] Using unified frontend App via src/main.tsx');
}
import './index.css';

const rootElement = document.getElementById('root')!;

// Support pour le prérendu avec react-snap
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, (
    <StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </StrictMode>
  ));
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </StrictMode>
  );
}
