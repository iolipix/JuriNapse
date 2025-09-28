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
    
    // Sécurité basique
    if (adminPassword !== 'theo2024premium') {
      return res.status(403).json({ error: 'Mot de passe incorrect' });
    }

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