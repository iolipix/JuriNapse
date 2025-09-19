/**
 * Routes pour l'intégration Stripe - Abonnements Premium
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const stripeService = require('../services/stripe.service');
const User = require('../models/user.model');

// Route pour créer une session de checkout Stripe
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    // Vérifier si Stripe est configuré
    if (!stripeService.isConfigured()) {
      return res.status(503).json({ 
        message: 'Service de paiement temporairement indisponible. Veuillez réessayer plus tard.',
        error: 'STRIPE_NOT_CONFIGURED'
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur a déjà un abonnement actif
    if (user.hasRole('premium') && user.stripeSubscriptionStatus === 'active') {
      return res.status(400).json({ 
        message: 'Vous avez déjà un abonnement premium actif' 
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${frontendUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/premium/cancel`;

    // Créer la session de checkout
    const session = await stripeService.createCheckoutSession(
      userId,
      user.email,
      successUrl,
      cancelUrl
    );

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Erreur création session checkout:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création de la session de paiement',
      error: error.message 
    });
  }
});

// Route pour créer une session du portail client
router.post('/create-portal-session', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ 
        message: 'Aucun compte client Stripe trouvé' 
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = `${frontendUrl}/premium`;

    const session = await stripeService.createCustomerPortalSession(
      user.stripeCustomerId,
      returnUrl
    );

    res.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('Erreur création portail client:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création du portail client',
      error: error.message 
    });
  }
});

// Route pour récupérer les informations d'abonnement
router.get('/subscription-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const subscriptionInfo = {
      hasPremium: user.hasRole('premium'),
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripeSubscriptionStatus: user.stripeSubscriptionStatus,
      premiumExpiresAt: user.premiumExpiresAt,
      premiumGrantedAt: user.premiumGrantedAt,
      premiumHistory: user.premiumHistory
    };

    // Si l'utilisateur a un customer ID Stripe, récupérer les détails
    if (user.stripeCustomerId) {
      try {
        const subscriptions = await stripeService.getCustomerSubscriptions(user.stripeCustomerId);
        subscriptionInfo.stripeSubscriptions = subscriptions.data;
      } catch (error) {
        console.error('Erreur récupération abonnements Stripe:', error);
        // Continue sans les détails Stripe
      }
    }

    res.json({
      success: true,
      subscription: subscriptionInfo
    });

  } catch (error) {
    console.error('Erreur récupération infos abonnement:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des informations d\'abonnement',
      error: error.message 
    });
  }
});

// Route pour annuler un abonnement
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({ 
        message: 'Aucun abonnement actif trouvé' 
      });
    }

    // Annuler l'abonnement à la fin de la période
    const subscription = await stripeService.cancelSubscription(user.stripeSubscriptionId);

    res.json({
      success: true,
      message: 'Abonnement annulé. Il restera actif jusqu\'à la fin de la période de facturation.',
      subscription: subscription
    });

  } catch (error) {
    console.error('Erreur annulation abonnement:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'annulation de l\'abonnement',
      error: error.message 
    });
  }
});

// Route pour vérifier une session de checkout réussie
router.get('/verify-session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    // Cette route sera utilisée après redirection de Stripe
    // Les détails seront mis à jour via webhook, mais on peut vérifier ici
    const user = await User.findById(userId);
    
    res.json({
      success: true,
      message: 'Session vérifiée avec succès',
      hasPremium: user.hasRole('premium'),
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Erreur vérification session:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la vérification de la session',
      error: error.message 
    });
  }
});

module.exports = router;