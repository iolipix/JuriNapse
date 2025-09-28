/**
 * Script pour vérifier la configuration webhook Stripe
 */

require('dotenv').config({ path: './backend/config/.env' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkStripeWebhooks() {
  try {
    console.log('🔍 Vérification des webhooks Stripe...\n');

    // Lister tous les webhooks configurés
    const webhooks = await stripe.webhookEndpoints.list();
    
    if (webhooks.data.length === 0) {
      console.log('❌ Aucun webhook configuré dans Stripe !');
      console.log('Tu dois aller dans Stripe Dashboard > Webhooks > Ajouter un endpoint');
      console.log('URL: https://jurinapse.railway.app/api/stripe/webhook');
      return;
    }

    console.log('📡 Webhooks configurés:');
    webhooks.data.forEach((webhook, index) => {
      console.log(`\n${index + 1}. ${webhook.url}`);
      console.log(`   Statut: ${webhook.status}`);
      console.log(`   Événements: ${webhook.enabled_events.join(', ')}`);
      console.log(`   ID: ${webhook.id}`);
    });

    // Vérifier les événements récents sur le premier webhook
    if (webhooks.data.length > 0) {
      const webhookId = webhooks.data[0].id;
      console.log(`\n🔍 Vérification des tentatives récentes pour ${webhookId}...\n`);
      
      try {
        // Malheureusement l'API Stripe ne permet pas de lister les tentatives directement
        // Il faut aller dans le dashboard pour voir les logs
        console.log('💡 Pour voir les tentatives de webhook:');
        console.log('1. Allez sur https://dashboard.stripe.com/webhooks');
        console.log(`2. Cliquez sur votre webhook (${webhooks.data[0].url})`);
        console.log('3. Regardez l\'onglet "Tentatives" pour voir les logs récents');
        console.log('4. Cherchez des événements "checkout.session.completed" récents');
        
      } catch (error) {
        console.log('❌ Impossible de récupérer les tentatives webhook');
      }
    }

    // Vérifier les abonnements récents
    console.log('\n💳 Abonnements récents:');
    const subscriptions = await stripe.subscriptions.list({ limit: 5 });
    
    if (subscriptions.data.length === 0) {
      console.log('❌ Aucun abonnement trouvé');
    } else {
      subscriptions.data.forEach((sub, index) => {
        console.log(`${index + 1}. ${sub.id} - Statut: ${sub.status} - Customer: ${sub.customer}`);
        if (sub.metadata && sub.metadata.userId) {
          console.log(`   User ID: ${sub.metadata.userId}`);
        }
      });
    }

    // Vérifier les sessions de checkout récentes
    console.log('\n🛒 Sessions de checkout récentes:');
    const sessions = await stripe.checkout.sessions.list({ limit: 5 });
    
    if (sessions.data.length === 0) {
      console.log('❌ Aucune session de checkout trouvée');
    } else {
      sessions.data.forEach((session, index) => {
        console.log(`${index + 1}. ${session.id} - Statut: ${session.status} - Mode: ${session.mode}`);
        if (session.client_reference_id) {
          console.log(`   User ID: ${session.client_reference_id}`);
        }
        if (session.subscription) {
          console.log(`   Subscription: ${session.subscription}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

checkStripeWebhooks();