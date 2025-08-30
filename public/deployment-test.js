/* FORCE VERCEL REDEPLOY - 2025-08-30 */
console.log('🚀 DEPLOYMENT TEST MARKER - If you see this, Vercel is working!');

// Add a visible marker to the page
if (typeof document !== 'undefined') {
  const marker = document.createElement('div');
  marker.id = 'deployment-test-marker';
  marker.style.cssText = `
    position: fixed; 
    top: 0; 
    left: 0; 
    background: lime; 
    color: black; 
    padding: 10px; 
    z-index: 99999;
    font-weight: bold;
    font-size: 14px;
  `;
  marker.textContent = '✅ VERCEL DEPLOY SUCCESS - 2025-08-30';
  
  // Add marker when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(marker));
  } else {
    document.body.appendChild(marker);
  }
}
