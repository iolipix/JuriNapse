/**
 * Route ultra-simple pour diagnostiquer et corriger le premium
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user.model');

// Route pour tester si les webhooks fonctionnent généralement
router.get('/test-webhook-system', async (req, res) => {
  try {
    const result = {
      timestamp: new Date().toISOString(),
      webhookSystemStatus: 'CHECKING',
      problems: [],
      solutions: [],
      stripeConfig: {},
      recentPayments: []
    };

    // 1. Vérifier la configuration Stripe
    result.stripeConfig = {
      secretKey: !!process.env.STRIPE_SECRET_KEY,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      premiumLookupKey: !!process.env.STRIPE_PREMIUM_LOOKUP_KEY
    };

    if (!process.env.STRIPE_SECRET_KEY) {
      result.problems.push('STRIPE_SECRET_KEY manquant');
      return res.json(result);
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // 2. Vérifier les webhooks configurés
    const webhooks = await stripe.webhookEndpoints.list();
    result.webhooksConfigured = webhooks.data.map(w => ({
      url: w.url,
      status: w.status,
      events: w.enabled_events,
      isCorrectUrl: w.url.includes('jurinapse.railway.app/api/stripe/webhook')
    }));

    if (webhooks.data.length === 0) {
      result.problems.push('Aucun webhook configuré dans Stripe Dashboard');
      result.solutions.push('Aller sur https://dashboard.stripe.com/webhooks');
      result.solutions.push('Ajouter endpoint: https://jurinapse.railway.app/api/stripe/webhook');
    }

    const correctWebhook = webhooks.data.find(w => w.url.includes('jurinapse.railway.app/api/stripe/webhook'));
    if (!correctWebhook) {
      result.problems.push('URL webhook incorrecte');
      result.solutions.push('Corriger URL vers: https://jurinapse.railway.app/api/stripe/webhook');
    }

    // 3. Vérifier les paiements récents (24h)
    const oneDayAgo = Math.floor((Date.now() - 24*60*60*1000) / 1000);
    const recentSessions = await stripe.checkout.sessions.list({
      created: { gte: oneDayAgo },
      limit: 10
    });

    result.recentPayments = recentSessions.data.map(session => ({
      id: session.id,
      status: session.status,
      mode: session.mode,
      email: session.customer_email,
      userId: session.client_reference_id,
      created: new Date(session.created * 1000).toISOString()
    }));

    // 4. Vérifier si des utilisateurs ont payé mais pas eu premium
    if (recentSessions.data.length > 0) {
      const usersWithRecentPayments = [];
      for (const session of recentSessions.data) {
        if (session.client_reference_id && session.status === 'complete') {
          const user = await User.findById(session.client_reference_id);
          if (user) {
            usersWithRecentPayments.push({
              userId: user._id,
              email: user.email,
              isPremium: user.isPremium(),
              sessionId: session.id,
              paymentStatus: session.status
            });
          }
        }
      }
      result.usersWithRecentPayments = usersWithRecentPayments;

      // Détecter les problèmes
      const paidButNoPremium = usersWithRecentPayments.filter(u => !u.isPremium);
      if (paidButNoPremium.length > 0) {
        result.problems.push(`${paidButNoPremium.length} utilisateurs ont payé mais n'ont pas premium`);
        result.solutions.push('Webhooks ne fonctionnent pas - vérifier configuration Stripe');
      }
    }

    result.webhookSystemStatus = result.problems.length === 0 ? 'OK' : 'PROBLEME';
    res.json(result);

  } catch (error) {
    console.error('❌ Erreur test-webhook-system:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour voir l'état général des webhooks
router.get('/webhook-health', async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      status: 'UNKNOWN',
      checks: {
        stripeConfig: false,
        webhookEndpoint: false,
        recentActivity: false
      },
      message: ''
    };

    // Check 1: Configuration Stripe
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
      health.checks.stripeConfig = true;
    }

    // Check 2: Webhook endpoint configuré
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const webhooks = await stripe.webhookEndpoints.list();
      
      const validWebhook = webhooks.data.find(w => 
        w.url.includes('jurinapse.railway.app/api/stripe/webhook') && w.status === 'enabled'
      );
      
      if (validWebhook) {
        health.checks.webhookEndpoint = true;
      }
    }

    // Check 3: Activité récente
    const recentUsers = await User.find({
      premiumGrantedAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
    }).limit(5);

    if (recentUsers.length > 0) {
      health.checks.recentActivity = true;
    }

    // Déterminer le statut global
    const allChecks = Object.values(health.checks);
    if (allChecks.every(check => check === true)) {
      health.status = 'HEALTHY';
      health.message = 'Système de webhooks fonctionne correctement';
    } else if (allChecks.some(check => check === true)) {
      health.status = 'DEGRADED';
      health.message = 'Certains composants du système webhook ont des problèmes';
    } else {
      health.status = 'DOWN';
      health.message = 'Système de webhooks non fonctionnel';
    }

    res.json(health);

  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

    // 2. Vérifier Stripe si configuré
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        result.debug.stripeConfigured = true;
        
        // Chercher ses abonnements
        if (admin.stripeCustomerId) {
          const subscriptions = await stripe.subscriptions.list({
            customer: admin.stripeCustomerId,
            limit: 5
          });
          
          result.debug.stripeSubscriptions = subscriptions.data.map(sub => ({
            id: sub.id,
            status: sub.status,
            created: new Date(sub.created * 1000).toISOString()
          }));

          const activeSubscription = subscriptions.data.find(sub => 
            ['active', 'trialing', 'past_due'].includes(sub.status)
          );

          if (activeSubscription) {
            result.debug.activeSubscriptionFound = activeSubscription.id;
            result.actions.push('Abonnement actif trouvé dans Stripe');
          }
        } else {
          // Chercher par email
          const customers = await stripe.customers.list({
            email: admin.email,
            limit: 1
          });
          
          if (customers.data.length > 0) {
            const customer = customers.data[0];
            admin.stripeCustomerId = customer.id;
            
            const subscriptions = await stripe.subscriptions.list({
              customer: customer.id,
              limit: 5
            });
            
            result.debug.customerFoundByEmail = customer.id;
            result.debug.stripeSubscriptions = subscriptions.data.map(sub => ({
              id: sub.id,
              status: sub.status,
              created: new Date(sub.created * 1000).toISOString()
            }));
            
            const activeSubscription = subscriptions.data.find(sub => 
              ['active', 'trialing', 'past_due'].includes(sub.status)
            );

            if (activeSubscription) {
              admin.stripeSubscriptionId = activeSubscription.id;
              admin.stripeSubscriptionStatus = activeSubscription.status;
              result.debug.activeSubscriptionFound = activeSubscription.id;
              result.actions.push('Customer et abonnement trouvés par email');
            }
          }
        }
      } catch (stripeError) {
        result.debug.stripeError = stripeError.message;
      }
    }

    // 3. FORCER le premium maintenant
    if (!admin.isPremium()) {
      admin.grantPremium(365, 'Correction manuelle - webhooks défaillants');
      result.actions.push('Premium accordé pour 1 an');
      result.success = true;
      result.message = 'Premium accordé avec succès !';
    } else {
      result.success = true;
      result.message = 'Premium déjà présent';
    }

    await admin.save();

    // Status final
    const updatedAdmin = await User.findById(admin._id);
    result.debug.finalStatus = {
      roles: updatedAdmin.roles,
      isPremium: updatedAdmin.isPremium(),
      premiumExpiresAt: updatedAdmin.premiumExpiresAt
    };

    return res.json(result);

  } catch (error) {
    console.error('❌ Erreur fix-premium-now:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route pour diagnostiquer les webhooks
router.get('/webhook-diagnostic', async (req, res) => {
  try {
    const diagnostic = {
      timestamp: new Date().toISOString(),
      environment: {
        stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
        webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        premiumLookupKey: process.env.STRIPE_PREMIUM_LOOKUP_KEY || null,
        nodeEnv: process.env.NODE_ENV || 'development'
      },
      webhookUrl: 'https://jurinapse.railway.app/api/stripe/webhook',
      problems: [],
      solutions: []
    };

    if (!process.env.STRIPE_SECRET_KEY) {
      diagnostic.problems.push('STRIPE_SECRET_KEY manquant');
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      diagnostic.problems.push('STRIPE_WEBHOOK_SECRET manquant');
      diagnostic.solutions.push('Ajouter STRIPE_WEBHOOK_SECRET dans Railway variables');
    }

    if (!process.env.STRIPE_PREMIUM_LOOKUP_KEY && !process.env.STRIPE_PREMIUM_PRICE_ID) {
      diagnostic.problems.push('Aucun prix premium configuré');
    }

    // Vérifier si l'endpoint webhook répond
    diagnostic.solutions.push('Vérifier que https://jurinapse.railway.app/api/stripe/webhook est configuré dans Stripe Dashboard');
    diagnostic.solutions.push('Événements requis: checkout.session.completed, customer.subscription.created, customer.subscription.updated');

    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const webhooks = await stripe.webhookEndpoints.list();
        
        diagnostic.stripeWebhooks = webhooks.data.map(webhook => ({
          url: webhook.url,
          status: webhook.status,
          events: webhook.enabled_events,
          isCorrect: webhook.url.includes('jurinapse.railway.app/api/stripe/webhook')
        }));

        const correctWebhook = webhooks.data.find(w => w.url.includes('jurinapse.railway.app'));
        if (!correctWebhook) {
          diagnostic.problems.push('Webhook URL pas configurée correctement dans Stripe');
          diagnostic.solutions.push('Ajouter webhook: https://jurinapse.railway.app/api/stripe/webhook');
        }
      } catch (error) {
        diagnostic.problems.push(`Erreur Stripe API: ${error.message}`);
      }
    }

    res.json(diagnostic);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;