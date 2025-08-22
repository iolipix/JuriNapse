const Post = require('../models/post.model');
const User = require('../models/user.model');
const Folder = require('../models/folder.model');
const ProfilePicture = require('../models/profilePicture.model');
const NodeCache = require('node-cache');
const mongoose = require('mongoose');

// Fonction pour générer un slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Cache pour 5 minutes (300 secondes)
const cache = new NodeCache({ stdTTL: 300 });
const { createNotification } = require('./notification.controller');

// Helper function pour trouver un post par slug ou ID
const findPostBySlugOrId = async (slugOrId) => {
  // Si c'est un ObjectId valide, chercher par ID
  if (mongoose.Types.ObjectId.isValid(slugOrId) && slugOrId.length === 24) {
    return await Post.findById(slugOrId);
  }
  
  // Sinon, chercher par slug
  return await Post.findOne({ slug: slugOrId });
};

// Créer un nouveau post
const createPost = async (req, res) => {
  try {
    const { type, title, content, tags, isPrivate, decisionNumber, folderId, pdfFile } = req.body;

    // Validation des champs obligatoires
    if (!type || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Type, titre et contenu sont obligatoires'
      });
    }

    // Vérifier si le dossier existe et si l'utilisateur y a accès
    if (folderId) {
      const folder = await Folder.findById(folderId);
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Dossier non trouvé'
        });
      }
      
      if (!folder.canEdit(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé pour ajouter un post dans ce dossier'
        });
      }
    }

    // Créer le nouveau post SANS slug d'abord
    const newPost = new Post({
      authorId: req.user._id,
      type,
      title,
      content,
      tags: tags || [],
      isPrivate: isPrivate || false,
      decisionNumber: decisionNumber || null,
      folderId: folderId || null,
      pdfFile: pdfFile || null,
      lastUserEdit: new Date() // Marquer comme créé par l'utilisateur
    });

    await newPost.save();
    
    // Maintenant générer le slug avec l'ID du post créé
    const slug = generateSlug(title, newPost._id);
    newPost.slug = slug;
    await newPost.save();

    await newPost.save();

    // Mettre à jour le compteur de posts dans le dossier
    if (folderId) {
      await Folder.findByIdAndUpdate(folderId, { $inc: { postsCount: 1 } });
    }

    // Peupler avec les informations de l'auteur
    await newPost.populate('authorId', 'username firstName lastName university isStudent bio profilePicture');

    // Headers anti-cache pour forcer refresh après création
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Force-Refresh': 'true'
    });

    res.status(201).json({
      success: true,
      message: 'Post créé avec succès',
      post: newPost,
      forceRefresh: true,
      timestamp: Date.now(),
      action: 'CREATE_POST'
    });

  } catch (error) {
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du post'
    });
  }
};

// Récupérer tous les posts (avec pagination)
const getPosts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, // Limite par défaut à 12 posts
      type, 
      tags, 
      search, 
      authorId, 
      folderId,
      isPrivate 
    } = req.query;

    // 🚫 CACHE TEMPORAIREMENT DÉSACTIVÉ pour résoudre les problèmes de synchronisation
    // const cacheKey = `posts_${page}_${limit}_${type || 'all'}_${tags || 'all'}_${search || 'all'}_${authorId || 'all'}_${folderId || 'all'}_${isPrivate || 'all'}_${req.user ? req.user._id : 'anonymous'}`;
    
    // // Vérifier le cache
    // const cached = cache.get(cacheKey);
    // if (cached) {
    //   return res.json(cached);
    // }

    const query = {};

    // Filtres
    if (type) query.type = type;
    if (authorId) query.authorId = authorId;
    if (folderId) query.folderId = folderId;
    
    // Gestion de la confidentialité
    if (req.user) {
      // Utilisateur connecté : voir ses posts privés + posts publics des autres
      query.$or = [
        { isPrivate: false },
        { authorId: req.user._id }
      ];
    } else {
      // Utilisateur non connecté : seulement les posts publics
      query.isPrivate = false;
    }

    // Recherche textuelle
    if (search) {
      query.$text = { $search: search };
    }

    // Filtrage par tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const posts = await Post.find(query)
      .populate({
        path: 'authorId', 
        select: 'username firstName lastName university isStudent bio profilePicture isDeleted',
        match: { isDeleted: { $ne: true } }
      })
      .populate({
        path: 'comments.authorId', 
        select: 'username firstName lastName university isStudent bio profilePicture isDeleted',
        match: { isDeleted: { $ne: true } }
      })
      .select('-__v') // Exclure les champs inutiles
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Utiliser lean() pour de meilleures performances

    // Filtrer les posts avec des auteurs supprimés/introuvables
    const validPosts = posts.filter(post => {
      if (!post.authorId) {
        console.log(`🧹 Post orphelin détecté: ${post._id} - auteur manquant`);
        return false;
      }
      return true;
    });

    // Si des posts orphelins ont été trouvés, log pour diagnostic
    if (validPosts.length !== posts.length) {
      console.log(`🧹 ${posts.length - validPosts.length} posts orphelins filtrés`);
    }

    const total = await Post.countDocuments(query);

    const result = {
      success: true,
      posts: validPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: validPosts.length, // Utiliser le nombre réel de posts valides
        pages: Math.ceil(validPosts.length / limit)
      }
    };

    // 🚫 CACHE TEMPORAIREMENT DÉSACTIVÉ pour résoudre les problèmes de synchronisation
    // cache.set(cacheKey, result);

    // Ajouter headers pour éviter le cache navigateur ET proxy
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    });

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des posts'
    });
  }
};

// Récupérer un post par ID ou slug
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validation basique de l'input
    if (!id || id.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant invalide'
      });
    }
    
    // Déterminer si c'est un ObjectId MongoDB ou un slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const post = await Post.findOne(query)
      .populate('authorId', 'username firstName lastName university isStudent bio profilePicture')
      .populate('comments.authorId', 'username firstName lastName university isStudent bio profilePicture');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Vérifier les permissions pour les posts privés
    if (post.isPrivate && (!req.user || post.authorId._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce post'
      });
    }

    // 🚀 NOUVELLE MÉTHODE: Photos déjà récupérées avec populate !
    // Plus besoin de requêtes supplémentaires vers ProfilePicture collection
    
    const postObj = post.toObject();
    
    // Les photos de profil sont déjà dans post.authorId.profilePicture grâce au populate
    // et dans les commentaires grâce au populate sur comments.authorId
    
    // Note: Si une photo est manquante, on garde null (géré par le frontend)

    res.json({
      success: true,
      post: postObj
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du post'
    });
  }
};

// Mettre à jour un post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, isPrivate, decisionNumber } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce post'
      });
    }

    // Mettre à jour les champs
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (tags !== undefined) post.tags = tags;
    if (isPrivate !== undefined) post.isPrivate = isPrivate;
    if (decisionNumber !== undefined) post.decisionNumber = decisionNumber;

    // Marquer comme modifié par l'utilisateur
    post.lastUserEdit = new Date();

    await post.save();
    await post.populate('authorId', 'username firstName lastName university isStudent bio profilePicture');

    res.json({
      success: true,
      message: 'Post mis à jour avec succès',
      post
    });

  } catch (error) {
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du post'
    });
  }
};

// Supprimer un post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Tentative suppression post ID: ${id}`);
    console.log(`👤 Utilisateur: ${req.user?._id || 'non authentifié'}`);

    // Validation de l'ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`❌ ID invalide: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'ID de post invalide'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      console.log(`❌ Post non trouvé: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    console.log(`📄 Post trouvé: ${post.title} par ${post.authorId}`);

    // Vérifier que l'utilisateur est l'auteur
    if (post.authorId.toString() !== req.user._id.toString()) {
      console.log(`❌ Autorisation refusée: ${req.user._id} vs ${post.authorId}`);
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce post'
      });
    }

    // Mettre à jour le compteur de posts dans le dossier
    if (post.folderId) {
      console.log(`📁 Mise à jour dossier: ${post.folderId}`);
      await Folder.findByIdAndUpdate(post.folderId, { $inc: { postsCount: -1 } });
    }

    console.log(`🗑️ Suppression du post: ${id}`);
    await Post.findByIdAndDelete(id);

    console.log(`✅ Post supprimé avec succès: ${id}`);
    
    // 🚫 CACHE TEMPORAIREMENT DÉSACTIVÉ - pas besoin de vider le cache
    // console.log('🗄️ Vidage du cache après suppression...');
    // cache.flushAll();
    
    // Headers anti-cache très stricts pour forcer refresh frontend
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache', 
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Force-Refresh': 'true',
      'X-Reload-Page': 'true',
      'X-Action': 'FORCE_RELOAD'
    });
    
    res.json({
      success: true,
      message: 'Post supprimé avec succès - Page va se recharger',
      forceRefresh: true,
      reloadPage: true,
      forceReload: true,
      timestamp: Date.now(),
      action: 'DELETE_POST',
      jsCode: 'window.location.reload();'
    });

  } catch (error) {
    console.error('❌ Erreur suppression post:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du post',
      error: error.message
    });
  }
};

// Liker/Disliker un post
const toggleLikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Vérifier les permissions pour les posts privés
    if (post.isPrivate && post.authorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce post'
      });
    }

    const likedIndex = post.likedBy.indexOf(userId);

    if (likedIndex > -1) {
      // Déjà liké, on retire le like
      post.likedBy.splice(likedIndex, 1);
    } else {
      // Pas encore liké, on ajoute le like
      post.likedBy.push(userId);
      
      // Créer une notification pour l'auteur du post (sans Socket.io)
      if (post.authorId.toString() !== userId) {
        try {
          await createNotification({
            recipient: post.authorId,
            sender: userId,
            type: 'like',
            message: `${req.user.username} a aimé votre publication "${post.title}"`,
            relatedPost: post._id
          });
        } catch (notificationError) {
          // Silent error handling - pas de logs
        }
      }
    }

    await post.save();

    res.json({
      success: true,
      message: likedIndex > -1 ? 'Like retiré' : 'Post liké',
      post: {
        id: post._id,
        likes: post.likedBy.length,
        likedBy: post.likedBy,
        isLiked: likedIndex === -1
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du like du post'
    });
  }
};

// Ajouter un commentaire
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du commentaire est obligatoire'
      });
    }

    const post = await findPostBySlugOrId(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Vérifier les permissions pour les posts privés
    if (post.isPrivate && post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce post'
      });
    }

    const newComment = {
      authorId: req.user._id,
      content: content.trim()
    };

    post.comments.push(newComment);
    await post.save();

    // Créer une notification pour l'auteur du post
    /* if (post.authorId.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: post.authorId,
        sender: req.user._id,
        type: 'comment',
        message: `${req.user.username} a commenté votre post "${post.title}"`,
        relatedPost: post._id,
        relatedComment: post.comments[post.comments.length - 1]._id
      });
    } */

    // Peupler le nouveau commentaire
    await post.populate('comments.authorId', 'username firstName lastName university isStudent bio profilePicture');

    const addedComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Commentaire ajouté avec succès',
      comment: addedComment
    });

  } catch (error) {
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'ajout du commentaire'
    });
  }
};

// Récupérer les posts en tendance
const getTrendingPosts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Algorithme de tendance basé sur les interactions récentes (likes, commentaires, sauvegardes)
    const posts = await Post.aggregate([
      {
        $match: {
          isPrivate: false,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 derniers jours
        }
      },
      {
        $addFields: {
          // Calcul des sauvegardes récentes (dernières 24h)
          recentSaves: {
            $size: {
              $filter: {
                input: '$savesWithTimestamp',
                cond: {
                  $gte: ['$$this.savedAt', new Date(Date.now() - 24 * 60 * 60 * 1000)]
                }
              }
            }
          },
          // Score de tendance
          score: {
            $add: [
              { $multiply: ['$likes', 1] }, // Poids des likes (réduit)
              { $multiply: [{ $size: '$comments' }, 3] }, // Poids des commentaires (augmenté)
              { $multiply: ['$savesCount', 4] }, // Poids fort pour les sauvegardes totales
              { $multiply: [
                { 
                  $size: {
                    $filter: {
                      input: '$savesWithTimestamp',
                      cond: {
                        $gte: ['$$this.savedAt', new Date(Date.now() - 24 * 60 * 60 * 1000)]
                      }
                    }
                  }
                }, 
                8] }, // Poids très fort pour les sauvegardes récentes (dernières 24h)
              {
                $divide: [
                  100000, // Constante pour favoriser les posts récents
                  { $subtract: [new Date(), '$createdAt'] }
                ]
              }
            ]
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Peupler les auteurs
    await Post.populate(posts, {
      path: 'authorId',
      select: 'username firstName lastName university isStudent bio profilePicture'
    });

    // 🚀 Photos déjà récupérées avec populate - plus besoin de requêtes séparées !
    
    // Optimiser les PDFs pour les trending
    const optimizedPosts = posts.map(post => {
      if (post.pdfFile && post.pdfFile.length > 100000) {
        post.pdfFile = null;
        post.hasPdfFile = true;
      }
      return post;
    });

    res.json({
      success: true,
      posts: optimizedPosts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des posts en tendance'
    });
  }
};

// Déplacer un post vers un dossier
const movePostToFolder = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { folderId } = req.body;

    // Vérifier si le post existe
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Vérifier si l'utilisateur est l'auteur du post
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez déplacer que vos propres posts'
      });
    }

    // Si folderId est fourni, vérifier que le dossier existe et que l'utilisateur y a accès
    if (folderId) {
      const folder = await Folder.findById(folderId);
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Dossier non trouvé'
        });
      }
      
      if (!folder.canEdit(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé pour ajouter un post dans ce dossier'
        });
      }
    }

    // Mettre à jour le post
    post.folderId = folderId || null;
    await post.save();

    // Peupler les informations de l'auteur
    await post.populate('authorId', 'username firstName lastName university isStudent bio profilePicture');

    res.json({
      success: true,
      message: 'Post déplacé avec succès',
      post
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du déplacement du post'
    });
  }
};

// Récupérer les posts de l'utilisateur connecté
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.user._id })
      .populate('authorId', 'username firstName lastName university isStudent bio profilePicture')
      .sort({ createdAt: -1 });

    res.json(posts);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des posts'
    });
  }
};

// Récupérer les utilisateurs qui ont liké un post
const getPostLikes = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    if (post.likedBy.length === 0) {
      return res.json({
        success: true,
        users: [],
        count: 0
      });
    }

    // Récupérer les utilisateurs qui ont liké
    const likedUsers = await User.find({ 
      _id: { $in: post.likedBy },
      isDeleted: { $ne: true } // Exclure les utilisateurs supprimés
    }).select('username firstName lastName university isStudent bio profilePicture');

    // 🚀 Photos déjà récupérées avec select profilePicture !
    
    // Formater les utilisateurs
    const usersWithProfilePictures = likedUsers.map(user => {
      const userObj = user.toObject();
      userObj.id = user._id;
      // profilePicture déjà incluse grâce au select
      return userObj;
    });

    res.json({
      success: true,
      users: usersWithProfilePictures,
      count: usersWithProfilePictures.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des likes'
    });
  }
};

// Récupérer les commentaires avec pagination
const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const post = await Post.findById(id)
      .select('comments isPrivate authorId');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Vérifier les permissions pour les posts privés
    if (post.isPrivate && (!req.user || post.authorId.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce post'
      });
    }

    // Trier les commentaires par date décroissante
    const sortedComments = post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + (limit * 1);
    const paginatedComments = sortedComments.slice(startIndex, endIndex);

    // Peupler les auteurs des commentaires
    await Post.populate(paginatedComments, {
      path: 'authorId',
      select: 'username firstName lastName university isStudent bio isDeleted',
      match: { isDeleted: { $ne: true } }
    });

    // Récupérer les photos de profil des auteurs
    const authorIds = paginatedComments.map(comment => comment.authorId._id);
    const profilePictures = await ProfilePicture.find({ 
      userId: { $in: authorIds } 
    }).select('userId imageData');

    const profilePictureMap = {};
    profilePictures.forEach(pp => {
      if (pp.imageData && pp.imageData.length < 5000000) {
        profilePictureMap[pp.userId.toString()] = pp.imageData;
      }
    });

    // Ajouter les photos de profil aux commentaires
    const commentsWithProfilePictures = paginatedComments.map(comment => {
      const commentObj = comment.toObject();
      commentObj.authorId.profilePicture = profilePictureMap[comment.authorId._id.toString()] || null;
      return commentObj;
    });

    res.json({
      success: true,
      comments: commentsWithProfilePictures,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sortedComments.length,
        pages: Math.ceil(sortedComments.length / limit),
        hasMore: endIndex < sortedComments.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des commentaires'
    });
  }
};

// Liker un commentaire
const likeComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;

    const post = await findPostBySlugOrId(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Vérifier si déjà liké
    if (comment.likedBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Commentaire déjà liké'
      });
    }

    comment.likedBy.push(userId);
    await post.save();

    res.json({
      success: true,
      message: 'Commentaire liké avec succès',
      comment: {
        id: comment._id,
        likes: comment.likedBy.length,
        isLiked: true
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du like du commentaire'
    });
  }
};

// Déliker un commentaire
const unlikeComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;

    const post = await findPostBySlugOrId(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Retirer le like
    const likeIndex = comment.likedBy.indexOf(userId);
    if (likeIndex > -1) {
      comment.likedBy.splice(likeIndex, 1);
      await post.save();
    }

    res.json({
      success: true,
      message: 'Like retiré avec succès',
      comment: {
        id: comment._id,
        likes: comment.likedBy.length,
        isLiked: false
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du unlike du commentaire'
    });
  }
};

// Modifier un commentaire
const updateComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Validation du contenu
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du commentaire est obligatoire'
      });
    }

    // Trouver le post par slug ou ID
    const post = await findPostBySlugOrId(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publication non trouvée'
      });
    }

    // Trouver le commentaire
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'auteur du commentaire
    if (comment.authorId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - vous ne pouvez modifier que vos propres commentaires'
      });
    }

    // Modifier le commentaire
    comment.content = content.trim();
    comment.updatedAt = new Date();

    await post.save();

    res.json({
      success: true,
      message: 'Commentaire modifié avec succès',
      comment: {
        _id: comment._id,
        content: comment.content,
        updatedAt: comment.updatedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modification du commentaire'
    });
  }
};

// Supprimer un commentaire
const deleteComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const userId = req.user._id;

    // Trouver le post par slug ou ID
    const post = await findPostBySlugOrId(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publication non trouvée'
      });
    }

    // Trouver le commentaire
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'auteur du commentaire ou l'auteur du post
    if (comment.authorId.toString() !== userId.toString() && post.authorId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - vous ne pouvez supprimer que vos propres commentaires'
      });
    }

    // Supprimer le commentaire
    comment.deleteOne();
    await post.save();

    res.json({
      success: true,
      message: 'Commentaire supprimé avec succès'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du commentaire'
    });
  }
};

// POST /api/posts/:id/save - Sauvegarder un post
const savePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Vérifier si le post existe
    const post = await findPostBySlugOrId(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Vérifier si le post n'est pas déjà sauvegardé
    const user = await User.findById(userId);
    const isAlreadySaved = user.savedPosts.some(savedPost => 
      savedPost.postId && savedPost.postId.toString() === post._id.toString()
    );
    
    if (isAlreadySaved) {
      return res.json({
        success: true,
        message: 'Post déjà sauvegardé',
        alreadySaved: true
      });
    }

    // Ajouter le post aux posts sauvegardés avec la date de sauvegarde
    user.savedPosts.push({
      postId: post._id,
      savedAt: new Date()
    });
    
    await user.save(); // Utiliser save() pour déclencher le middleware

    // Ajouter l'entrée avec timestamp dans le post ET incrémenter le compteur
    const saveTimestamp = new Date();
    await Post.findByIdAndUpdate(
      post._id,
      { 
        $push: { savesWithTimestamp: { userId: userId, savedAt: saveTimestamp } },
        $inc: { savesCount: 1 } 
      },
      { new: true }
    );

    // Vider le cache pour que les nouvelles données soient récupérées
    // 🚫 CACHE TEMPORAIREMENT DÉSACTIVÉ
    // cache.flushAll();

    res.json({
      success: true,
      message: 'Post sauvegardé avec succès',
      alreadySaved: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde du post'
    });
  }
};

// DELETE /api/posts/:id/save - Désauvegarder un post
const unsavePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Vérifier si le post existe
    const post = await findPostBySlugOrId(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Retirer le post des posts sauvegardés
    const user = await User.findById(userId);
    user.savedPosts = user.savedPosts.filter(
      savedPost => savedPost.postId.toString() !== post._id.toString()
    );
    
    await user.save(); // Utiliser save() pour déclencher le middleware

    // Retirer l'entrée avec timestamp du post ET décrémenter le compteur
    const postBeforeUpdate = await Post.findById(post._id);
    const newSavesCount = Math.max(0, (postBeforeUpdate.savesCount || 0) - 1);
    
    await Post.findByIdAndUpdate(
      post._id,
      { 
        $pull: { savesWithTimestamp: { userId: userId } },
        $set: { savesCount: newSavesCount } 
      },
      { new: true }
    );

    // Vider le cache pour que les nouvelles données soient récupérées
    // 🚫 CACHE TEMPORAIREMENT DÉSACTIVÉ
    // cache.flushAll();

    res.json({
      success: true,
      message: 'Post retiré des sauvegardes'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la sauvegarde'
    });
  }
};

// GET /api/posts/:id/saved - Vérifier si un post est sauvegardé
const isPostSaved = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Vérifier si le post existe
    const post = await findPostBySlugOrId(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Vérifier si le post est sauvegardé
    const user = await User.findById(userId);
    const isSaved = user.savedPosts.some(savedPost => 
      savedPost.postId && savedPost.postId.toString() === post._id.toString()
    );

    res.json({
      success: true,
      isSaved
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de la sauvegarde'
    });
  }
};

// Fonction utilitaire pour vider le cache (accessible depuis d'autres modules)
const clearPostsCache = () => {
  try {
    console.log('🗄️ Vidage du cache posts...');
    // 🚫 CACHE TEMPORAIREMENT DÉSACTIVÉ
    // cache.flushAll();
    console.log('✅ Cache désactivé - pas de vidage nécessaire');
    return true;
  } catch (error) {
    console.error('❌ Erreur vidage cache:', error);
    return false;
  }
};

// Rechercher des posts par titre, contenu ou tags
const searchPosts = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, 'i'); // Recherche insensible à la casse
    
    // Critères de recherche (posts publics seulement pour les recherches)
    const searchCriteria = {
      isDeleted: { $ne: true },
      isPrivate: { $ne: true },
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { tags: { $in: [searchRegex] } },
        { decisionNumber: searchRegex }
      ]
    };
    
    const posts = await Post.find(searchCriteria)
      .populate('authorId', 'username firstName lastName profilePicture')
      .select('title content tags likes comments createdAt decisionNumber type authorId slug')
      .lean()
      .limit(parseInt(limit))
      .sort({ likes: -1, createdAt: -1 }); // Trier par popularité puis par date
    
    const normalizedPosts = posts.map(post => ({ ...post, id: post._id.toString() }));
    res.json({ success: true, data: normalizedPosts });
  } catch (error) {
    console.error('Erreur searchPosts:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la recherche de posts' });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  addComment,
  getTrendingPosts,
  movePostToFolder,
  getUserPosts,
  getPostLikes,
  getComments,
  likeComment,
  unlikeComment,
  updateComment,
  deleteComment,
  savePost,
  unsavePost,
  isPostSaved,
  clearPostsCache,
  searchPosts
};
