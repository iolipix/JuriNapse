# Configuration Admin Par Défaut - JuriNapse

## Variables d'environnement à ajouter sur Railway

Pour que Théophane ait automatiquement le rôle administrateur au démarrage, ajoute cette variable d'environnement dans Railway :

```
DEFAULT_ADMIN_USER_ID=68b25c61a29835348429424a
```

## Comment ajouter la variable sur Railway

1. Va sur [railway.app](https://railway.app)
2. Ouvre ton projet JuriNapse
3. Clique sur l'onglet **"Variables"**
4. Clique sur **"New Variable"**
5. Ajoute :
   - **Name** : `DEFAULT_ADMIN_USER_ID`
   - **Value** : `68b25c61a29835348429424a`
6. Clique sur **"Add"**
7. **Redéploie l'application**

## Comment ça fonctionne

- Au démarrage du serveur, le système vérifie si la variable `DEFAULT_ADMIN_USER_ID` est définie
- Si oui, il trouve l'utilisateur avec cet ID dans la base de données
- Si l'utilisateur n'a pas encore le rôle `administrator`, il le lui attribue automatiquement
- Aucune route accessible depuis l'extérieur, tout se passe côté serveur au démarrage

## Sécurité

- L'ID utilisateur n'est jamais exposé dans le code source
- Seul celui qui a accès aux variables d'environnement Railway peut voir/modifier cet ID
- La logique ne s'exécute qu'au démarrage du serveur
- Aucune API accessible de l'extérieur pour cette fonctionnalité

Une fois que c'est configuré et redéployé, Théophane (theophane_mry) aura automatiquement le rôle administrateur ! 🎉
