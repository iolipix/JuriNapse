/**
 * Script de correction automatique pour synchroniser les abonnements Stripe existants
 */

const User = require('./backend/models/user.model');
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/config/.env' });

async function fixStripeSync() {
  try {
    console.log('🔄 SYNCHRONISATION AUTOMATIQUE STRIPE-APP\n');
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // 1. Connecter à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // 2. Trouver Théophane
    const theo = await User.findOne({
      $or: [
        { email: 'theophane.maurey@gmail.com' },
        { roles: /administrator/ }
      ]
    });
    
    if (!theo) {
      console.log('❌ Théophane non trouvé');
      return;
    }
    
    console.log(`👤 Admin trouvé: ${theo.username} (${theo.email})`);
    console.log(`👑 Premium actuel: ${theo.isPremium ? 'OUI' : 'NON'}`);
    
    // 3. Chercher son customer Stripe par email
    let stripeCustomer = null;
    
    if (theo.stripeCustomerId) {
      try {
        stripeCustomer = await stripe.customers.retrieve(theo.stripeCustomerId);
        console.log(`✅ Customer Stripe existant trouvé: ${stripeCustomer.id}`);
      } catch (error) {
        console.log(`⚠️ Customer ID sauvé invalide: ${theo.stripeCustomerId}`);
      }
    }
    
    if (!stripeCustomer) {
      // Chercher par email
      const customers = await stripe.customers.list({
        email: theo.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        stripeCustomer = customers.data[0];
        console.log(`✅ Customer Stripe trouvé par email: ${stripeCustomer.id}`);
        
        // Mettre à jour l'ID customer
        theo.stripeCustomerId = stripeCustomer.id;
        await theo.save();
        console.log(`💾 Customer ID sauvé dans l'app`);
      }
    }
    
    if (!stripeCustomer) {
      console.log('❌ Aucun customer Stripe trouvé');
      return;
    }
    
    // 4. Chercher ses abonnements
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomer.id,
      limit: 10
    });
    
    console.log(`\n💳 Abonnements trouvés: ${subscriptions.data.length}`);
    
    let activeSubscription = null;
    
    subscriptions.data.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.id} - Statut: ${sub.status}`);
      console.log(`   Créé: ${new Date(sub.created * 1000).toLocaleString()}`);
      console.log(`   Prix: ${sub.items.data[0]?.price?.unit_amount / 100}€`);
      
      if (['active', 'trialing', 'past_due'].includes(sub.status) && !activeSubscription) {
        activeSubscription = sub;
      }
    });
    
    // 5. Synchroniser avec l'app
    if (activeSubscription) {
      console.log(`\n🎯 Synchronisation avec abonnement actif: ${activeSubscription.id}`);
      
      // Mettre à jour les infos Stripe
      theo.stripeSubscriptionId = activeSubscription.id;
      theo.stripeSubscriptionStatus = activeSubscription.status;
      
      // Accorder premium s'il ne l'a pas
      if (!theo.hasRole('premium')) {
        theo.grantPremium(365, 'Synchronisation automatique - abonnement Stripe existant');
        console.log(`🎉 Premium accordé automatiquement !`);
      } else {
        console.log(`✅ Premium déjà présent - synchronisation info Stripe seulement`);
      }
      
      await theo.save();
      
      console.log(`\n✅ SYNCHRONISATION TERMINÉE`);
      console.log(`👤 Utilisateur: ${theo.username}`);
      console.log(`👑 Premium: ${theo.isPremium ? 'OUI' : 'NON'}`);
      console.log(`💳 Customer ID: ${theo.stripeCustomerId}`);
      console.log(`🔑 Subscription ID: ${theo.stripeSubscriptionId}`);
      console.log(`📊 Statut: ${theo.stripeSubscriptionStatus}`);
      
    } else {
      console.log('\n⚠️ Aucun abonnement actif trouvé');
      console.log('Les abonnements sont peut-être expirés ou annulés');
    }
    
    // 6. Instructions pour réparer les webhooks
    console.log(`\n🔧 POUR RÉPARER LES WEBHOOKS:`);
    console.log(`1. Va sur: https://dashboard.stripe.com/webhooks`);
    console.log(`2. Ajoute/vérifie l'endpoint: https://jurinapse.railway.app/api/stripe/webhook`);
    console.log(`3. Événements requis:`);
    console.log(`   - checkout.session.completed`);
    console.log(`   - customer.subscription.created`);
    console.log(`   - customer.subscription.updated`);
    console.log(`   - customer.subscription.deleted`);
    console.log(`   - invoice.payment_succeeded`);
    console.log(`4. Copie le "Signing secret" et mets-le dans STRIPE_WEBHOOK_SECRET sur Railway`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

fixStripeSync();