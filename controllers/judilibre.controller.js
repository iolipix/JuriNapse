const judilibreService = require('../services/judilibre.service');
const Post = require('../models/post.model');
const fs = require('fs').promises;
const path = require('path');

/**
 * Enrichir automatiquement une fiche d'arrêt avec l'API Judilibre
 */
const enrichDecisionFromJudilibre = async (req, res) => {
  try {
    const { decisionNumber, jurisdiction } = req.body;

    if (!decisionNumber) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de décision requis'
      });
    }

    console.log(`Enrichissement décision: ${decisionNumber} - ${jurisdiction}`);

    // 1. Rechercher et enrichir via Judilibre
    const enrichmentResult = await judilibreService.enrichDecisionData(decisionNumber, jurisdiction);

    if (!enrichmentResult.success) {
      return res.status(404).json({
        success: false,
        error: enrichmentResult.error
      });
    }

    const enrichedData = enrichmentResult.enrichedData;

    // 2. Sauvegarder le texte complet si disponible
    let savedFileName = null;
    if (enrichedData.fullText) {
      try {
        // Créer le nom de fichier avec le numéro de décision
        const fileName = `${decisionNumber.replace(/[^a-zA-Z0-9.-]/g, '_')}.txt`;
        const uploadsDir = path.join(__dirname, '../uploads/decisions');
        
        // Créer le dossier s'il n'existe pas
        await fs.mkdir(uploadsDir, { recursive: true });
        
        const filePath = path.join(uploadsDir, fileName);
        
        // Sauvegarder le texte
        await fs.writeFile(filePath, enrichedData.fullText, 'utf8');
        
        savedFileName = fileName;
        console.log(`Décision sauvegardée: ${fileName}`);
      } catch (fileError) {
        console.error('Erreur sauvegarde fichier:', fileError);
        // Continuer sans fichier si erreur
      }
    }

    // 3. Retourner les données enrichies pour le frontend
    const responseData = {
      success: true,
      enrichedData: {
        // Données pour pré-remplir le formulaire
        title: `Décision ${enrichedData.decisionNumber}`,
        content: enrichedData.summary || '',
        decisionNumber: enrichedData.decisionNumber,
        jurisdiction: enrichedData.jurisdiction,
        chamber: enrichedData.chamber,
        date: enrichedData.date,
        solution: enrichedData.solution,
        
        // Métadonnées supplémentaires
        ecli: enrichedData.ecli,
        publication: enrichedData.publication,
        themes: enrichedData.themes,
        
        // Fichier sauvegardé
        savedFile: savedFileName,
        hasFullText: !!enrichedData.fullText
      },
      sourceInfo: {
        judilibreId: enrichedData.judilibreId,
        searchScore: enrichmentResult.sourceDecision.score
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('Erreur enrichissement décision:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'enrichissement'
    });
  }
};

/**
 * Rechercher des suggestions de décisions par numéro partiel
 */
const suggestDecisions = async (req, res) => {
  try {
    const { query, jurisdiction } = req.query;

    if (!query || query.length < 3) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    // Recherche avec query partielle
    const searchResult = await judilibreService.searchDecisionByNumber(
      query, 
      judilibreService.mapJurisdiction(jurisdiction)
    );

    if (!searchResult.success) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    // Formater les suggestions
    const suggestions = searchResult.decisions
      .slice(0, 5) // Limiter à 5 suggestions
      .map(decision => ({
        number: decision.number,
        date: decision.decision_date,
        chamber: judilibreService.formatChamber(decision.chamber),
        summary: decision.summary ? decision.summary.substring(0, 100) + '...' : '',
        score: decision.score
      }));

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Erreur suggestions décisions:', error);
    res.json({
      success: true,
      suggestions: []
    });
  }
};

/**
 * Télécharger le fichier d'une décision sauvegardée
 */
const downloadDecisionFile = async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({ error: 'Nom de fichier requis' });
    }

    const filePath = path.join(__dirname, '../uploads/decisions', fileName);
    
    try {
      await fs.access(filePath);
      res.download(filePath, fileName);
    } catch (error) {
      res.status(404).json({ error: 'Fichier non trouvé' });
    }

  } catch (error) {
    console.error('Erreur téléchargement fichier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  enrichDecisionFromJudilibre,
  suggestDecisions,
  downloadDecisionFile
};