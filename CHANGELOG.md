## 2025-08-30

### Modifications Frontend
- Limitation des tags populaires affichés à 5 avec indicateur "+X autres" dans `src/components/Feed/FeedPage.tsx` et `frontend/src/components/Feed/FeedPage.tsx`.
- Limitation des tags par post à 3 (au lieu de 5) avec badge de surplus dans `src/components/Post/PostCard.tsx` et `frontend/src/components/Post/PostCard.tsx`.
- Ajout d'indicateurs de déploiement (commentaires v4.0) pour validation production.

### Build & Déploiement
- Ajout d'une config `build` avec fichiers hashés dans `frontend/vite.config.ts` pour bust cache (aligné sur config root).
- Ajout script `start` dans `frontend/package.json` (utilisé par Nixpacks/Vercel preview).
- Réécriture de `frontend/nixpacks.toml` pour phases explicites (setup/install/build/start) et `NODE_ENV=production`.
- Ajout d'un fichier `public/deployment-test.js` (marqueur visuel de déploiement).

### Divers
- Mise à jour de la logique d'affichage des tags pour correspondre à la demande finale: 5 tags populaires (barre supérieure), 3 tags maximum par publication.

