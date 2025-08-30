// Minimal stub redirecting to canonical frontend App implementation.
import FrontendApp from '../frontend/src/App';

if (typeof window !== 'undefined') {
  try {
    (window as any).__debugWhichApp = 'stub-redirect-App';
    (window as any).__debugStubAppTimestamp = Date.now();
  } catch {}
}

export default FrontendApp;
