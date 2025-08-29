const Folder = require('../models/folder.model');
const Post = require('../models/post.model');

// Créer un nouveau dossier
exports.createFolder = async (req, res) => {
  try {
    const { name, description, color, parentId, isPublic } = req.body;
    
    // Vérifier si le dossier parent existe et si l'utilisateur y a accès
    if (parentId) {
      const parentFolder = await Folder.findById(parentId);
      if (!parentFolder) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dossier parent non trouvé' 
        });
      }
      
      if (!parentFolder.canEdit(req.user._id)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Accès refusé pour créer un dossier dans ce répertoire' 
        });
      }
    }
    
    const folder = new Folder({
      name,
      description,
      color,
      parentId,
      owner: req.user._id,
      isPublic: isPublic || false
    });
    
    await folder.save();
    
    // Populate les informations du propriétaire
    await folder.populate('owner', 'username avatar');
    
    res.status(201).json({
      success: true,
      data: folder,
      message: 'Dossier créé avec succès'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du dossier'
    });
  }
};

// Obtenir tous les dossiers d'un utilisateur
exports.getFolders = async (req, res) => {
  try {
    const { parentId } = req.query;
    
    const query = {
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id },
        { isPublic: true }
      ]
    };
    
    if (parentId) {
      query.parentId = parentId;
    } else {
      query.parentId = null;
    }
    
    const folders = await Folder.find(query)
      .populate('owner', 'username avatar')
      .populate('collaborators.user', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: folders
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des dossiers'
    });
  }
};

// Obtenir un dossier spécifique
exports.getFolder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const folder = await Folder.findById(id)
      .populate('owner', 'username avatar')
      .populate('collaborators.user', 'username avatar');
    
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }
    
    if (!folder.canAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce dossier'
      });
    }
    
    // Obtenir les posts dans ce dossier
    const posts = await Post.find({ folderId: id })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });
    
    // Obtenir les sous-dossiers
    const subFolders = await Folder.find({ parentId: id })
      .populate('owner', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        folder,
        posts,
        subFolders
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du dossier'
    });
  }
};

// Mettre à jour un dossier
exports.updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, isPublic } = req.body;
    
    const folder = await Folder.findById(id);
    
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }
    
    if (!folder.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé pour modifier ce dossier'
      });
    }
    
    const updatedFolder = await Folder.findByIdAndUpdate(
      id,
      { name, description, color, isPublic },
      { new: true, runValidators: true }
    ).populate('owner', 'username avatar');
    
    res.json({
      success: true,
      data: updatedFolder,
      message: 'Dossier mis à jour avec succès'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du dossier'
    });
  }
};

// Supprimer un dossier
exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const folder = await Folder.findById(id);
    
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }
    
    if (folder.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire peut supprimer ce dossier'
      });
    }
    
    // Vérifier s'il y a des posts dans le dossier
    const postsCount = await Post.countDocuments({ folderId: id });
    if (postsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un dossier contenant des posts'
      });
    }
    
    // Vérifier s'il y a des sous-dossiers
    const subFoldersCount = await Folder.countDocuments({ parentId: id });
    if (subFoldersCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un dossier contenant des sous-dossiers'
      });
    }
    
    await Folder.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Dossier supprimé avec succès'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du dossier'
    });
  }
};

// Ajouter un collaborateur à un dossier
exports.addCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    
    const folder = await Folder.findById(id);
    
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }
    
    if (folder.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire peut ajouter des collaborateurs'
      });
    }
    
    // Vérifier si l'utilisateur est déjà collaborateur
    const existingCollaborator = folder.collaborators.find(
      collab => collab.user.toString() === userId
    );
    
    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur est déjà collaborateur'
      });
    }
    
    folder.collaborators.push({
      user: userId,
      role: role || 'viewer'
    });
    
    await folder.save();
    
    const updatedFolder = await Folder.findById(id)
      .populate('owner', 'username avatar')
      .populate('collaborators.user', 'username avatar');
    
    res.json({
      success: true,
      data: updatedFolder,
      message: 'Collaborateur ajouté avec succès'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'ajout du collaborateur'
    });
  }
};

// Supprimer un collaborateur d'un dossier
exports.removeCollaborator = async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    const folder = await Folder.findById(id);
    
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }
    
    if (folder.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire peut supprimer des collaborateurs'
      });
    }
    
    folder.collaborators = folder.collaborators.filter(
      collab => collab.user.toString() !== userId
    );
    
    await folder.save();
    
    const updatedFolder = await Folder.findById(id)
      .populate('owner', 'username avatar')
      .populate('collaborators.user', 'username avatar');
    
    res.json({
      success: true,
      data: updatedFolder,
      message: 'Collaborateur supprimé avec succès'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du collaborateur'
    });
  }
};

// Rechercher des dossiers
exports.searchFolders = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La recherche doit contenir au moins 2 caractères'
      });
    }
    
    const folders = await Folder.find({
      $and: [
        {
          $or: [
            { owner: req.user._id },
            { 'collaborators.user': req.user._id },
            { isPublic: true }
          ]
        },
        {
          $text: { $search: q }
        }
      ]
    })
    .populate('owner', 'username avatar')
    .sort({ score: { $meta: 'textScore' } })
    .limit(20);
    
    res.json({
      success: true,
      data: folders
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la recherche de dossiers'
    });
  }
};
