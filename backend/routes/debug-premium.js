/**
 * Route temporaire pour accorder premium manuellement à l'admin
 * À supprimer après résolution du problème webhook
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user.model');

// Route temporaire pour debug - SUPPRIMER APRÈS
router.post('/manual-premium/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminPassword } = req.body;
    
    // Sécurité supprimée - TODO: implémenter vraie auth
    // if (adminPassword !== 'theo2024premium') {
    //   return res.status(403).json({ error: 'Mot de passe incorrect' });
    // }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Accorder premium si pas déjà premium
    if (!user.hasRole('premium')) {
      user.grantPremium(365, 'Manuel - correction bug webhook Stripe');
      await user.save();
      
      console.log(`🎉 Premium accordé manuellement à ${user.username}`);
      
      return res.json({
        success: true,
        message: `Premium accordé à ${user.username}`,
        roles: user.roles,
        isPremium: user.isPremium
      });
    } else {
      return res.json({
        success: true,
        message: `${user.username} a déjà premium`,
        roles: user.roles,
        isPremium: user.isPremium
      });
    }

  } catch (error) {
    console.error('❌ Erreur manual-premium:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour trouver et accorder premium à l'admin automatiquement
router.post('/fix-admin-premium', async (req, res) => {
  try {
    const { adminPassword } = req.body;
    
    // Sécurité supprimée - TODO: implémenter vraie auth
    // if (adminPassword !== 'theo2024premium') {
    //   return res.status(403).json({ error: 'Mot de passe incorrect' });
    // }

    // Chercher l'admin principal (avec email theophane.maurey@gmail.com ou rôle admin)
    const admin = await User.findOne({ 
      $or: [
        { email: 'theophane.maurey@gmail.com' },
        { email: /theophane/i },
        { roles: /administrator/ }
      ]
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin non trouvé' });
    }

    console.log(`🎯 Admin trouvé: ${admin.username} (${admin.email})`);
    console.log(`🎭 Rôles actuels: ${admin.roles}`);

    // Accorder premium s'il ne l'a pas
    if (!admin.hasRole('premium')) {
      admin.grantPremium(365, 'Manuel - correction après paiements Stripe multiples');
      await admin.save();
      
      console.log(`🎉 Premium accordé à ${admin.username} pour 1 an`);
      
      return res.json({
        success: true,
        message: `Premium accordé à ${admin.username}`,
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          roles: admin.roles,
          isPremium: admin.isPremium
        }
      });
    } else {
      return res.json({
        success: true,
        message: `${admin.username} a déjà premium`,
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          roles: admin.roles,
          isPremium: admin.isPremium
        }
      });
    }

  } catch (error) {
    console.error('❌ Erreur fix-admin-premium:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour vérifier le statut d'un utilisateur
router.get('/check-premium/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      username: user.username,
      email: user.email,
      roles: user.roles,
      isPremium: user.isPremium,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripeSubscriptionStatus: user.stripeSubscriptionStatus,
      premiumHistory: user.premiumHistory?.slice(-3) || []
    });

  } catch (error) {
    console.error('❌ Erreur check-premium:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;