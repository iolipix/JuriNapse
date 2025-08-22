export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  bio?: string;
  university?: string;
  graduationYear?: number;
  isStudent: boolean;
  joinedAt: Date;
}

export interface Like {
  id: string;
  userId: string;
  createdAt: Date;
}

export interface Save {
  id: string;
  userId: string;
  savedAt: Date;
}

export interface Share {
  userId: string;
  sharedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  likedBy: string[];
  likesWithTimestamp?: Like[]; // Nouveau: likes avec timestamps
}

export interface Post {
  id: string;
  _id?: string; // ID MongoDB explicite
  authorId: string;
  author: User;
  type: 'fiche-arret' | 'conseil' | 'question' | 'discussion' | 'cours' | 'protocole';
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastUserEdit?: Date; // Date de la dernière modification utilisateur
  likes: number;
  likedBy: string[];
  likesWithTimestamp?: Like[]; // Likes avec timestamps
  savesCount: number; // Nombre de sauvegardes
  savesWithTimestamp?: Save[]; // Sauvegardes avec timestamps
  comments: Comment[];
  slug?: string; // Slug pour URLs sécurisées
  pdfFile?: {
    name: string;
    url?: string; // Made optional to avoid storing large base64 data
    size: number;
  };
  isPrivate?: boolean;
  decisionNumber?: string;
  folderId?: string; // Nouveau champ pour associer un post à un dossier
}

export interface Folder {
  id?: string;
  _id?: string; // MongoDB ID
  name: string;
  description?: string;
  ownerId?: string; // Pour compatibilité frontend
  owner?: {
    _id: string;
    username: string;
    avatar?: string;
  } | string; // MongoDB retourne un objet ou un string
  parentId?: string; // Pour les sous-dossiers
  posts?: string[]; // Optionnel
  createdAt?: Date;
  updatedAt?: Date;
  color?: string; // Couleur du dossier
  isPublic?: boolean; // Changed from isPrivate to isPublic
  postsCount?: number; // Added postsCount
  subFoldersCount?: number; // Added subFoldersCount
}

export type PostType = 'fiche-arret' | 'conseil' | 'question' | 'discussion' | 'cours' | 'protocole';

export interface Subscription {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isBlocked?: boolean;
  isConnection?: boolean; // Abonnement mutuel
}

export interface Group {
  id: string;
  name: string;
  description: string;
  adminId: string;
  moderatorIds: string[];
  members: User[];
  createdAt: Date;
  notificationsEnabled?: { [userId: string]: boolean };
  isPrivate?: boolean;
  hiddenFor?: string[];
  hiddenForWithTimestamp?: Array<{
    userId: string;
    hiddenAt: string | Date;
  }>;
  historyDeletedFor?: Array<{
    userId: string;
    deletedAt: string | Date;
  }>;
  profilePicture?: string;
}

export interface Message {
  id: string;
  groupId: string;
  authorId?: string; // Optionnel pour les messages système
  author?: User; // Optionnel pour les messages système
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  deletionReason?: string;
  isSystemMessage?: boolean;
  reactions?: {
    [emoji: string]: {
      users: string[]; // IDs des utilisateurs qui ont réagi
      count: number;
    };
  };
  replyTo?: {
    id: string;
    content: string;
  // author peut être absent si le backend n'a pas peuplé
  author?: User;
  createdAt: Date;
  };
  sharedPost?: {
    id: string;
    title: string;
    content: string;
    author: User;
  };
  sharedFolder?: {
    id: string;
    name: string;
    description: string;
    itemsCount: number;
    author: User;
    color: string;
  };
  sharedPdf?: {
    id: string;
    name: string;
    url?: string;
    size: number;
    author: User;
  };
}