// Commande MongoDB à exécuter directement dans MongoDB Compass ou mongosh

db.users.updateOne(
  { username: "theophane_mry" },
  {
    $set: {
      role: "administrator",
      roles: ["user", "administrator"]
    }
  }
)

// Vérifier le résultat
db.users.findOne(
  { username: "theophane_mry" },
  { username: 1, role: 1, roles: 1 }
)

// Alternative: Si vous voulez juste ajouter "administrator" à l'array existant
db.users.updateOne(
  { username: "theophane_mry" },
  {
    $addToSet: {
      roles: "administrator"
    }
  }
)
