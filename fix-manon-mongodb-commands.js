# Commandes MongoDB pour corriger Manon et autres utilisateurs

# 1. Vérifier l'état actuel de Manon
db.users.find({ username: { $regex: /manon/i } }, { username: 1, role: 1 })

# 2. Chercher tous les utilisateurs qui ont des rôles sans "user" au début
db.users.find({
  $and: [
    { role: { $exists: true } },
    { role: { $ne: "user" } },
    { role: { $not: { $regex: "^user" } } }
  ]
}, { username: 1, role: 1 })

# 3. Corriger Manon spécifiquement (si elle a juste "moderator")
db.users.updateOne(
  { username: { $regex: /manon/i }, role: "moderator" },
  { $set: { role: "user;moderator" } }
)

# 4. Corriger tous les utilisateurs qui ont "moderator" sans "user"
db.users.updateMany(
  { role: "moderator" },
  { $set: { role: "user;moderator" } }
)

# 5. Corriger tous les utilisateurs qui ont "administrator" sans "user"
db.users.updateMany(
  { role: "administrator" },
  { $set: { role: "user;administrator" } }
)

# 6. Corriger tous les utilisateurs qui ont "premium" sans "user"
db.users.updateMany(
  { role: "premium" },
  { $set: { role: "user;premium" } }
)

# 7. Vérification finale - voir quelques utilisateurs
db.users.find({}, { username: 1, role: 1 }).limit(10)

# 8. Compter les utilisateurs par type de rôle
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
