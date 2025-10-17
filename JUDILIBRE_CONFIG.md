# Configuration Judilibre API

## Variable d'environnement à ajouter sur Railway

Pour activer l'intégration Judilibre, ajoutez cette variable d'environnement dans votre dashboard Railway :

```
JUDILIBRE_API_KEY=796f47b5-b3ac-4cd4-89a3-9f1042e6b6a3
```

## Instructions Railway

1. **Ouvrez** votre dashboard Railway
2. **Sélectionnez** votre projet JuriNapse
3. **Allez** dans l'onglet "Variables"
4. **Cliquez** "Add Variable"
5. **Ajoutez** :
   - **Name** : `JUDILIBRE_API_KEY`
   - **Value** : `796f47b5-b3ac-4cd4-89a3-9f1042e6b6a3`
6. **Sauvegardez** et **redéployez**

## Sécurité

✅ **Avantages** :
- Clé API sécurisée (pas dans le code source)
- Possibilité de changer la clé sans modifier le code
- Différentes clés pour différents environnements (dev/prod)

❌ **Sans cette variable** :
- Les fonctionnalités Judilibre ne fonctionneront pas
- Messages d'erreur : "Clé API Judilibre non configurée"

## Test

Une fois configurée, testez en créant une fiche d'arrêt avec :
- **Juridiction** : Cour de cassation
- **Numéro** : 19-60.222
- **Bouton** : "Auto-remplir"