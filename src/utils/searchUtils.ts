// Utilitaires de recherche avec tolérance aux fautes de frappe
export class SearchUtils {
  // Calcul de la distance de Levenshtein pour la similarité des chaînes
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Calcul du score de similarité (0-1, 1 étant identique)
  static similarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Recherche floue dans un texte
  static fuzzyMatch(query: string, text: string, threshold: number = 0.6): boolean {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Correspondance exacte
    if (textLower.includes(queryLower)) return true;
    
    // Recherche par mots
    const queryWords = queryLower.split(' ').filter(w => w.length > 0);
    const textWords = textLower.split(' ').filter(w => w.length > 0);
    
    for (const queryWord of queryWords) {
      let found = false;
      for (const textWord of textWords) {
        if (this.similarity(queryWord, textWord) >= threshold) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    
    return true;
  }

  // Calcul du score de pertinence pour un résultat
  static calculateRelevanceScore(query: string, item: any, type: 'user' | 'post' | 'decision'): number {
    const queryLower = query.toLowerCase();
    let score = 0;
    
    if (type === 'user') {
      // Score pour les utilisateurs
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
      const username = item.username.toLowerCase();
      const university = (item.university || '').toLowerCase();
      
      // Correspondance exacte = score élevé
      if (fullName.includes(queryLower)) score += 10;
      if (username.includes(queryLower)) score += 8;
      if (university.includes(queryLower)) score += 6;
      
      // Correspondance floue
      score += this.similarity(queryLower, fullName) * 5;
      score += this.similarity(queryLower, username) * 4;
      score += this.similarity(queryLower, university) * 3;
      
      // Bonus pour les utilisateurs populaires
      const followersCount = this.getFollowersCount(item.id);
      score += Math.min(followersCount / 10, 2);
      
    } else if (type === 'post') {
      // Score pour les posts
      const title = item.title.toLowerCase();
      const content = item.content.toLowerCase();
      const tags = item.tags.join(' ').toLowerCase();
      const authorName = item.authorId ? `${item.authorId.firstName} ${item.authorId.lastName}`.toLowerCase() : '';
      
      // Correspondance exacte
      if (title.includes(queryLower)) score += 15;
      if (content.includes(queryLower)) score += 10;
      if (tags.includes(queryLower)) score += 12;
      if (authorName.includes(queryLower)) score += 8;
      
      // Correspondance floue
      score += this.similarity(queryLower, title) * 8;
      score += this.similarity(queryLower, content) * 5;
      score += this.similarity(queryLower, tags) * 6;
      
      // Bonus pour les posts populaires
      score += Math.min(item.likes / 5, 3);
      score += Math.min(item.comments.length / 2, 2);
      
      // Bonus pour les posts récents
      const daysSinceCreation = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 7) score += 2;
      
    } else if (type === 'decision') {
      // Score pour les décisions
      const decisionNumber = item.decisionNumber.toLowerCase();
      
      if (decisionNumber.includes(queryLower)) score += 20;
      score += this.similarity(queryLower, decisionNumber) * 10;
      
      // Bonus pour les décisions avec beaucoup de fiches
      score += Math.min(item.postsCount * 2, 5);
      score += Math.min(item.totalLikes / 10, 3);
    }
    
    return score;
  }

  // Fonction helper pour obtenir le nombre de followers (à implémenter selon votre contexte)
  private static getFollowersCount(_userId: string): number {
    // TODO: Implémenter avec l'API MongoDB
    return 0;
  }

  // Normalisation du texte pour la recherche
  static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^\w\s]/g, ' ') // Remplacer la ponctuation par des espaces
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .trim();
  }

  // Mise en évidence des termes trouvés
  static highlightMatches(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 0);
    let highlightedText = text;
    
    queryWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }
}