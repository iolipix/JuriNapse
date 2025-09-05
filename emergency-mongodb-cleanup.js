# NETTOYAGE COMPLET - Commandes MongoDB directes

# 1. Vérifier l'état actuel
echo "=== ÉTAT ACTUEL ==="
db.users.find({ username: { $regex: /theophane/i } }, { username: 1, role: 1, roles: 1 })
db.users.find({ username: { $regex: /manon/i } }, { username: 1, role: 1, roles: 1 })

# 2. Compter les utilisateurs avec l'ancien champ roles
db.users.countDocuments({ roles: { $exists: true } })

# 3. SUPPRIMER TOUS LES CHAMPS 'roles' (array)
db.users.updateMany(
  { roles: { $exists: true } },
  { $unset: { roles: "" } }
)

# 4. CORRIGER THÉOPHANE - user;moderator;administrator
db.users.updateOne(
  { username: { $regex: /theophane/i } },
  { $set: { role: "user;moderator;administrator" } }
)

# 5. CORRIGER MANON - user;moderator  
db.users.updateOne(
  { username: { $regex: /manon/i } },
  { $set: { role: "user;moderator" } }
)

# 6. CORRIGER TOUS LES RÔLES INCOMPLETS

# Corriger "administrator" → "user;administrator"
db.users.updateMany(
  { role: "administrator" },
  { $set: { role: "user;administrator" } }
)

# Corriger "moderator" → "user;moderator"
db.users.updateMany(
  { role: "moderator" },
  { $set: { role: "user;moderator" } }
)

# Corriger "premium" → "user;premium"
db.users.updateMany(
  { role: "premium" },
  { $set: { role: "user;premium" } }
)

# 7. VÉRIFICATION FINALE
echo "=== VÉRIFICATION FINALE ==="
db.users.find({ username: { $regex: /theophane/i } }, { username: 1, role: 1, roles: 1 })
db.users.find({ username: { $regex: /manon/i } }, { username: 1, role: 1, roles: 1 })

# Compter les champs roles restants (doit être 0)
db.users.countDocuments({ roles: { $exists: true } })

# Statistiques des rôles
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

# Voir quelques utilisateurs pour vérification
db.users.find({}, { username: 1, role: 1, roles: 1 }).limit(10)
