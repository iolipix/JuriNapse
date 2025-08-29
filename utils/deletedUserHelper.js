/**
 * Utilitaire pour gérer l'affichage des utilisateurs supprimés
 */

const DELETED_USER_INFO = {
  username: 'Utilisateur introuvable',
  firstName: '',
  lastName: '',
  profilePicture: null,
  university: '',
  bio: '',
  isStudent: false,
  location: '',
  website: '',
  isVerified: false,
  isActive: false
};

/**
 * Remplace les informations d'un utilisateur supprimé
 * @param {Object} user - L'objet utilisateur
 * @returns {Object} - L'objet utilisateur avec les informations modifiées
 */
function replaceDeletedUserInfo(user) {
  if (!user) return null;
  
  // Si l'utilisateur est supprimé, remplacer les informations sensibles
  if (user.isDeleted) {
    return {
      ...user,
      ...DELETED_USER_INFO,
      id: user.id || user._id, // Conserver l'ID pour les références
      _id: user._id || user.id
    };
  }
  
  return user;
}

/**
 * Traite un tableau d'utilisateurs en remplaçant les informations des utilisateurs supprimés
 * @param {Array} users - Tableau d'utilisateurs
 * @returns {Array} - Tableau d'utilisateurs traités
 */
function processUsersArray(users) {
  if (!Array.isArray(users)) return users;
  
  return users.map(user => replaceDeletedUserInfo(user));
}

/**
 * Traite les messages en remplaçant les informations des auteurs supprimés
 * @param {Array} messages - Tableau de messages
 * @returns {Array} - Tableau de messages traités
 */
function processMessages(messages) {
  if (!Array.isArray(messages)) return messages;
  
  return messages.map(message => {
    const processedMessage = { ...message };
    
    // Traiter l'auteur du message
    if (processedMessage.author) {
      processedMessage.author = replaceDeletedUserInfo(processedMessage.author);
    }
    if (processedMessage.authorId && typeof processedMessage.authorId === 'object') {
      processedMessage.authorId = replaceDeletedUserInfo(processedMessage.authorId);
    }
    
    // Traiter l'auteur du message de réponse
    if (processedMessage.replyTo && processedMessage.replyTo.author) {
      processedMessage.replyTo.author = replaceDeletedUserInfo(processedMessage.replyTo.author);
    }
    if (processedMessage.replyTo && processedMessage.replyTo.authorId) {
      processedMessage.replyTo.authorId = replaceDeletedUserInfo(processedMessage.replyTo.authorId);
    }
    
    // Traiter les contenus partagés
    if (processedMessage.sharedPost && processedMessage.sharedPost.author) {
      processedMessage.sharedPost.author = replaceDeletedUserInfo(processedMessage.sharedPost.author);
    }
    if (processedMessage.sharedFolder && processedMessage.sharedFolder.author) {
      processedMessage.sharedFolder.author = replaceDeletedUserInfo(processedMessage.sharedFolder.author);
    }
    if (processedMessage.sharedPdf && processedMessage.sharedPdf.author) {
      processedMessage.sharedPdf.author = replaceDeletedUserInfo(processedMessage.sharedPdf.author);
    }
    
    return processedMessage;
  });
}

/**
 * Traite les posts en remplaçant les informations des auteurs supprimés
 * @param {Array} posts - Tableau de posts
 * @returns {Array} - Tableau de posts traités
 */
function processPosts(posts) {
  if (!Array.isArray(posts)) return posts;
  
  return posts.map(post => {
    const processedPost = { ...post };
    
    // Traiter l'auteur du post
    if (processedPost.author) {
      processedPost.author = replaceDeletedUserInfo(processedPost.author);
    }
    if (processedPost.authorId && typeof processedPost.authorId === 'object') {
      processedPost.authorId = replaceDeletedUserInfo(processedPost.authorId);
    }
    
    return processedPost;
  });
}

/**
 * Traite les conversations en remplaçant les informations des participants supprimés
 * @param {Array} conversations - Tableau de conversations
 * @returns {Array} - Tableau de conversations traités
 */
function processConversations(conversations) {
  if (!Array.isArray(conversations)) return conversations;
  
  return conversations.map(conversation => {
    const processedConversation = { ...conversation };
    
    // Traiter les membres
    if (processedConversation.members) {
      processedConversation.members = processUsersArray(processedConversation.members);
    }
    
    // Traiter l'admin
    if (processedConversation.adminId && typeof processedConversation.adminId === 'object') {
      processedConversation.adminId = replaceDeletedUserInfo(processedConversation.adminId);
    }
    
    // Traiter les modérateurs
    if (processedConversation.moderatorIds) {
      processedConversation.moderatorIds = processUsersArray(processedConversation.moderatorIds);
    }
    
    // Traiter le dernier message
    if (processedConversation.lastMessage) {
      processedConversation.lastMessage = processMessages([processedConversation.lastMessage])[0];
    }
    
    return processedConversation;
  });
}

/**
 * Vérifie si un utilisateur doit être considéré comme "introuvable"
 * @param {Object} user - L'objet utilisateur
 * @returns {boolean} - true si l'utilisateur est introuvable
 */
function isUserNotFound(user) {
  return !user || user.isDeleted === true;
}

module.exports = {
  replaceDeletedUserInfo,
  processUsersArray,
  processMessages,
  processPosts,
  processConversations,
  isUserNotFound,
  DELETED_USER_INFO
};
