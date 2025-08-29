# 🔒 Guide de Sécurité - JuriNapse

## Fichiers sensibles supprimés/sécurisés

Les fichiers suivants ont été nettoyés pour votre sécurité :

### ✅ Fichiers corrigés :
- `setup-env-variables.bat` → Transformé en template générique
- `.env.encrypted` → **SUPPRIMÉ** (contenait des mots de passe chiffrés)
- `.gitignore` → Mis à jour avec plus de patterns de sécurité

### 📁 Templates créés :
- `.env.template` → Modèle pour vos variables d'environnement

## 🔐 Bonnes pratiques de sécurité

### 1. Variables d'environnement
- ❌ **NE JAMAIS** commiter de fichiers `.env` avec de vraies valeurs
- ✅ Utiliser `.env.template` pour la documentation
- ✅ Définir les variables sur les plateformes de déploiement (Railway, Vercel)

### 2. Mots de passe et tokens
- ❌ **NE JAMAIS** hardcoder de mots de passe dans le code
- ✅ Utiliser des variables d'environnement
- ✅ Utiliser des services de gestion des secrets (HashiCorp Vault, AWS Secrets Manager)

### 3. Configuration pour le déploiement

#### Railway :
```bash
# Définir les variables via l'interface web ou CLI
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set JWT_SECRET="your-secret-key"
```

#### Vercel :
```bash
# Définir les variables via l'interface web ou CLI
vercel env add MONGODB_URI
vercel env add JWT_SECRET
```

### 4. Fichiers à ne jamais commiter
- `.env` (tous les variants)
- `auth-token.txt`
- `*.key`, `*.pem`, `*.p12`
- Fichiers de backup avec données sensibles
- Configuration avec secrets hardcodés

## 🛡️ Vérification de sécurité

Avant chaque commit, vérifiez :
1. Aucun fichier `.env` n'est stagé
2. Aucun mot de passe en dur dans le code
3. Les tokens d'API ne sont pas exposés
4. Les URLs de database ne contiennent pas de credentials

## 🚨 En cas d'exposition accidentelle

Si vous avez accidentellement committé des secrets :
1. **Changez immédiatement** tous les mots de passe exposés
2. Supprimez l'historique Git si nécessaire : `git filter-branch`
3. Revoquez tous les tokens d'API exposés
4. Vérifiez les logs d'accès pour détecter une utilisation non autorisée

---

✅ **Votre projet est maintenant sécurisé !**
