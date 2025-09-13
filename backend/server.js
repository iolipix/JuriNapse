// Configuration du serveur Express.js - Application Lexilis - Updated for deleteHistory
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config({ path: './config/.env' });

// --- Log filtering avancé (LOG_LEVEL = silent|minimal|normal|debug) ---
// Permet de réduire drastiquement le bruit sans modifier tous les fichiers.
// LOG_LEVEL par défaut: normal
// Compatibilité: QUIET_LOGS=1 => force minimal si LOG_LEVEL non défini
(() => {
  const levelNames = { silent:0, minimal:1, normal:2, debug:3 };
  let envLevel = (process.env.LOG_LEVEL || '').toLowerCase();
  if (!envLevel && process.env.QUIET_LOGS === '1') envLevel = 'minimal';
  if (!levelNames.hasOwnProperty(envLevel)) envLevel = 'normal';
  const currentLevel = levelNames[envLevel];

  const originalLog = console.log;
  const classify = (text) => {
    // Startup / essentiels
    if (/^(� |🔄 |✅ MongoDB|🌟 |📡 |🔗 |🧹 )/.test(text)) return 1; // minimal
  // Emojis debug
  if (/^\[EMOJI]/.test(text)) return 1; // minimal
    // Socket connection / room
    if (/^(🔌 Nouvelle connexion Socket.io)/.test(text)) return 2; // normal
    if (/^(📤 Socket )/.test(text)) return 3; // debug (room joins)
    // Verbose auth + requêtes
    if (/^(🔐 \[DEBUG]|🍪 \[DEBUG]|\s{3}Utilisateur:|\s{3}Page:|\s{3}hiddenEntry:|\s{3}historyDeletedEntry:|\s{3}messageQuery:|\s{3}Messages trouvés:|\s{3}Premier:|\s{3}Dernier:)/.test(text)) return 3; // debug
    return 2; // normal par défaut
  };
  console.log = (...args) => {
    try {
      const joined = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
      const msgLevel = classify(joined);
      if (msgLevel <= currentLevel) {
        // msgLevel is category numerically (1 minimal). We keep if msgLevel <= currentLevel? Actually we want show if category <= currentLevel.
        // Levels numeric ascending by verbosity, debug=3 highest. Already aligned.
        originalLog(...args);
      }
    } catch (_) {
      originalLog(...args);
    }
  };
  originalLog(`🧹 Log filtering actif - LOG_LEVEL=${envLevel}`);
})();

// Import des routes
const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');
const folderRoutes = require('./routes/folder.routes');
const notificationRoutes = require('./routes/notification.routes');
const userRoutes = require('./routes/user.routes');
const groupRoutes = require('./routes/group.routes');
const messageRoutes = require('./routes/message.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const seoRoutes = require('./routes/seo.routes');
const adminRoutes = require('./routes/admin');
const prerenderRoutes = require('./routes/prerender.routes');
const diagnosticRoutes = require('./routes/diagnostic.routes');

// Import des middlewares de sécurité
const { 
  authLimiter, 
  registerLimiter, 
  apiLimiter, 
  helmetConfig, 
  mongoSanitize, 
  ipWhitelist 
} = require('./security-middleware');

// Import du middleware de nettoyage automatique
const { middlewareMessagesOrphelins } = require('./middleware/orphanCleanup');

// Middleware de détection de bots pour SEO
const botDetection = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const isBotOrCrawler = /bot|crawl|slurp|spider|facebook|twitter|linkedin|whatsapp|telegram/i.test(userAgent);
  
  // Si c'est un bot ET que c'est une route de profil
  if (isBotOrCrawler && req.path.startsWith('/profile/')) {
    // Rediriger vers le prérendu
    return prerenderRoutes(req, res, next);
  }
  
  next();
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000', 
      'http://localhost:5173', 
      'http://localhost:5175', 
      'http://localhost:5176',
      'https://juri-napse-bix1.vercel.app', // Frontend Vercel ancien domaine
      'https://juri-napse.vercel.app', // Frontend Vercel nouveau domaine
      'https://jurinapse.vercel.app', // Domaine potentiel futur
      'https://www.jurinapse.com' // Domaine custom potentiel
    ],
    credentials: true
  }
});
const PORT = process.env.PORT || 5000;

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    // Utiliser directement MONGODB_URI du fichier .env
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI manquant dans le fichier .env');
    }
    
    // ⚠️ Ne JAMAIS logger l'URI complète en production !
    // console.log('🔍 URI utilisée:', mongoURI.replace(/:[^:@]*@/, ':****@')); // Désactivé pour sécurité
    
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    throw error;
  }
};

// Middleware
// 🛡️ Sécurité - Headers HTTP sécurisés
app.use(helmetConfig);

// 🛡️ Sécurité - Protection contre les injections NoSQL
app.use(mongoSanitize);

// 🛡️ Sécurité - Rate limiting global
app.use('/api/', apiLimiter);

// 🛡️ Sécurité - Surveillance IP (optionnel)
// app.use(ipWhitelist); // Décommenter si nécessaire

app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5175', 
    'http://localhost:5176',
    'https://juri-napse-bix1.vercel.app', // Frontend Vercel ancien domaine
    'https://juri-napse.vercel.app', // Frontend Vercel nouveau domaine
    'https://jurinapse.vercel.app', // Domaine potentiel futur
    'https://www.jurinapse.com', // Domaine custom .com
    'https://jurinapse.com', // Domaine custom .com sans www
    'https://www.jurinapse.fr', // Domaine custom .fr
    'https://jurinapse.fr' // Domaine custom .fr sans www
  ],
  credentials: true // Pour permettre les cookies
}));
app.use(cookieParser()); // Pour parser les cookies
app.use(express.json({ limit: '50mb' })); // Augmenter la limite pour les fichiers PDF
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'JuriNapse API is running!' });
});

// Middleware pour passer l'objet io uniquement aux routes de messagerie
// (Socket.io n'est plus global, seulement pour la messagerie)

// Middleware Socket.io pour la messagerie seulement
const socketMiddleware = (req, res, next) => {
  req.io = io;
  next();
};

// Utilisation des routes
// 🛡️ Protection renforcée pour l'authentification
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth', authRoutes);

// 🔍 Route de santé pour monitoring de sécurité
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    security: 'protected'
  });
});

app.use('/api/posts', postRoutes); // Pas de Socket.io pour les posts
app.use('/api/folders', folderRoutes);
app.use('/api/notifications', socketMiddleware, notificationRoutes); // Socket.io pour les notifications en temps réel
app.use('/api/users', userRoutes);
app.use('/api/groups', socketMiddleware, groupRoutes); // Socket.io seulement pour les groupes
app.use('/api/messages', middlewareMessagesOrphelins, socketMiddleware, messageRoutes); // Nettoyage auto + Socket.io pour messages
app.use('/api/subscriptions', subscriptionRoutes); // TEMP: Test sans socketMiddleware pour debug 404
app.use('/api/admin', adminRoutes); // Routes d'administration
app.use('/api/diagnostic', diagnosticRoutes); // Routes de diagnostic

// EMERGENCY: Test route simple pour debug
app.get('/api/test-subscriptions', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Route de test fonctionne', 
    timestamp: new Date().toISOString(),
    routes_loaded: 'subscription routes should work now'
  });
});

app.use('/', seoRoutes); // Routes SEO (sitemap, robots.txt)
app.use('/', require('./routes/sitemap.routes')); // Route pour le sitemap

// 🤖 Routes de prérendu SEO pour les bots
app.use('/seo', prerenderRoutes); // Routes pré-rendues pour SEO
app.use('/', botDetection); // Middleware de détection automatique des bots

// Middleware pour capturer les 404 avec debug
app.use('/api', (req, res, next) => {
  // Si aucune route API n'a matché, retourner une 404 avec info de debug
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
    debug: {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent')
    }
  });
});

// Configuration Socket.io
io.on('connection', (socket) => {
  console.log('🔌 Nouvelle connexion Socket.io:', socket.id);

  // Rejoindre sa room personnelle pour les notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log('📤 Socket', socket.id, 'a rejoint sa room personnelle:', `user-${userId}`);
  });

  // Rejoindre un groupe (room)
  socket.on('join-group', (groupId) => {
    socket.join(groupId);
    console.log('📤 Socket', socket.id, 'a rejoint la room:', groupId);
  });

  // Quitter un groupe
  socket.on('leave-group', (groupId) => {
    socket.leave(groupId);
    console.log('📤 Socket', socket.id, 'a quitté la room:', groupId);
  });

  // Gérer l'exclusion d'un membre
  socket.on('member-removed', (data) => {
    
    // Diffuser à tous les membres du groupe
    io.to(data.groupId).emit('member-removed', data);
    
    // Force la déconnexion de tous les sockets de l'utilisateur exclu de ce groupe
    // Note: Ceci est une approche simplifiée. Dans un vrai système, il faudrait
    // mapper les userId aux socket.id pour cibler précisément l'utilisateur exclu
    if (data.removedUserId) {
      
    }
  });

  // Gérer la déconnexion
  socket.on('disconnect', () => {
    
  });
});

// Rendre io accessible dans les routes
app.set('io', io);

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Démarrage du serveur...');
    await connectDB();
    console.log('✅ Base de données connectée');
    
    // Initialiser l'administrateur par défaut
    try {
      const { initializeDefaultAdmin } = require('./controllers/admin.controller');
      await initializeDefaultAdmin();
    } catch (error) {
      console.error('⚠️ Erreur initialisation admin par défaut:', error.message);
    }

    // Script d'urgence pour réparer les abonnements de theophane_mry
    if (process.env.RUN_FIX_SCRIPT === 'true') {
      try {
        console.log('🔧 [EMERGENCY] Exécution du script de réparation des abonnements...');
        
        const mongoose = require('mongoose');
        const User = require('./models/user.model');

        const theophaneId = '68b25c61a29835348429424a';
        const user = await User.findById(theophaneId);
        
        if (!user) {
          console.log('❌ [EMERGENCY] Utilisateur theophane_mry non trouvé !');
        } else {
          console.log(`✅ [EMERGENCY] Utilisateur trouvé: ${user.username} (${user.role})`);
          console.log(`[EMERGENCY] État actuel - Following: ${user.following?.length || 0}, Followers: ${user.followers?.length || 0}`);
          
          // Si les tableaux sont vides, essayer de les restaurer
          if (!user.following || user.following.length === 0) {
            console.log('⚠️ [EMERGENCY] Tableau "following" vide, tentative de restauration...');
            
            const usersFollowingTheophane = await User.find({
              following: mongoose.Types.ObjectId(theophaneId)
            }).select('_id username');
            
            const potentialFollowing = await User.find({
              followers: mongoose.Types.ObjectId(theophaneId)
            }).select('_id username');
            
            console.log(`[EMERGENCY] Trouvé ${usersFollowingTheophane.length} followers et ${potentialFollowing.length} following potentiels`);
            
            if (usersFollowingTheophane.length > 0 || potentialFollowing.length > 0) {
              user.followers = usersFollowingTheophane.map(u => u._id);
              user.followersCount = usersFollowingTheophane.length;
              user.following = potentialFollowing.map(u => u._id);
              user.followingCount = potentialFollowing.length;
              
              await user.save();
              console.log('✅ [EMERGENCY] Abonnements restaurés !');
              console.log(`[EMERGENCY] État final - Following: ${user.followingCount}, Followers: ${user.followersCount}`);
            }
          } else {
            console.log('ℹ️ [EMERGENCY] Abonnements déjà présents, aucune action nécessaire');
          }
        }
        
        console.log('🎯 [EMERGENCY] Script de réparation terminé');
      } catch (error) {
        console.error('❌ [EMERGENCY] Erreur script de réparation:', error.message);
      }
    }
    
    // Nettoyage global initial au démarrage
    (async () => {
      try {
        // Réduction des logs - exécution en arrière-plan
        const { maintenanceCleanupAll } = require('./scripts/maintenanceCleanupAll');
        await maintenanceCleanupAll({ dryRun: false, includeSystem: true, forceAllIfNoUsers: true, ignoreSystemAccounts: true });
      } catch (e) {
        console.error('⚠️ [STARTUP] Échec maintenance cleanup:', e.message);
      }
    })();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🌟 Serveur démarré sur le port ${PORT}`);
      console.log(`📡 API disponible sur http://localhost:${PORT}`);
      console.log(`🔗 Serveur HTTP écoute sur 0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

// Cron: maintenance cleanup ALL chaque jour à 00:01
try {
  cron.schedule('1 0 * * *', async () => {
    try {
    console.log('🕐 [CRON] Lancement maintenance cleanup ALL (00:01)');
    const { maintenanceCleanupAll } = require('./scripts/maintenanceCleanupAll');
  await maintenanceCleanupAll({ dryRun: false, includeSystem: true, forceAllIfNoUsers: true, ignoreSystemAccounts: true });
    console.log('✅ [CRON] Maintenance cleanup ALL terminé');
    } catch (err) {
    console.error('❌ [CRON] Erreur maintenance cleanup ALL:', err.message);
    }
  }, { timezone: 'Europe/Paris' });
  console.log('⏲️  Tâche planifiée: maintenance cleanup ALL tous les jours à 00:01 (Europe/Paris)');
} catch (e) {
  console.error('⚠️ Impossible de programmer la tâche maintenance cleanup ALL:', e.message);
}

// -------------------------
// Fallback pour client-side routing
// Permettre aux URLs SPA (ex: /post/:slug) d'être résolues par le frontend
// Quand le build frontend est présent, servir son index.html
// Sinon, rediriger vers le domaine frontend public configuré via FRONTEND_URL
// -------------------------
app.get('*', (req, res) => {
  try {
    // Éviter d'interférer avec les routes API et SEO
    if (req.path.startsWith('/api') || req.path.startsWith('/seo') || req.path.startsWith('/robots.txt') || req.path.startsWith('/sitemap.xml')) {
      return res.status(404).send('Not Found');
    }

    const path = require('path');
    const fs = require('fs');
    // Chercher le build frontend dans les emplacements probables
    const possibleFrontends = [
      path.join(__dirname, '..', 'frontend', 'dist', 'index.html'),
      path.join(__dirname, '..', 'frontend', 'build', 'index.html'),
      path.join(__dirname, '..', 'dist', 'index.html'),
      path.join(__dirname, '..', 'public', 'index.html')
    ];

    for (const fp of possibleFrontends) {
      if (fs.existsSync(fp)) {
        return res.sendFile(fp);
      }
    }

    // Si pas de build présent, rediriger vers le FRONTEND_URL si configuré
    const frontendUrl = process.env.FRONTEND_URL || process.env.FRONTEND_HOST || 'https://www.jurinapse.com';
    const target = `${frontendUrl.replace(/\/$/, '')}${req.originalUrl}`;
    return res.redirect(302, target);
  } catch (e) {
    console.error('❌ Erreur fallback frontend:', e.message);
    return res.status(500).send('Server error');
  }
});
