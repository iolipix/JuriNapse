# 🏛️ Système d'Import Automatique Judilibre

## 📋 Vue d'ensemble

Le système JuriNapse importe automatiquement les décisions de justice depuis l'API Judilibre **uniquement à la demande**, quand une fiche d'arrêt référence un numéro de décision.

## 🎯 Logique d'Import À La Demande

### ✅ Quand l'import est déclenché
```
Utilisateur crée une fiche d'arrêt
    ↓
Saisit un decisionNumber + jurisdiction
    ↓
Backend vérifie si décision existe en BDD MongoDB
    ↓
Si NON → Import automatique Judilibre → Sauvegarde
Si OUI → Utilise décision existante
    ↓
Fiche d'arrêt créée et liée à la décision
```

### 🗄️ Structure MongoDB

**Collection `decisions` :**
```javascript
{
  _id: ObjectId,
  decisionNumber: "12-34.567",     // Unique + Index
  jurisdiction: "Cour de cassation",
  chamber: "Chambre civile 1",
  date: ISODate("2023-05-15"),
  solution: "Cassation",
  ecli: "ECLI:FR:CCASS:2023:...",
  judilibreId: "judilibre_123456",
  summary: "Résumé de la décision...",
  fullText: "Texte intégral...",
  publication: "B",
  themes: ["Contrat", "Responsabilité"],
  source: "judilibre",
  isPublic: true,
  rawJudilibreData: { /* données brutes API */ },
  createdAt: ISODate,
  updatedAt: ISODate,
  createdBy: ObjectId("user_id")
}
```

## 🔄 Flux de Données

### 1. Création de Fiche d'Arrêt
**File:** `backend/controllers/post.controller.js`
```javascript
// Auto-import après création du post
if (type === 'fiche-arret' && decisionNumber) {
  // Vérifier existence
  let existingDecision = await Decision.findOne({ 
    decisionNumber: decisionNumber.trim(),
    jurisdiction 
  });

  if (!existingDecision) {
    // Import Judilibre
    const result = await judilibreService.enrichDecisionData(decisionNumber, jurisdiction);
    // Sauvegarder en BDD
  }
}
```

### 2. Service Judilibre
**File:** `backend/services/judilibre.service.js`
```javascript
const enrichDecisionData = async (decisionNumber, jurisdiction) => {
  // Appel API Judilibre
  const response = await judilibreClient.get('/export', {
    params: {
      query: decisionNumber.trim(),
      type: 'arret',
      jurisdiction: mapJurisdictionToCode(jurisdiction)
    }
  });
  
  // Normaliser et retourner les données
};
```

### 3. Affichage Décision
**Route:** `/api/decisions/:decisionNumber`
**Controller:** `backend/controllers/decision.controller.js`

## 🚀 API Endpoints

### GET `/api/decisions/:decisionNumber`
Récupère une décision (avec auto-import si nécessaire)
```javascript
// Query params
?jurisdiction=Cour de cassation

// Response
{
  success: true,
  decision: { /* objet décision */ },
  source: "database|judilibre_auto_import"
}
```

### GET `/api/decisions/list`
Liste paginée des décisions
```javascript
// Query params
?page=1&limit=20&jurisdiction=...&search=...

// Response
{
  success: true,
  decisions: [...],
  pagination: { page, totalPages, total }
}
```

### GET `/api/decisions/stats`
Statistiques des décisions
```javascript
// Response
{
  success: true,
  stats: {
    total: 1250,
    withFullText: 980,
    completionRate: 78,
    recentImports: 45,
    byJurisdiction: [...]
  }
}
```

## 🔧 Configuration Routes

**File:** `backend/server.js`
```javascript
const decisionRoutes = require('./routes/decision.routes');
app.use('/api/decisions', decisionRoutes);
```

**File:** `backend/routes/decision.routes.js`
```javascript
router.get('/:decisionNumber', optionalAuth, getDecisionByNumber);
router.get('/list', getDecisions);
router.get('/stats', getDecisionStats);
router.post('/import', authenticateToken, forceImportDecision);
```

## 💾 Avantages du Système

### ✅ Économie de Ressources
- Pas d'import massif inutile
- API Judilibre utilisée seulement si nécessaire
- Cache persistant des décisions utiles

### ✅ Performance
- Décisions stockées localement après premier import
- Pas de re-import si décision existe déjà
- Réponse instantanée pour décisions déjà en cache

### ✅ Fiabilité
- Décisions conservées même si fiche supprimée
- Évite les re-imports futurs
- Données enrichies et normalisées

## 🔍 Utilisation Frontend

### Recherche de Décisions
```typescript
// Dans une fiche d'arrêt
const searchDecisions = async (query: string) => {
  const response = await api.get('/decisions/search', {
    params: { query, jurisdiction }
  });
  return response.data.decisions;
};
```

### Affichage Décision Complète
```typescript
// Page décision dédiée
const DecisionPage = () => {
  const { decisionNumber } = useParams();
  
  useEffect(() => {
    api.get(`/decisions/${decisionNumber}`)
      .then(response => setDecision(response.data.decision));
  }, [decisionNumber]);
};
```

## 📊 Monitoring

### Logs d'Import
```
🔍 [AUTO-IMPORT] Fiche d'arrêt créée avec décision 12-34.567
📥 [AUTO-IMPORT] Décision 12-34.567 non trouvée, import depuis Judilibre...
✅ [AUTO-IMPORT] Décision 12-34.567 importée avec succès (ID: 674a...)
ℹ️ [AUTO-IMPORT] Décision 12-34.567 existe déjà (ID: 674a...)
```

### Métriques Utiles
- Nombre total de décisions en BDD
- Taux d'import automatique réussi
- Décisions les plus référencées
- Performance API Judilibre

## 🛠️ Maintenance

### Nettoyage Périodique
- Les décisions ne sont JAMAIS supprimées automatiquement
- Possibilité de nettoyage manuel via admin si nécessaire
- Archivage des très anciennes décisions non utilisées

### Mise à Jour Données
- Possibilité de re-synchroniser une décision depuis Judilibre
- Mise à jour automatique des métadonnées si changement détecté

---

**Date de création** : 25 octobre 2025  
**Système** : Import automatique à la demande  
**Status** : ✅ Implémenté et opérationnel