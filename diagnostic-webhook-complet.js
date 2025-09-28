/**
 * Script de diagnostic complet pour les webhooks Stripe
 */

const User = require('./backend/models/user.model');
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/config/.env' });

async function diagnosticWebhookProblem() {
  try {
    console.log('🔍 DIAGNOSTIC COMPLET DES WEBHOOKS STRIPE\n');
    
    // 1. Vérifier la configuration Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    console.log('📋 1. VÉRIFICATION CONFIGURATION STRIPE');
    console.log(`Secret Key: ${process.env.STRIPE_SECRET_KEY?.substring(0, 12)}...`);
    console.log(`Webhook Secret: ${process.env.STRIPE_WEBHOOK_SECRET ? 'Défini' : 'NON DÉFINI ❌'}`);
    console.log(`Premium Lookup Key: ${process.env.STRIPE_PREMIUM_LOOKUP_KEY || 'NON DÉFINI ❌'}\n`);
    
    // 2. Lister les webhooks configurés
    console.log('📡 2. WEBHOOKS CONFIGURÉS DANS STRIPE');
    const webhooks = await stripe.webhookEndpoints.list();
    
    if (webhooks.data.length === 0) {
      console.log('❌ PROBLÈME MAJEUR: Aucun webhook configuré dans Stripe !');
      console.log('📝 SOLUTION: Va dans Stripe Dashboard > Webhooks > Ajouter un endpoint');
      console.log('URL à configurer: https://jurinapse.railway.app/api/stripe/webhook');
      console.log('Événements: checkout.session.completed, customer.subscription.created, customer.subscription.updated\n');
    } else {
      webhooks.data.forEach((webhook, index) => {
        console.log(`${index + 1}. URL: ${webhook.url}`);
        console.log(`   Statut: ${webhook.status}`);
        console.log(`   Événements: ${webhook.enabled_events.join(', ')}`);
        
        // Vérifier si l'URL est correcte
        if (!webhook.url.includes('jurinapse.railway.app')) {
          console.log('   ⚠️  URL suspecte - devrait pointer vers jurinapse.railway.app');
        }
        if (!webhook.url.includes('/api/stripe/webhook')) {
          console.log('   ⚠️  URL incorrecte - devrait finir par /api/stripe/webhook');
        }
        console.log('');
      });
    }
    
    // 3. Vérifier les abonnements récents
    console.log('💳 3. ABONNEMENTS RÉCENTS (dernières 24h)');
    const subscriptions = await stripe.subscriptions.list({
      limit: 10,
      created: { gte: Math.floor((Date.now() - 24*60*60*1000) / 1000) }
    });
    
    if (subscriptions.data.length === 0) {
      console.log('❌ Aucun abonnement créé dans les dernières 24h');
    } else {
      for (const sub of subscriptions.data) {
        console.log(`Abonnement: ${sub.id}`);
        console.log(`  Statut: ${sub.status}`);
        console.log(`  Customer: ${sub.customer}`);
        console.log(`  Metadata userId: ${sub.metadata?.userId || 'MANQUANT ❌'}`);
        console.log(`  Créé: ${new Date(sub.created * 1000).toLocaleString()}`);
        
        // Vérifier le customer associé
        try {
          const customer = await stripe.customers.retrieve(sub.customer);
          console.log(`  Email customer: ${customer.email}`);
        } catch (e) {
          console.log(`  ❌ Erreur récupération customer: ${e.message}`);
        }
        console.log('');
      }
    }
    
    // 4. Connecter à MongoDB et vérifier utilisateurs
    console.log('🔌 4. CONNEXION MONGODB ET VÉRIFICATION UTILISATEURS');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    const theo = await User.findOne({
      $or: [
        { email: 'theophane.maurey@gmail.com' },
        { roles: /administrator/ }
      ]
    });
    
    if (!theo) {
      console.log('❌ Admin Théophane non trouvé dans la base');
    } else {
      console.log(`✅ Admin trouvé: ${theo.username}`);
      console.log(`📧 Email: ${theo.email}`);
      console.log(`🎭 Rôles: ${theo.roles}`);
      console.log(`👑 Premium: ${theo.isPremium ? 'OUI' : 'NON'}`);
      console.log(`💳 Stripe Customer: ${theo.stripeCustomerId || 'NON DÉFINI'}`);
      console.log(`🔑 Stripe Subscription: ${theo.stripeSubscriptionId || 'NON DÉFINI'}`);
    }
    
    // 5. Solutions recommandées
    console.log('\n🔧 5. SOLUTIONS RECOMMANDÉES:');
    
    if (webhooks.data.length === 0) {
      console.log('PRIORITÉ 1: Configurer le webhook dans Stripe Dashboard');
      console.log('- URL: https://jurinapse.railway.app/api/stripe/webhook');
      console.log('- Événements: checkout.session.completed, customer.subscription.*');
    }
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.log('PRIORITÉ 2: Définir STRIPE_WEBHOOK_SECRET dans Railway');
    }
    
    if (theo && !theo.stripeCustomerId && subscriptions.data.length > 0) {
      console.log('PRIORITÉ 3: Lier le compte Théophane aux abonnements Stripe');
    }
    
    console.log('\n✅ Diagnostic terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

diagnosticWebhookProblem();