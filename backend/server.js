// Configuration du serveur Express.js - Application Lexilis - Updated for deleteHistory
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
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
const seoIndexationRoutes = require('./routes/seo-indexation.routes');
const adminRoutes = require('./routes/admin.routes');
const prerenderRoutes = require('./routes/prerender.routes');
const diagnosticRoutes = require('./routes/diagnostic.routes');

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
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes); // Pas de Socket.io pour les posts
app.use('/api/folders', folderRoutes);
app.use('/api/notifications', socketMiddleware, notificationRoutes); // Socket.io pour les notifications en temps réel
app.use('/api/users', userRoutes);
app.use('/api/groups', socketMiddleware, groupRoutes); // Socket.io seulement pour les groupes
app.use('/api/messages', middlewareMessagesOrphelins, socketMiddleware, messageRoutes); // Nettoyage auto + Socket.io pour messages
app.use('/api/subscriptions', socketMiddleware, subscriptionRoutes); // Socket.io pour les notifications d'abonnement
app.use('/api/admin', adminRoutes); // Routes d'administration
app.use('/api/diagnostic', diagnosticRoutes); // Routes de diagnostic
app.use('/api/seo', seoIndexationRoutes); // Routes SEO pour indexation automatique
app.use('/', seoRoutes); // Routes SEO (sitemap, robots.txt)
app.use('/', require('./routes/sitemap.routes')); // Route pour le sitemap

// Route pour servir la clé IndexNow à la racine
app.get('/indexnow-key.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(process.env.INDEX_NOW_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
});

// 🤖 Routes de prérendu SEO pour les bots
app.use('/seo', prerenderRoutes); // Routes pré-rendues pour SEO
app.use('/', botDetection); // Middleware de détection automatique des bots

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
