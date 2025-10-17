// Service pour l'intégration API Judilibre

// Configuration de l'URL de l'API
const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  return import.meta.env.VITE_API_BASE_URL || 'https://jurinapse-production.up.railway.app/api';
};

const API_BASE_URL = getApiBaseUrl();

export const judilibreAPI = {
  /**
   * Enrichir automatiquement une décision via Judilibre
   */
  async enrichDecision(decisionNumber, jurisdiction) {
    try {
      const response = await fetch(`${API_BASE_URL}/judilibre/enrich`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          decisionNumber: decisionNumber.trim(),
          jurisdiction
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur enrichissement Judilibre:', error);
      throw error;
    }
  },

  /**
   * Obtenir des suggestions de décisions (autocomplétion)
   */
  async getSuggestions(query, jurisdiction = 'Cour de cassation') {
    try {
      const params = new URLSearchParams({
        query: query.trim(),
        jurisdiction
      });

      const response = await fetch(`${API_BASE_URL}/judilibre/suggest?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Erreur suggestions Judilibre:', error);
      return [];
    }
  },

  /**
   * Télécharger un fichier de décision
   */
  async downloadDecision(fileName) {
    try {
      const response = await fetch(`${API_BASE_URL}/judilibre/download/${fileName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      // Créer un lien de téléchargement
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur téléchargement décision:', error);
      throw error;
    }
  }
};