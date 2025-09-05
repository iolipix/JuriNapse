# Script MongoDB pour nettoyer le champ 'roles'

# 1. Se connecter à MongoDB (remplacer avec votre URI de production)
# mongo "mongodb://votre-uri-de-production/jurinapse"

# 2. Nettoyer tous les champs 'roles' et s'assurer que Théophane a les bons rôles

# Supprimer le champ 'roles' de tous les utilisateurs
db.users.updateMany(
  { roles: { $exists: true } },
  { $unset: { roles: "" } }
)

# Mettre à jour Théophane spécifiquement pour avoir user;moderator;administrator
db.users.updateOne(
  { username: { $regex: /theophane/i } },
  { $set: { role: "user;moderator;administrator" } }
)

# Vérifier le résultat pour Théophane
db.users.find({ username: { $regex: /theophane/i } }, { username: 1, role: 1, roles: 1 })

# Compter combien d'utilisateurs ont encore le champ 'roles'
db.users.countDocuments({ roles: { $exists: true } })

# Voir quelques exemples d'utilisateurs après nettoyage
db.users.find({}, { username: 1, role: 1, roles: 1 }).limit(5)
