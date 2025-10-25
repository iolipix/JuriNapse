const https = require('https');
const url = require('url');

/**
 * 🏛️ Service d'intégration avec l'API Judilibre
 * Gère l'import automatique des décisions à la demande
 */

// Configuration API Judilibre
const JUDILIBRE_CONFIG = {
  baseURL: 'https://www.courdecassation.fr/cassation/judilibre/v1.0',
  timeout: 30000, // 30 secondes
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'JuriNapse/1.0 (Legal Research Platform)'
  }
};

/**
 * Fonction helper pour faire des requêtes HTTPS
 */
const makeRequest = (endpoint, method = 'GET') => {
  return new Promise((resolve, reject) => {
    const fullUrl = `${JUDILIBRE_CONFIG.baseURL}${endpoint}`;
    const parsedUrl = url.parse(fullUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.path,
      method: method,
      headers: JUDILIBRE_CONFIG.headers,
      timeout: JUDILIBRE_CONFIG.timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

/**
 * Enrichir automatiquement les données d'une décision via Judilibre
 * @param {string} decisionNumber - Numéro de décision à rechercher
 * @param {string} jurisdiction - Juridiction (défaut: 'Cour de cassation')
 * @returns {Object} Résultat avec données enrichies ou erreur
 */
const enrichDecisionData = async (decisionNumber, jurisdiction = 'Cour de cassation') => {
  try {
    console.log(`🔍 [JUDILIBRE] Recherche décision: ${decisionNumber} (${jurisdiction})`);

    // 1. Rechercher la décision via l'API export
    const query = encodeURIComponent(decisionNumber.trim());
    const jurisdictionCode = encodeURIComponent(mapJurisdictionToCode(jurisdiction));
    const endpoint = `/export?query=${query}&type=arret&jurisdiction=${jurisdictionCode}&batch_size=1`;
    
    const searchResponse = await makeRequest(endpoint);

    if (!searchResponse.data || !searchResponse.data.results || searchResponse.data.results.length === 0) {
      console.log(`❌ [JUDILIBRE] Décision ${decisionNumber} non trouvée`);
      return {
        success: false,
        error: 'Décision non trouvée dans Judilibre',
        searchParams: { decisionNumber, jurisdiction }
      };
    }

    const judilibreDecision = searchResponse.data.results[0];
    console.log(`✅ [JUDILIBRE] Décision trouvée: ${judilibreDecision.id}`);

    // 2. Extraire et normaliser les données
    const enrichedData = {
      decisionNumber: decisionNumber.trim(),
      jurisdiction: jurisdiction,
      judilibreId: judilibreDecision.id,
      ecli: judilibreDecision.ecli || null,
      date: new Date(judilibreDecision.decision_date),
      chamber: judilibreDecision.chamber || null,
      solution: judilibreDecision.solution || null,
      summary: judilibreDecision.summary || '',
      fullText: judilibreDecision.text || '',
      publication: judilibreDecision.publication || null,
      themes: judilibreDecision.themes || [],
      isPublic: true,
      source: 'judilibre',
      rawJudilibreData: judilibreDecision
    };

    console.log(`📊 [JUDILIBRE] Données extraites pour ${decisionNumber}:`, {
      ecli: enrichedData.ecli,
      date: enrichedData.date,
      chamber: enrichedData.chamber,
      textLength: enrichedData.fullText.length
    });

    return {
      success: true,
      enrichedData,
      source: 'judilibre',
      judilibreId: judilibreDecision.id
    };

  } catch (error) {
    console.error(`❌ [JUDILIBRE] Erreur lors de l'enrichissement de ${decisionNumber}:`, error.message);
    
    // Analyser le type d'erreur
    if (error.response) {
      const statusCode = error.response.status;
      if (statusCode === 404) {
        return {
          success: false,
          error: 'Décision non trouvée dans Judilibre',
          statusCode: 404
        };
      } else if (statusCode === 429) {
        return {
          success: false,
          error: 'Limite de débit API Judilibre atteinte',
          statusCode: 429,
          retryAfter: error.response.headers['retry-after'] || 60
        };
      }
    }

    return {
      success: false,
      error: `Erreur API Judilibre: ${error.message}`,
      details: error.response?.data || error.message
    };
  }
};

/**
 * Rechercher des décisions par critères
 * @param {Object} criteria - Critères de recherche
 * @returns {Array} Liste des décisions trouvées
 */
const searchDecisions = async (criteria = {}) => {
  try {
    const {
      query = '',
      type = 'arret',
      jurisdiction = 'cc',
      theme = '',
      dateStart = '',
      dateEnd = '',
      batchSize = 10
    } = criteria;

    console.log(`🔍 [JUDILIBRE] Recherche avec critères:`, criteria);

    const searchParams = {
      batch_size: Math.min(batchSize, 100), // Max 100 par requête
      type,
      jurisdiction
    };

    if (query.trim()) searchParams.query = encodeURIComponent(query.trim());
    if (theme) searchParams.theme = encodeURIComponent(theme);
    if (dateStart) searchParams.date_start = encodeURIComponent(dateStart);
    if (dateEnd) searchParams.date_end = encodeURIComponent(dateEnd);

    // Construire l'URL avec les paramètres
    const queryString = Object.entries(searchParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const endpoint = `/export?${queryString}`;

    const response = await makeRequest(endpoint);

    return {
      success: true,
      results: response.data.results || [],
      total: response.data.total || 0,
      criteria
    };

  } catch (error) {
    console.error(`❌ [JUDILIBRE] Erreur recherche:`, error.message);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
};

/**
 * Mapper la juridiction vers le code Judilibre
 */
const mapJurisdictionToCode = (jurisdiction) => {
  const mapping = {
    'Cour de cassation': 'cc',
    'Conseil d\'État': 'ce', 
    'Cour d\'appel': 'ca',
    'Tribunal judiciaire': 'tj',
    'Tribunal de commerce': 'tc'
  };
  
  return mapping[jurisdiction] || 'cc';
};

/**
 * Obtenir les taxonomies disponibles (types, thèmes, etc.)
 */
const getTaxonomies = async (type = 'theme') => {
  try {
    const endpoint = `/taxonomy?id=${encodeURIComponent(type)}`;
    const response = await makeRequest(endpoint);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`❌ [JUDILIBRE] Erreur taxonomie ${type}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Vérifier la disponibilité de l'API Judilibre
 */
const checkApiHealth = async () => {
  try {
    const response = await makeRequest('/taxonomy?id=type');
    return {
      success: true,
      status: 'API Judilibre opérationnelle',
      responseTime: 'N/A'
    };
  } catch (error) {
    return {
      success: false,
      status: 'API Judilibre indisponible',
      error: error.message
    };
  }
};

module.exports = {
  enrichDecisionData,
  searchDecisions,
  getTaxonomies,
  checkApiHealth,
  mapJurisdictionToCode
};