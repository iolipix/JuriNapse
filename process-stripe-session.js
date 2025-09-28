/**
 * Script pour récupérer une session Stripe et appliquer le premium manuellement
 * Utile pour tester en attendant la configuration des webhooks
 */

require('dotenv').config({ path: './config/.env' });
const mongoose = require('mongoose');
const User = require('./models/user.model');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function processStripeSession(sessionId) {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`🔍 Récupération de la session Stripe : ${sessionId}`);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });
    
    console.log('📋 Détails de la session :');
    console.log(`   - Status: ${session.payment_status}`);
    console.log(`   - Customer: ${session.customer.email}`);
    console.log(`   - Amount: ${session.amount_total / 100}€`);
    console.log(`   - Subscription: ${session.subscription?.id}`);
    
    if (session.payment_status !== 'paid') {
      console.log('❌ Paiement non confirmé');
      return;
    }
    
    // Trouver l'utilisateur
    const userEmail = session.customer.email;
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`❌ Utilisateur non trouvé : ${userEmail}`);
      return;
    }
    
    console.log(`👤 Utilisateur trouvé : ${user.username} (${user.email})`);
    
    // Appliquer le premium
    await user.grantPremium('Abonnement Stripe confirmé manuellement');
    
    // Mettre à jour les données Stripe
    user.stripeCustomerId = session.customer.id;
    user.stripeSubscriptionId = session.subscription?.id;
    user.stripeSubscriptionStatus = 'active';
    await user.save();
    
    console.log('✅ Statut premium appliqué avec succès !');
    console.log(`🎯 Premium actif jusqu'au : ${user.premiumExpiresAt}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion fermée');
  }
}

// Utilisation : node process-stripe-session.js cs_test_xxxxx
const sessionId = process.argv[2];

if (!sessionId) {
  console.log('Usage: node process-stripe-session.js cs_test_xxxxx');
  console.log('Exemple: node process-stripe-session.js cs_test_b12eZE5z4e7PYPqPbmF4Wgcv6MVIIZjwl16QKArTuCjiCaHToItC13bDOj');
  process.exit(1);
}

processStripeSession(sessionId);