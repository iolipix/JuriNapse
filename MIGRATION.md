# 📋 INSTRUCTIONS DE MIGRATION LOCALSTORAGE → MONGODB

## 🎯 Objectif
Transférer toutes vos données (utilisateurs, groupes, messages, posts, dossiers, abonnements, etc.) du localStorage vers la base de données MongoDB.

## 📝 Étapes de migration

### 1. Préparation
- ✅ Serveur frontend : http://localhost:5173/ (démarré)
- ✅ Serveur backend : http://localhost:5000/ (démarré)
- ✅ MongoDB : Connecté à la base de données `jurinapse`

### 2. Exécution de la migration

1. **Ouvrez votre navigateur** et allez sur http://localhost:5173/
2. **Connectez-vous** à votre compte
3. **Ouvrez la console du navigateur** (F12 → Console)
4. **Copiez et collez** le contenu du fichier `migrate-client.js` dans la console
5. **Exécutez** la commande : `migrateToMongoDB()`

### 3. Que fait la migration ?

La migration va transférer :
- 👥 **Utilisateurs** → Collection `users`
- 💬 **Groupes** → Collection `groups`
- 📝 **Messages** → Collection `messages`
- 📄 **Posts** → Collection `posts`
- 📁 **Dossiers** → Collection `folders`
- 🔗 **Abonnements** → Champ `following` dans `users`
- 🚫 **Utilisateurs bloqués** → Champ `blockedUsers` dans `users`

### 4. Vérification

Après la migration, vous verrez dans la console :
```
✅ Migration réussie!
📈 Résultats: { users: X, groups: Y, messages: Z, posts: A, folders: B }
```

### 5. Nettoyage (optionnel)

Le script vous proposera de nettoyer le localStorage. **Attention** : ceci effacera toutes les données locales !

### 6. Mise à jour du code

Après la migration, vous devez mettre à jour vos contextes pour utiliser les APIs au lieu du localStorage :

#### Contextes à modifier :
- `AuthContext.tsx` → Utiliser `/api/auth/*`
- `MessagingContext.tsx` → Utiliser `/api/groups/*` et `/api/messages/*`
- `PostContext.tsx` → Utiliser `/api/posts/*`
- `FolderContext.tsx` → Utiliser `/api/folders/*`
- `SubscriptionContext.tsx` → Utiliser `/api/users/*`

## 🚨 Important

- **Sauvegardez** vos données avant de nettoyer le localStorage
- **Testez** que tout fonctionne correctement après la migration
- **Rechargez** la page après le nettoyage du localStorage

## 🔧 Dépannage

### Erreur "Aucun utilisateur trouvé"
- Vérifiez que vous êtes connecté
- Vérifiez que `jurinapse_user` existe dans le localStorage

### Erreur de connexion réseau
- Vérifiez que le serveur backend est démarré (port 5000)
- Vérifiez la connexion MongoDB

### Erreur "Failed to start server"
- Vérifiez le fichier `.env` dans le dossier `config/`
- Vérifiez les variables d'environnement MongoDB
