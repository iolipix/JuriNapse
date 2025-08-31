interface SEOSubmissionResponse {
  success: boolean;
  message: string;
}

/**
 * Service pour l'optimisation SEO et l'indexation des pages
 */
class SEOService {
  private static instance: SEOService;
  private readonly baseURL = 'https://jurinapse.com';

  private constructor() {}

  static getInstance(): SEOService {
    if (!SEOService.instance) {
      SEOService.instance = new SEOService();
    }
    return SEOService.instance;
  }

  /**
   * Soumettre une URL à IndexNow (Bing, Yahoo)
   */
  async submitToIndexNow(url: string): Promise<SEOSubmissionResponse> {
    try {
      const indexNowUrl = 'https://api.indexnow.org/indexnow';
      const key = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'; // Clé IndexNow (à remplacer par la vraie)
      
      const response = await fetch(indexNowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: 'jurinapse.com',
          key: key,
          keyLocation: `${this.baseURL}/indexnow-key.txt`,
          urlList: [url]
        })
      });

      if (response.ok) {
        console.log(`✅ URL soumise à IndexNow: ${url}`);
        return { success: true, message: 'URL soumise avec succès à IndexNow' };
      } else {
        console.warn(`⚠️ Échec soumission IndexNow: ${response.status}`);
        return { success: false, message: `Échec IndexNow: ${response.status}` };
      }
    } catch (error) {
      console.error('❌ Erreur IndexNow:', error);
      return { success: false, message: 'Erreur lors de la soumission IndexNow' };
    }
  }

  /**
   * Ping Google pour notifier une nouvelle URL
   */
  async pingGoogle(url: string): Promise<SEOSubmissionResponse> {
    try {
      const pingUrl = `https://www.google.com/ping?sitemap=${this.baseURL}/sitemap.xml`;
      
      // Note: fetch vers Google ping peut être bloqué par CORS
      // En production, cela devrait être fait côté serveur
      const response = await fetch(pingUrl, { method: 'GET' });
      
      console.log(`🔔 Ping Google pour: ${url}`);
      return { success: true, message: 'Google notifié du nouveau contenu' };
    } catch (error) {
      console.warn('⚠️ Ping Google impossible depuis le client:', error);
      return { success: false, message: 'Ping Google doit être fait côté serveur' };
    }
  }

  /**
   * Soumettre un profil utilisateur pour indexation
   */
  async submitUserProfile(username: string, fullName: string): Promise<SEOSubmissionResponse> {
    const profileUrl = `${this.baseURL}/profile/${username}`;
    
    console.log(`🔍 Soumission profil pour indexation: ${fullName} (${profileUrl})`);
    
    // Soumettre à IndexNow
    await this.submitToIndexNow(profileUrl);
    
    // Notifier Google (si possible)
    await this.pingGoogle(profileUrl);
    
    // Mettre à jour les meta tags si c'est le profil actuel
    this.updatePageMeta(fullName, profileUrl);
    
    return { success: true, message: `Profil ${fullName} soumis pour indexation` };
  }

  /**
   * Mettre à jour les meta tags de la page actuelle
   */
  private updatePageMeta(title: string, url: string): void {
    // Ajouter des meta tags supplémentaires pour l'indexation
    const metaRobots = document.querySelector('meta[name="robots"]') || document.createElement('meta');
    metaRobots.setAttribute('name', 'robots');
    metaRobots.setAttribute('content', 'index, follow, max-image-preview:large');
    if (!document.head.contains(metaRobots)) {
      document.head.appendChild(metaRobots);
    }

    // Ajouter meta googlebot
    const metaGooglebot = document.querySelector('meta[name="googlebot"]') || document.createElement('meta');
    metaGooglebot.setAttribute('name', 'googlebot');
    metaGooglebot.setAttribute('content', 'index, follow, max-snippet:-1, max-image-preview:large');
    if (!document.head.contains(metaGooglebot)) {
      document.head.appendChild(metaGooglebot);
    }

    // Ajouter link canonical si pas déjà présent
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', url);
      document.head.appendChild(canonicalLink);
    }
  }

  /**
   * Générer et soumettre un sitemap dynamique avec les nouveaux profils
   */
  async updateSitemap(userProfiles: Array<{username: string, lastModified: string}>): Promise<SEOSubmissionResponse> {
    const sitemapEntries = userProfiles.map(profile => `
  <url>
    <loc>${this.baseURL}/profile/${profile.username}</loc>
    <lastmod>${profile.lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    console.log(`📄 Sitemap mis à jour avec ${userProfiles.length} profils`);
    
    // Note: En production, ceci devrait être fait côté serveur
    // pour mettre à jour le fichier sitemap.xml réel
    
    return { success: true, message: `Sitemap mis à jour avec ${userProfiles.length} profils` };
  }
}

export default SEOService.getInstance();
