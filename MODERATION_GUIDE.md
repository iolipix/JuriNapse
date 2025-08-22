# Système de Modération - Guide d'utilisation

## Vue d'ensemble

Le système de modération permet une gestion complète des groupes avec différents niveaux de permissions :

- **Administrateur** (👑) : Créateur du groupe, permissions complètes
- **Modérateur** (🛡️) : Nommé par l'admin, permissions limitées  
- **Membre** : Utilisateur standard du groupe

## Fonctionnalités

### 1. Gestion des rôles (Admin uniquement)
- Promouvoir un membre au rang de modérateur
- Rétrograder un modérateur au rang de membre
- Visualiser tous les rôles dans le panneau de modération

### 2. Exclusion de membres
- **Admin** : Peut exclure n'importe qui (sauf lui-même)
- **Modérateur** : Peut exclure les membres normaux uniquement
- Hiérarchie respectée : modérateurs ne peuvent pas exclure admin/autres modérateurs

### 3. Suppression de messages
- **Auteur** : Peut supprimer ses propres messages
- **Admin/Modérateur** : Peut supprimer n'importe quel message
- Synchronisation temps réel via Socket.io

### 4. Gestion du groupe (Admin/Modérateurs)
- Changer la photo de profil du groupe
- Voir les statistiques du groupe
- Accès aux paramètres avancés

## Composants UI

### GroupModerationPanel
Panneau complet de gestion du groupe avec onglets :
- **Membres** : Liste avec actions (promouvoir, rétrograder, exclure)
- **Paramètres** : Photo de profil, informations du groupe

```tsx
import { GroupModerationPanel } from '../components/Messaging';

<GroupModerationPanel 
  group={selectedGroup} 
  onClose={() => setShowPanel(false)} 
/>
```

### GroupModerationButton
Bouton d'accès rapide au panneau de modération :
- Visible uniquement pour admin/modérateurs
- Icône différente selon le rôle (👑 pour admin, 🛡️ pour modérateur)

```tsx
import { GroupModerationButton } from '../components/Messaging';

<GroupModerationButton group={group} />
```

### MessageModerationMenu
Menu contextuel pour les actions sur les messages :
- Option de suppression selon les permissions
- Informations sur l'auteur et la date
- Indicateur des permissions actuelles

```tsx
import { MessageModerationMenu } from '../components/Messaging';

<MessageModerationMenu
  message={message}
  groupId={groupId}
  onClose={() => setShowMenu(false)}
/>
```

### UserRoleBadge
Badge visuel pour indiquer le rôle d'un utilisateur :
- 👑 Admin (rouge)
- 🛡️ Mod (orange)
- Rien pour les membres normaux

```tsx
import { UserRoleBadge } from '../components/Messaging';

<UserRoleBadge user={user} group={group} size="sm" />
```

## API Backend

### Endpoints de modération

#### Promotion/Rétrogradation (Admin uniquement)
```
POST /api/groups/:groupId/promote-moderator
POST /api/groups/:groupId/demote-moderator
Body: { userId: string }
```

#### Exclusion de membres
```
POST /api/groups/:groupId/kick-member
Body: { userId: string }
```

#### Gestion photo de profil
```
PUT /api/groups/:groupId/profile-picture
Body: { profilePicture: string } // Base64 ou URL
```

#### Suppression de messages (étendue)
```
DELETE /api/messages/:messageId
```

## Permissions et hiérarchie

### Matrice des permissions

| Action | Admin | Modérateur | Membre |
|--------|-------|------------|--------|
| Promouvoir modérateur | ✅ | ❌ | ❌ |
| Rétrograder modérateur | ✅ | ❌ | ❌ |
| Exclure membre | ✅ | ✅ | ❌ |
| Exclure modérateur | ✅ | ❌ | ❌ |
| Exclure admin | ❌ | ❌ | ❌ |
| Supprimer message (tout) | ✅ | ✅ | ❌ |
| Supprimer message (sien) | ✅ | ✅ | ✅ |
| Changer photo groupe | ✅ | ✅ | ❌ |

## Utilisation pratique

### 1. Intégration dans un composant existant

```tsx
import { useMessaging } from '../../contexts/MessagingContext_new';
import { GroupModerationButton, UserRoleBadge } from '../components/Messaging';

const MyGroupComponent = () => {
  const { isGroupAdmin, isGroupModerator } = useMessaging();
  
  // Vérifier les permissions
  const canModerate = isGroupAdmin(groupId) || isGroupModerator(groupId);
  
  return (
    <div>
      {/* Afficher le rôle de l'utilisateur */}
      <UserRoleBadge user={user} group={group} />
      
      {/* Bouton de modération si permissions */}
      {canModerate && <GroupModerationButton group={group} />}
    </div>
  );
};
```

### 2. Gestion des erreurs

Le système gère automatiquement :
- Validation des permissions côté backend
- Messages d'erreur explicites
- Rechargement des données après actions
- Gestion des états de chargement

### 3. Temps réel

Toutes les actions sont synchronisées en temps réel :
- Socket.io pour les suppressions de messages
- Rechargement automatique des groupes après modifications
- Mise à jour immédiate des permissions

## Sécurité

- Validation côté backend pour toutes les actions
- Vérification des permissions à chaque requête
- Hiérarchie stricte respectée
- Protection contre les actions non autorisées

## Exemple complet

Voir `MessagingWithModeration.tsx` pour un exemple d'implémentation complète intégrant tous les composants de modération dans une interface de messagerie fonctionnelle.
