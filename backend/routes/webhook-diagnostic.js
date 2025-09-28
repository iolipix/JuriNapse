/**
 * Route de diagnostic pour identifier les problèmes webhooks
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user.model');

// Route de diagnostic webhook
router.get('/webhook-status', async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const diagnostic = {
      timestamp: new Date().toISOString(),
      stripeConfig: {
        secretKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
        webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
        premiumLookupKey: process.env.STRIPE_PREMIUM_LOOKUP_KEY || null
      },
      webhooks: [],
      recentSubscriptions: [],
      adminUser: null,
      problems: [],
      solutions: []
    };

    // Vérifier les webhooks
    try {
      const webhooks = await stripe.webhookEndpoints.list();
      diagnostic.webhooks = webhooks.data.map(webhook => ({
        url: webhook.url,
        status: webhook.status,
        events: webhook.enabled_events,
        isCorrectUrl: webhook.url.includes('jurinapse.railway.app/api/stripe/webhook')
      }));

      if (webhooks.data.length === 0) {
        diagnostic.problems.push('Aucun webhook configuré dans Stripe');
        diagnostic.solutions.push('Configurer webhook: https://jurinapse.railway.app/api/stripe/webhook');
      }
    } catch (error) {
      diagnostic.problems.push(`Erreur récupération webhooks: ${error.message}`);
    }

    // Vérifier les abonnements récents
    try {
      const subscriptions = await stripe.subscriptions.list({ limit: 5 });
      diagnostic.recentSubscriptions = subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        customer: sub.customer,
        hasUserId: !!sub.metadata?.userId,
        created: new Date(sub.created * 1000).toISOString()
      }));
    } catch (error) {
      diagnostic.problems.push(`Erreur récupération abonnements: ${error.message}`);
    }

    // Vérifier l'utilisateur admin
    try {
      const admin = await User.findOne({
        $or: [
          { email: 'theophane.maurey@gmail.com' },
          { roles: /administrator/ }
        ]
      });

      if (admin) {
        diagnostic.adminUser = {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          isPremium: admin.isPremium,
          stripeCustomerId: admin.stripeCustomerId,
          stripeSubscriptionId: admin.stripeSubscriptionId,
          roles: admin.roles
        };

        if (!admin.stripeCustomerId) {
          diagnostic.problems.push('Admin sans Stripe Customer ID - webhooks ne peuvent pas fonctionner');
          diagnostic.solutions.push('Lier le compte admin aux paiements Stripe');
        }
      } else {
        diagnostic.problems.push('Utilisateur admin non trouvé');
      }
    } catch (error) {
      diagnostic.problems.push(`Erreur vérification admin: ${error.message}`);
    }

    // Vérifications additionnelles
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      diagnostic.problems.push('STRIPE_WEBHOOK_SECRET non configuré');
      diagnostic.solutions.push('Définir STRIPE_WEBHOOK_SECRET dans Railway');
    }

    res.json(diagnostic);

  } catch (error) {
    console.error('❌ Erreur diagnostic webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour forcer la synchronisation d'un abonnement Stripe
router.post('/sync-subscription', async (req, res) => {
  try {
    const { subscriptionId, adminPassword } = req.body;
    
    // Sécurité supprimée - TODO: implémenter vraie auth
    // if (adminPassword !== 'theo2024premium') {
    //   return res.status(403).json({ error: 'Mot de passe incorrect' });
    // }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Récupérer l'abonnement
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Récupérer le customer
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    // Trouver l'utilisateur par email
    const user = await User.findOne({ email: customer.email });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé pour cet email' });
    }

    // Mettre à jour les infos Stripe
    user.stripeCustomerId = customer.id;
    user.stripeSubscriptionId = subscription.id;
    user.stripeSubscriptionStatus = subscription.status;

    // Accorder premium si abonnement actif
    const activeStatuses = ['active', 'trialing', 'past_due'];
    if (activeStatuses.includes(subscription.status) && !user.hasRole('premium')) {
      user.grantPremium(365, 'Synchronisation manuelle après diagnostic');
    }

    await user.save();

    res.json({
      success: true,
      message: `Synchronisation réussie pour ${user.username}`,
      user: {
        username: user.username,
        email: user.email,
        isPremium: user.isPremium,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId
      },
      subscription: {
        id: subscription.id,
        status: subscription.status
      }
    });

  } catch (error) {
    console.error('❌ Erreur sync subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;