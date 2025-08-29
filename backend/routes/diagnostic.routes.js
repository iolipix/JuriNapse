const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');
const User = require('../models/user.model');
const { clearPostsCache } = require('../controllers/post.controller');

// Route de diagnostic pour vérifier l'état du serveur
router.get('/health', async (req, res) => {
    try {
        const postsCount = await Post.countDocuments();
        const usersCount = await User.countDocuments();
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: {
                posts: postsCount,
                users: usersCount,
                connected: true
            },
            server: {
                environment: process.env.NODE_ENV || 'development',
                version: '1.0.0'
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message,
            database: {
                connected: false
            }
        });
    }
});

// Route pour vérifier un post spécifique
router.get('/check-post/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const post = await Post.findById(id).populate('authorId', 'username firstName lastName');
        
        if (!post) {
            return res.json({
                exists: false,
                message: 'Post non trouvé',
                searchedId: id
            });
        }
        
        res.json({
            exists: true,
            post: {
                _id: post._id,
                title: post.title,
                author: post.authorId ? post.authorId.username : 'Utilisateur supprimé',
                createdAt: post.createdAt,
                isPrivate: post.isPrivate
            }
        });
        
    } catch (error) {
        res.status(500).json({
            exists: false,
            error: error.message,
            searchedId: req.params.id
        });
    }
});

// Route pour nettoyer les posts orphelins d'un utilisateur
router.post('/cleanup-user-posts/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        
        // Trouver tous les posts de cet utilisateur
        const userPosts = await Post.find({ authorId: user._id });
        
        // Vérifier les posts supprimés/orphelins dans les dossiers
        const foldersWithOrphans = await Folder.find({
            userId: user._id,
            postsCount: { $gt: 0 }
        });
        
        let repairsNeeded = 0;
        for (const folder of foldersWithOrphans) {
            const actualPostsInFolder = await Post.countDocuments({
                authorId: user._id,
                folderId: folder._id
            });
            
            if (actualPostsInFolder !== folder.postsCount) {
                repairsNeeded++;
                await Folder.findByIdAndUpdate(folder._id, {
                    postsCount: actualPostsInFolder
                });
            }
        }
        
        res.json({
            success: true,
            user: username,
            totalPosts: userPosts.length,
            foldersRepaired: repairsNeeded,
            posts: userPosts.map(p => ({
                id: p._id,
                title: p.title,
                createdAt: p.createdAt
            }))
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route pour nettoyer tous les posts orphelins du système
router.post('/cleanup-orphan-posts', async (req, res) => {
    try {
        console.log('🧹 Début du nettoyage des posts orphelins...');
        
        // Trouver tous les posts
        const allPosts = await Post.find({}).select('_id authorId title createdAt');
        console.log(`📊 ${allPosts.length} posts total à vérifier`);
        
        let orphanPosts = [];
        let checkedCount = 0;
        
        // Vérifier chaque post par batch pour éviter les timeouts
        const batchSize = 50;
        for (let i = 0; i < allPosts.length; i += batchSize) {
            const batch = allPosts.slice(i, i + batchSize);
            
            for (const post of batch) {
                const author = await User.findById(post.authorId).select('_id username isDeleted');
                
                if (!author || author.isDeleted) {
                    orphanPosts.push({
                        id: post._id,
                        title: post.title,
                        createdAt: post.createdAt,
                        authorId: post.authorId,
                        reason: !author ? 'Auteur inexistant' : 'Auteur supprimé'
                    });
                }
                
                checkedCount++;
            }
            
            // Log de progression
            if (i % 100 === 0) {
                console.log(`🔄 Vérifiés: ${checkedCount}/${allPosts.length} posts`);
            }
        }
        
        console.log(`❌ ${orphanPosts.length} posts orphelins trouvés`);
        
        // Option pour supprimer automatiquement (par défaut non)
        const { autoDelete = false } = req.body;
        let deletedCount = 0;
        
        if (autoDelete && orphanPosts.length > 0) {
            const orphanIds = orphanPosts.map(p => p.id);
            const deleteResult = await Post.deleteMany({ _id: { $in: orphanIds } });
            deletedCount = deleteResult.deletedCount;
            console.log(`🗑️ ${deletedCount} posts orphelins supprimés`);
        }
        
        res.json({
            success: true,
            totalChecked: allPosts.length,
            orphansFound: orphanPosts.length,
            orphansDeleted: deletedCount,
            orphanPosts: orphanPosts.slice(0, 10), // Afficher seulement les 10 premiers
            autoDeleteWasEnabled: autoDelete
        });
        
    } catch (error) {
        console.error('❌ Erreur nettoyage posts orphelins:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route pour vider le cache NodeCache
router.post('/clear-cache', (req, res) => {
    try {
        console.log('🗄️ Vidage du cache NodeCache...');
        
        const cacheCleared = clearPostsCache();
        
        res.json({
            success: cacheCleared,
            message: cacheCleared ? 'Cache vidé avec succès' : 'Erreur lors du vidage du cache',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
