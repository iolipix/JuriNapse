/**
 * Endpoint d'urgence pour synchroniser automatiquement Stripe
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user.model');

// Route d'urgence pour synchroniser Stripe automatiquement
router.post('/emergency-stripe-sync', async (req, res) => {
  try {
    const { adminPassword } = req.body;
    
    if (adminPassword !== 'theo2024premium') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Trouver l'admin
    const admin = await User.findOne({
      $or: [
        { email: 'theophane.maurey@gmail.com' },
        { roles: /administrator/ }
      ]
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin non trouvé' });
    }

    const result = {
      admin: {
        username: admin.username,
        email: admin.email,
        wasPremium: admin.isPremium,
        oldStripeCustomerId: admin.stripeCustomerId
      },
      stripeSync: {},
      actions: []
    };

    // Chercher customer Stripe
    let customer = null;
    
    if (admin.stripeCustomerId) {
      try {
        customer = await stripe.customers.retrieve(admin.stripeCustomerId);
        result.actions.push('Customer existant trouvé');
      } catch (error) {
        result.actions.push('Customer ID invalide - recherche par email');
      }
    }

    if (!customer) {
      const customers = await stripe.customers.list({
        email: admin.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        customer = customers.data[0];
        admin.stripeCustomerId = customer.id;
        result.actions.push('Customer trouvé par email et lié');
      }
    }

    if (!customer) {
      return res.json({
        success: false,
        message: 'Aucun customer Stripe trouvé pour cet email',
        result
      });
    }

    result.stripeSync.customerId = customer.id;

    // Chercher abonnements
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 10
    });

    result.stripeSync.subscriptionsFound = subscriptions.data.length;
    result.stripeSync.subscriptions = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      created: new Date(sub.created * 1000).toISOString()
    }));

    const activeSubscription = subscriptions.data.find(sub => 
      ['active', 'trialing', 'past_due'].includes(sub.status)
    );

    if (activeSubscription) {
      // Synchroniser
      admin.stripeSubscriptionId = activeSubscription.id;
      admin.stripeSubscriptionStatus = activeSubscription.status;
      
      result.stripeSync.activeSubscription = {
        id: activeSubscription.id,
        status: activeSubscription.status
      };

      if (!admin.hasRole('premium')) {
        admin.grantPremium(365, 'Emergency sync - active Stripe subscription found');
        result.actions.push('Premium accordé automatiquement');
      } else {
        result.actions.push('Premium déjà présent');
      }

      await admin.save();

      result.success = true;
      result.message = 'Synchronisation réussie';
      result.admin.isPremium = admin.isPremium;
      result.admin.stripeCustomerId = admin.stripeCustomerId;
      result.admin.stripeSubscriptionId = admin.stripeSubscriptionId;

    } else {
      result.success = false;
      result.message = 'Aucun abonnement actif trouvé';
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur emergency sync:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;