// Mode développement avec base de données locale SQLite temporaire
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Base de données temporaire en mémoire pour les tests
const tempDB = {
  users: new Map(),
  groups: new Map(),
  groupPictures: new Map(),
  messages: new Map()
};

// Créer quelques groupes de test avec des images
tempDB.groups.set('group1', {
  id: 'group1',
  name: 'Groupe Test 1',
  profilePicture: null,
  adminId: 'user1',
  moderatorIds: ['user2'],
  memberIds: ['user1', 'user2', 'user3']
});

tempDB.groups.set('group2', {
  id: 'group2', 
  name: 'Groupe Test 2',
  profilePicture: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdUMjwvdGV4dD4KPC9zdmc+',
  adminId: 'user1',
  moderatorIds: [],
  memberIds: ['user1', 'user2', 'user3', 'user4']
});

// User test
tempDB.users.set('user1', {
  id: 'user1',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  profilePicture: null
});

// Routes API pour tester les images de groupe
app.get('/api/groups', (req, res) => {
  console.log('📋 GET /api/groups - Récupération des groupes');
  const groups = Array.from(tempDB.groups.values());
  res.json({
    success: true,
    data: groups
  });
});

app.get('/api/groups/:id', (req, res) => {
  const { id } = req.params;
  console.log(`🔍 GET /api/groups/${id} - Récupération du groupe`);
  
  const group = tempDB.groups.get(id);
  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Groupe non trouvé'
    });
  }
  
  res.json({
    success: true,
    data: group
  });
});

app.put('/api/groups/:id/picture', (req, res) => {
  const { id } = req.params;
  const { profilePicture } = req.body;
  
  console.log(`🖼️ PUT /api/groups/${id}/picture - Mise à jour de l'image`);
  console.log('📏 Taille de l\'image:', profilePicture ? profilePicture.length : 0);
  
  const group = tempDB.groups.get(id);
  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Groupe non trouvé'
    });
  }
  
  // Mettre à jour l'image
  group.profilePicture = profilePicture;
  tempDB.groups.set(id, group);
  
  console.log('✅ Image du groupe mise à jour avec succès');
  
  res.json({
    success: true,
    message: 'Image du groupe mise à jour avec succès',
    data: group
  });
});

// Route pour servir les images stockées
app.get('/api/groups/:id/picture', (req, res) => {
  const { id } = req.params;
  console.log(`🖼️ GET /api/groups/${id}/picture - Récupération de l'image`);
  
  const group = tempDB.groups.get(id);
  if (!group || !group.profilePicture) {
    return res.status(404).json({
      success: false,
      message: 'Image non trouvée'
    });
  }
  
  // Si c'est un data URL, extraire et renvoyer les octets avec le bon Content-Type
  if (typeof group.profilePicture === 'string' && group.profilePicture.startsWith('data:')) {
    const match = group.profilePicture.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) {
      return res.status(415).json({ success: false, message: 'Format d\'image non reconnu' });
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const imgBuffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', imgBuffer.length);
    return res.status(200).end(imgBuffer);
  }

  return res.status(415).json({ success: false, message: 'Format d\'image non supporté' });
});

// Route de test
app.get('/api/test', (req, res) => {
  console.log('✅ Serveur de développement actif');
  res.json({
    success: true,
    message: 'Serveur de développement pour tests des images de groupe',
    data: {
      groups: tempDB.groups.size,
      users: tempDB.users.size
    }
  });
});

// Route pour simuler l'authentification
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Simulation connexion utilisateur');
  res.json({
    success: true,
    user: tempDB.users.get('user1'),
    token: 'dev-token-123'
  });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.message);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

// Route 404 - utiliser une route plus spécifique pour éviter les erreurs de path-to-regexp
app.all('*', (req, res) => {
  console.log('❓ Route non trouvée:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

app.listen(PORT, () => {
  console.log('\n🚀 SERVEUR DE DÉVELOPPEMENT DÉMARRÉ');
  console.log(`🌐 Serveur actif sur: http://localhost:${PORT}`);
  console.log('📊 Base de données temporaire initialisée');
  console.log(`📁 ${tempDB.groups.size} groupes de test disponibles`);
  console.log(`👤 ${tempDB.users.size} utilisateur de test disponible`);
  console.log('\n🧪 Routes de test disponibles:');
  console.log('   GET  /api/test - Vérification du serveur');
  console.log('   GET  /api/groups - Liste des groupes');
  console.log('   PUT  /api/groups/:id/picture - Mise à jour image');
  console.log('\n💡 Ce serveur remplace temporairement MongoDB pour les tests');
});

module.exports = app;
