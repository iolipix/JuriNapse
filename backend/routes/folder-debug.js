const express = require('express');
const Folder = require('../models/folder.model');
const User = require('../models/user.model');
const router = express.Router();

// Route pour déboguer les dossiers d'un utilisateur spécifique
router.get('/debug-folders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 Débogage des dossiers pour userId: ${userId}`);
    
    const result = {
      timestamp: new Date().toISOString(),
      userId: userId,
      userInfo: {},
      foldersDebug: {},
      problems: [],
      solutions: []
    };

    // 1. Vérifier l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      result.problems.push('Utilisateur introuvable');
      return res.status(404).json(result);
    }

    result.userInfo = {
      email: user.email,
      username: user.username,
      roles: user.roles
    };

    // 2. Récupérer tous les dossiers de l'utilisateur
    const allFolders = await Folder.find({ owner: userId })
      .populate('owner', 'username email')
      .populate('posts')
      .sort({ createdAt: -1 });

    result.foldersDebug.totalFolders = allFolders.length;
    result.foldersDebug.folders = allFolders.map(folder => ({
      id: folder._id,
      name: folder.name,
      parentId: folder.parentId,
      isPublic: folder.isPublic,
      postsCount: folder.posts ? folder.posts.length : 0,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      color: folder.color,
      description: folder.description
    }));

    // 3. Analyser la structure
    const rootFolders = allFolders.filter(f => !f.parentId);
    const subFolders = allFolders.filter(f => f.parentId);

    result.foldersDebug.structure = {
      rootFoldersCount: rootFolders.length,
      subFoldersCount: subFolders.length,
      rootFolders: rootFolders.map(f => ({
        id: f._id,
        name: f.name,
        children: subFolders.filter(sf => sf.parentId?.toString() === f._id.toString()).length
      }))
    };

    // 4. Vérifier les dossiers récemment créés (dernière heure)
    const oneHourAgo = new Date(Date.now() - 60*60*1000);
    const recentFolders = allFolders.filter(f => f.createdAt >= oneHourAgo);
    
    result.foldersDebug.recentFolders = {
      count: recentFolders.length,
      folders: recentFolders.map(f => ({
        id: f._id,
        name: f.name,
        createdAt: f.createdAt,
        parentId: f.parentId
      }))
    };

    // 5. Vérifier les dossiers publics
    const publicFolders = allFolders.filter(f => f.isPublic);
    result.foldersDebug.publicFolders = {
      count: publicFolders.length,
      folders: publicFolders.map(f => ({
        id: f._id,
        name: f.name
      }))
    };

    // 6. Analyser les problèmes potentiels
    if (recentFolders.length > 0 && rootFolders.length === 0) {
      result.problems.push('Dossiers récents créés mais aucun dossier racine trouvé');
      result.solutions.push('Problème de cache ou structure de parentId');
    }

    const foldersWithoutPosts = allFolders.filter(f => !f.posts || f.posts.length === 0);
    if (foldersWithoutPosts.length > 0) {
      result.problems.push(`${foldersWithoutPosts.length} dossiers sans posts`);
    }

    result.status = result.problems.length > 0 ? 'ISSUES_FOUND' : 'OK';
    
    res.json(result);

  } catch (error) {
    console.error('❌ Erreur debug-folders:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route pour forcer le rafraîchissement du cache des dossiers
router.post('/refresh-folders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Récupérer tous les dossiers avec cache bypass
    const folders = await Folder.find({ owner: userId })
      .populate('owner', 'username email')
      .populate('posts')
      .sort({ createdAt: -1 })
      .lean(); // Utiliser lean() pour forcer un nouveau fetch

    res.json({
      success: true,
      message: 'Cache des dossiers rafraîchi',
      foldersCount: folders.length,
      timestamp: new Date().toISOString(),
      folders: folders.map(f => ({
        id: f._id,
        name: f.name,
        parentId: f.parentId,
        postsCount: f.posts ? f.posts.length : 0
      }))
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;