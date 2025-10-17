const axios = require('axios');

class JudilibreService {
  constructor() {
    this.baseURL = 'https://sandbox-api.piste.gouv.fr/cassation/judilibre/v1.0';
    this.apiKey = '796f47b5-b3ac-4cd4-89a3-9f1042e6b6a3';
    this.timeout = 10000;
  }

  /**
   * Rechercher une décision par numéro
   * @param {string} decisionNumber - Numéro de la décision (ex: "23-12.120")
   * @param {string} jurisdiction - Juridiction (cc, ce, ca, tj, tcom)
   * @returns {Promise<Object>} Résultat de la recherche
   */
  async searchDecisionByNumber(decisionNumber, jurisdiction = 'cc') {
    try {
      const searchQuery = `number:${decisionNumber}`;
      
      const response = await axios.get(`${this.baseURL}/search`, {
        headers: {
          'KeyId': this.apiKey,
          'accept': 'application/json'
        },
        params: {
          query: searchQuery,
          jurisdiction: jurisdiction,
          page_size: 10
        },
        timeout: this.timeout
      });

      return {
        success: true,
        data: response.data,
        decisions: response.data.results || []
      };

    } catch (error) {
      console.error('Erreur recherche Judilibre:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        decisions: []
      };
    }
  }

  /**
   * Récupérer le texte complet d'une décision
   * @param {string} decisionId - ID de la décision Judilibre
   * @returns {Promise<Object>} Décision complète avec texte
   */
  async getFullDecision(decisionId) {
    try {
      const response = await axios.get(`${this.baseURL}/decision`, {
        headers: {
          'KeyId': this.apiKey,
          'accept': 'application/json'
        },
        params: {
          id: decisionId,
          resolve_references: true
        },
        timeout: this.timeout
      });

      return {
        success: true,
        decision: response.data
      };

    } catch (error) {
      console.error('Erreur récupération décision complète:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Mapper la juridiction frontend vers le code Judilibre
   * @param {string} frontendJurisdiction - Nom de juridiction depuis le frontend
   * @returns {string} Code juridiction pour l'API
   */
  mapJurisdiction(frontendJurisdiction) {
    const mapping = {
      'Cour de cassation': 'cc',
      'Conseil d\'État': 'ce', 
      'Cour d\'appel': 'ca',
      'Tribunal judiciaire': 'tj',
      'Tribunal de commerce': 'tcom'
    };

    return mapping[frontendJurisdiction] || 'cc'; // Par défaut Cour de cassation
  }

  /**
   * Enrichir automatiquement une fiche d'arrêt
   * @param {string} decisionNumber - Numéro de décision
   * @param {string} jurisdiction - Juridiction
   * @returns {Promise<Object>} Données enrichies pour la fiche
   */
  async enrichDecisionData(decisionNumber, jurisdiction) {
    try {
      // 1. Rechercher la décision
      const searchResult = await this.searchDecisionByNumber(decisionNumber, this.mapJurisdiction(jurisdiction));
      
      if (!searchResult.success || searchResult.decisions.length === 0) {
        return {
          success: false,
          error: 'Décision non trouvée dans Judilibre',
          enrichedData: null
        };
      }

      // 2. Prendre la première décision (meilleur match)
      const decision = searchResult.decisions[0];

      // 3. Récupérer le texte complet si disponible
      let fullText = null;
      if (decision.id) {
        const fullDecision = await this.getFullDecision(decision.id);
        if (fullDecision.success) {
          fullText = fullDecision.decision.text;
        }
      }

      // 4. Construire les données enrichies
      const enrichedData = {
        // Données de base
        decisionNumber: decision.number || decisionNumber,
        jurisdiction: jurisdiction,
        chamber: this.formatChamber(decision.chamber),
        date: decision.decision_date,
        solution: this.formatSolution(decision.solution),
        
        // Métadonnées juridiques
        ecli: decision.ecli,
        publication: decision.publication?.join(', ') || '',
        themes: decision.themes || [],
        
        // Contenu
        summary: decision.summary || '',
        fullText: fullText,
        
        // Données Judilibre pour référence
        judilibreId: decision.id,
        judilibreData: decision
      };

      return {
        success: true,
        enrichedData,
        sourceDecision: decision
      };

    } catch (error) {
      console.error('Erreur enrichissement décision:', error);
      return {
        success: false,
        error: error.message,
        enrichedData: null
      };
    }
  }

  /**
   * Formater le nom de la chambre
   */
  formatChamber(chamber) {
    const chambers = {
      'civ1': '1ère chambre civile',
      'civ2': '2ème chambre civile', 
      'civ3': '3ème chambre civile',
      'comm': 'Chambre commerciale',
      'soc': 'Chambre sociale',
      'crim': 'Chambre criminelle'
    };
    return chambers[chamber] || chamber;
  }

  /**
   * Formater la solution
   */
  formatSolution(solution) {
    const solutions = {
      'cassation': 'Cassation',
      'rejet': 'Rejet',
      'non-lieu': 'Non-lieu à statuer',
      'irrecevabilite': 'Irrecevabilité'
    };
    return solutions[solution] || solution;
  }
}

module.exports = new JudilibreService();