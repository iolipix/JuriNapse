/**
 * Webhook Stripe pour traiter les événements d'abonnement
 */
const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripe.service');
const User = require('../models/user.model');

// Middleware pour traiter le raw body pour les webhooks Stripe
router.use(express.raw({ type: 'application/json' }));

router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  console.log('🔍 DEBUG Webhook - Signature reçue:', signature ? 'Présente' : 'Manquante');
  console.log('🔍 DEBUG Webhook - Body length:', req.body ? req.body.length : 'Pas de body');
  console.log('🔍 DEBUG Webhook - STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'Configuré' : 'Manquant');
  
  try {
    // Vérifier et construire l'événement
    const event = stripeService.constructWebhookEvent(req.body, signature);
    
    console.log(`📨 Webhook Stripe reçu: ${event.type}`);

    // Traiter l'événement selon son type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`⚠️  Événement Stripe non géré: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('❌ Erreur webhook Stripe:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

/**
 * Gérer la completion d'une session de checkout
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('🔍 SESSION DEBUG:', JSON.stringify({
      client_reference_id: session.client_reference_id,
      metadata: session.metadata,
      customer: session.customer,
      subscription: session.subscription,
      mode: session.mode
    }, null, 2));

    const userId = session.client_reference_id || session.metadata?.userId;
    
    if (!userId) {
      console.error('❌ User ID manquant dans la session checkout');
      console.error('Session complète:', JSON.stringify(session, null, 2));
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error(`❌ Utilisateur ${userId} non trouvé`);
      return;
    }

    // Mettre à jour l'ID client Stripe
    if (session.customer && !user.stripeCustomerId) {
      user.stripeCustomerId = session.customer;
      console.log(`💾 Customer ID Stripe sauvé: ${session.customer}`);
    }

    // Si c'est un abonnement ET qu'il n'y a pas d'essai, accorder le premium immédiatement
    if (session.subscription && session.mode === 'subscription') {
      // Récupérer les détails de l'abonnement
      const subscription = await stripeService.retrieveSubscription(session.subscription);
      if (subscription && subscription.status === 'active') {
        await updateUserSubscription(user, subscription, 'created');
        console.log(`🎉 Premium accordé immédiatement via checkout pour ${user.username}`);
      } else {
        console.log(`⏳ Abonnement en attente, statut: ${subscription?.status}`);
      }
    }

    await user.save();
    console.log(`✅ Session checkout complétée pour ${user.username}`);

  } catch (error) {
    console.error('❌ Erreur handleCheckoutSessionCompleted:', error);
  }
}

/**
 * Gérer la création d'un abonnement
 */
async function handleSubscriptionCreated(subscription) {
  try {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      // Essayer de trouver l'utilisateur par customer ID
      const user = await User.findOne({ stripeCustomerId: subscription.customer });
      if (user) {
        await updateUserSubscription(user, subscription, 'created');
      } else {
        console.error('❌ Impossible de trouver l\'utilisateur pour l\'abonnement');
      }
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error(`❌ Utilisateur ${userId} non trouvé`);
      return;
    }

    await updateUserSubscription(user, subscription, 'created');

  } catch (error) {
    console.error('❌ Erreur handleSubscriptionCreated:', error);
  }
}

/**
 * Gérer la mise à jour d'un abonnement
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    const user = await User.findOne({ 
      $or: [
        { stripeSubscriptionId: subscription.id },
        { stripeCustomerId: subscription.customer }
      ]
    });

    if (!user) {
      console.error(`❌ Utilisateur non trouvé pour l'abonnement ${subscription.id}`);
      return;
    }

    await updateUserSubscription(user, subscription, 'updated');

  } catch (error) {
    console.error('❌ Erreur handleSubscriptionUpdated:', error);
  }
}

/**
 * Gérer la suppression d'un abonnement
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });

    if (!user) {
      console.error(`❌ Utilisateur non trouvé pour l'abonnement supprimé ${subscription.id}`);
      return;
    }

    // Révoquer le premium avec historique
    user.revokePremium(null); // null = révoqué par Stripe/système
    user.stripeSubscriptionId = null;
    user.stripeSubscriptionStatus = 'canceled';

    await user.save();

    console.log(`✅ Premium révoqué pour ${user.username} - abonnement supprimé`);

  } catch (error) {
    console.error('❌ Erreur handleSubscriptionDeleted:', error);
  }
}

/**
 * Gérer le succès d'un paiement de facture
 */
async function handleInvoicePaymentSucceeded(invoice) {
  try {
    const user = await User.findOne({ stripeCustomerId: invoice.customer });

    if (!user) {
      console.log(`⚠️  Utilisateur non trouvé pour le paiement réussi (customer: ${invoice.customer})`);
      return;
    }

    console.log(`✅ Paiement réussi pour ${user.username} - montant: ${invoice.amount_paid / 100}€`);

    // Si ce n'est pas le premier paiement et que l'utilisateur n'a pas premium, le réactiver
    if (!user.hasRole('premium') && user.stripeSubscriptionId) {
      user.addRole('premium');
      // Note: L'historique sera géré par handleSubscriptionUpdated
      await user.save();
      console.log(`🔄 Premium réactivé pour ${user.username}`);
    }

  } catch (error) {
    console.error('❌ Erreur handleInvoicePaymentSucceeded:', error);
  }
}

/**
 * Gérer l'échec d'un paiement de facture
 */
async function handleInvoicePaymentFailed(invoice) {
  try {
    const user = await User.findOne({ stripeCustomerId: invoice.customer });

    if (!user) {
      console.log(`⚠️  Utilisateur non trouvé pour le paiement échoué (customer: ${invoice.customer})`);
      return;
    }

    console.log(`❌ Paiement échoué pour ${user.username} - montant: ${invoice.amount_due / 100}€`);

    // Noter dans l'historique si nécessaire, mais ne pas révoquer immédiatement
    // Stripe gère automatiquement les échecs de paiement avec des tentatives

  } catch (error) {
    console.error('❌ Erreur handleInvoicePaymentFailed:', error);
  }
}

/**
 * Mettre à jour les informations d'abonnement de l'utilisateur
 */
async function updateUserSubscription(user, subscription, action) {
  try {
    // Mettre à jour les informations Stripe
    user.stripeCustomerId = subscription.customer;
    user.stripeSubscriptionId = subscription.id;
    user.stripeSubscriptionStatus = subscription.status;

    // Gérer le premium selon le statut de l'abonnement
    const activeStatuses = ['active', 'trialing'];
    const shouldHavePremium = activeStatuses.includes(subscription.status);

    if (shouldHavePremium && !user.hasRole('premium')) {
      // Calculer la durée jusqu'à la prochaine facturation
      const now = new Date();
      const periodEnd = new Date(subscription.current_period_end * 1000);
      const durationInDays = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));

      // Accorder le premium avec l'historique
      user.grantPremium(durationInDays > 0 ? durationInDays : 30, null); // null = accordé par Stripe
      
      console.log(`✅ Premium accordé à ${user.username} via Stripe (${action}) - expire: ${periodEnd.toISOString()}`);
      
    } else if (!shouldHavePremium && user.hasRole('premium')) {
      // Révoquer le premium si l'abonnement n'est plus actif
      user.revokePremium(null); // null = révoqué par Stripe
      
      console.log(`❌ Premium révoqué pour ${user.username} - statut abonnement: ${subscription.status}`);
    }

    await user.save();

  } catch (error) {
    console.error('❌ Erreur updateUserSubscription:', error);
    throw error;
  }
}

module.exports = router;