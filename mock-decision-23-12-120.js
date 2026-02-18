/**
 * Solution temporaire : Ajout manuel de la décision 23-12.120
 * pour tester le système en attendant de résoudre l'API Judilibre
 */

const addMockDecision = {
  decisionNumber: "23-12.120",
  jurisdiction: "Cour de cassation",
  judilibreId: "mock-23-12-120",
  ecli: "ECLI:FR:CCASS:2024:SO23120", // ECLI fictif mais réaliste
  date: new Date("2024-10-10"),
  chamber: "Deuxième chambre civile",
  solution: "Cassation",
  summary: "RESPONSABILITE DELICTUELLE OU QUASI DELICTUELLE - Dommage - Accident de la circulation - Accident impliquant un véhicule auto-école - Indemnisation - Tiers payeur - Recours - Elève conducteur - Faute - Effet",
  fullText: `Il résulte des articles1382, devenu 1240, et 1251, devenu 1346, du code civil, et de l'article L. 211-1, dernier alinéa, du code des assurances que le fait qu'un élève conducteur soit légalement considéré comme un tiers, pour lui permettre d'être indemnisé intégralement de ses préjudices par l'assureur du véhicule auto-école, ne fait pas obstacle à ce que soit recherché, pour statuer sur le recours en contribution à la dette, s'il a commis une faute de conduite.

Dès lors, méconnaît ces dispositions la cour d'appel, qui, pour se prononcer sur le recours en contribution à la dette, exclut par principe la faute de l'élève conducteur et retient qu'en cas d'accident impliquant un véhicule auto-école, l'assureur d'un autre véhicule impliqué qui, ayant indemnisé la victime, entend être déchargé de tout ou partie de cette dette, ne peut exercer une action récursoire contre l'assureur de l'auto-école qu'à la condition de démontrer l'existence d'une faute commise par cette dernière ou bien par le moniteur qu'elle emploie`,
  publication: "PUBLIÉ AU BULLETIN",
  themes: ["RESPONSABILITE DELICTUELLE OU QUASI DELICTUELLE", "Accident de la circulation"],
  isPublic: true,
  source: "judilibre-mock",
  rawJudilibreData: {
    id: "mock-23-12-120",
    type: "arret",
    chamber: "Deuxième chambre civile",
    formation: "Formation de section"
  }
};

console.log('📄 Décision mock créée pour test:');
console.log('================================');
console.log('Numéro:', addMockDecision.decisionNumber);
console.log('Juridiction:', addMockDecision.jurisdiction);
console.log('Date:', addMockDecision.date.toISOString().split('T')[0]);
console.log('Chambre:', addMockDecision.chamber);
console.log('Solution:', addMockDecision.solution);
console.log('');
console.log('📝 Résumé:');
console.log(addMockDecision.summary);
console.log('');
console.log('💡 Cette décision peut être ajoutée manuellement en base pour tester le système.');
console.log('📋 Format JSON prêt pour insertion MongoDB:');
console.log('');
console.log(JSON.stringify(addMockDecision, null, 2));