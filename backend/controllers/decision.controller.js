const Decision = require('../models/decision.model');
const judilibreService = require('../services/judilibre.service');

/**
 * Récupérer une décision par numéro
 * Si elle n'existe pas en BDD, tenter de l'ajouter automatiquement via Judilibre
 */
const getDecisionByNumber = async (req, res) => {
  try {
    const { decisionNumber } = req.params;
    const { jurisdiction = 'Cour de cassation' } = req.query;

    // 1. Vérifier si la décision existe déjà en BDD
    let decision = await Decision.findOne({ 
      decisionNumber: decisionNumber.trim(),
      jurisdiction 
    });

    if (decision) {
      return res.json({
        success: true,
        decision,
        source: 'database',
        message: 'Décision trouvée en base de données'
      });
    }

    // 2. Si pas en BDD, essayer de la récupérer automatiquement via Judilibre
    console.log(`📥 Décision ${decisionNumber} non trouvée, tentative d'import automatique...`);
    
    const enrichmentResult = await judilibreService.enrichDecisionData(decisionNumber, jurisdiction);
    
    if (!enrichmentResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Décision non trouvée',
        details: enrichmentResult.error,
        suggested: {
          decisionNumber,
          jurisdiction,
          message: 'Cette décision pourrait être ajoutée manuellement'
        }
      });
    }

    // 3. Sauvegarder la décision en BDD
    const enrichedData = enrichmentResult.enrichedData;
    decision = new Decision({
      decisionNumber: enrichedData.decisionNumber,
      jurisdiction: enrichedData.jurisdiction,
      chamber: enrichedData.chamber,
      date: new Date(enrichedData.date),
      solution: enrichedData.solution,
      ecli: enrichedData.ecli,
      judilibreId: enrichedData.judilibreId,
      summary: enrichedData.summary,
      fullText: enrichedData.fullText,
      publication: enrichedData.publication,
      themes: enrichedData.themes,
      source: 'judilibre',
      rawJudilibreData: enrichedData.judilibreData,
      createdBy: req.user?.id // Si utilisateur connecté
    });

    await decision.save();

    console.log(`✅ Décision ${decisionNumber} importée automatiquement depuis Judilibre`);

    return res.json({
      success: true,
      decision,
      source: 'judilibre_auto_import',
      message: 'Décision importée automatiquement depuis Judilibre'
    });

  } catch (error) {
    console.error('Erreur getDecisionByNumber:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la décision',
      details: error.message
    });
  }
};

/**
 * Lister toutes les décisions avec pagination
 */
const getDecisions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      jurisdiction, 
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    // Filtres
    if (jurisdiction) {
      filter.jurisdiction = jurisdiction;
    }

    if (search) {
      filter.$or = [
        { decisionNumber: { $regex: search, $options: 'i' } },
        { $text: { $search: search } }
      ];
    }

    // Tri
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const decisions = await Decision.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-rawJudilibreData -fullText'); // Exclure les gros champs pour la liste

    const total = await Decision.countDocuments(filter);

    res.json({
      success: true,
      decisions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur getDecisions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des décisions'
    });
  }
};

/**
 * Rechercher des décisions (autocomplétion)
 */
const searchDecisions = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const decisions = await Decision.find({
      decisionNumber: { $regex: q.trim(), $options: 'i' }
    })
    .select('decisionNumber jurisdiction chamber date')
    .limit(parseInt(limit))
    .sort({ date: -1 });

    const suggestions = decisions.map(decision => ({
      decisionNumber: decision.decisionNumber,
      jurisdiction: decision.jurisdiction,
      chamber: decision.chamber,
      date: decision.date,
      displayText: `${decision.decisionNumber} - ${decision.jurisdiction}${decision.chamber ? ', ' + decision.chamber : ''}`
    }));

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Erreur searchDecisions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche'
    });
  }
};

/**
 * Forcer l'import d'une décision spécifique
 */
const forceImportDecision = async (req, res) => {
  try {
    const { decisionNumber, jurisdiction = 'Cour de cassation' } = req.body;

    if (!decisionNumber) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de décision requis'
      });
    }

    // Vérifier si existe déjà
    const existingDecision = await Decision.findOne({ decisionNumber, jurisdiction });
    if (existingDecision) {
      return res.json({
        success: true,
        decision: existingDecision,
        message: 'Décision déjà présente en base de données'
      });
    }

    // Forcer l'import
    const enrichmentResult = await judilibreService.enrichDecisionData(decisionNumber, jurisdiction);
    
    if (!enrichmentResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Impossible d\'importer cette décision',
        details: enrichmentResult.error
      });
    }

    // Sauvegarder
    const enrichedData = enrichmentResult.enrichedData;
    const decision = new Decision({
      decisionNumber: enrichedData.decisionNumber,
      jurisdiction: enrichedData.jurisdiction,
      chamber: enrichedData.chamber,
      date: new Date(enrichedData.date),
      solution: enrichedData.solution,
      ecli: enrichedData.ecli,
      judilibreId: enrichedData.judilibreId,
      summary: enrichedData.summary,
      fullText: enrichedData.fullText,
      publication: enrichedData.publication,
      themes: enrichedData.themes,
      source: 'judilibre',
      rawJudilibreData: enrichedData.judilibreData,
      createdBy: req.user.id
    });

    await decision.save();

    res.json({
      success: true,
      decision,
      message: 'Décision importée avec succès'
    });

  } catch (error) {
    console.error('Erreur forceImportDecision:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'import forcé'
    });
  }
};

/**
 * Statistiques des décisions
 */
const getDecisionStats = async (req, res) => {
  try {
    const total = await Decision.countDocuments();
    const byJurisdiction = await Decision.aggregate([
      { $group: { _id: '$jurisdiction', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const withFullText = await Decision.countDocuments({ 
      fullText: { $exists: true, $ne: null, $ne: '' } 
    });

    const recentImports = await Decision.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      stats: {
        total,
        withFullText,
        completionRate: total > 0 ? Math.round((withFullText / total) * 100) : 0,
        recentImports,
        byJurisdiction
      }
    });

  } catch (error) {
    console.error('Erreur getDecisionStats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des statistiques'
    });
  }
};

module.exports = {
  getDecisionByNumber,
  getDecisions,
  searchDecisions,
  forceImportDecision,
  getDecisionStats
};