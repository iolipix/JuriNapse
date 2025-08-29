# Modification : Tiret comme Caractère Spécial

## Résumé
Le tiret (-) est maintenant accepté comme caractère spécial valide lors de la validation des mots de passe à l'inscription et lors du changement de mot de passe.

## Fichiers modifiés

### Frontend

1. **frontend/src/components/Auth/AuthForm.tsx** (ligne 57)
   - Ancienne regex : `/[!@#$%^&*(),.?":{}|<>]/`
   - Nouvelle regex : `/[!@#$%^&*(),.?":{}|<>\-]/`

2. **frontend/src/components/Settings/SettingsPage.tsx** (ligne 151)
   - Ancienne regex : `/[!@#$%^&*(),.?":{}|<>]/`
   - Nouvelle regex : `/[!@#$%^&*(),.?":{}|<>\-]/`

### Backend

3. **backend/controllers/auth.controller.js** (lignes 71 et 598)
   - Ancienne regex : `/[!@#$%^&*(),.?":{}|<>]/`
   - Nouvelle regex : `/[!@#$%^&*(),.?":{}|<>\-]/`
   - Message d'erreur mis à jour pour inclure le tiret

## Impact
- Les utilisateurs peuvent maintenant utiliser le tiret (-) dans leurs mots de passe pour satisfaire l'exigence de caractère spécial
- La validation est cohérente entre le frontend et le backend
- Le message d'erreur côté backend a été mis à jour pour refléter cette modification

## Test
✅ Compilation réussie du frontend après les modifications
✅ Aucune erreur TypeScript détectée
