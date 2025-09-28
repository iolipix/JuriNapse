/**
 * Script simple pour vérifier la configuration Stripe et générer les infos nécessaires
 */
require('dotenv').config({ path: './backend/config/.env' });

console.log('🔧 Vérification de la configuration Stripe\n');

// Vérifier les variables d'environnement Stripe
const requiredVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY', 
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PREMIUM_LOOKUP_KEY'
];

console.log('📋 Variables d\'environnement Stripe:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Masquer une partie de la clé pour la sécurité
    const maskedValue = varName.includes('SECRET') 
      ? value.substring(0, 12) + '...' + value.substring(value.length - 4)
      : value;
    console.log(`✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`❌ ${varName}: Non définie`);
  }
});

console.log('\n🌐 Configuration du webhook Stripe:');
console.log('URL du webhook à configurer dans Stripe Dashboard:');
console.log('https://jurinapse.railway.app/api/stripe/webhook');
console.log('');
console.log('Événements à écouter:');
console.log('- checkout.session.completed');
console.log('- customer.subscription.created');  
console.log('- customer.subscription.updated');
console.log('- customer.subscription.deleted');
console.log('- invoice.payment_succeeded');
console.log('- invoice.payment_failed');

console.log('\n🔍 Pour diagnostiquer le problème:');
console.log('1. Vérifiez que l\'URL webhook est configurée dans Stripe Dashboard');
console.log('2. Testez un paiement et vérifiez les logs Railway');
console.log('3. Dans Stripe Dashboard, allez dans Webhooks > Votre webhook > Essayer');
console.log('4. Vérifiez que STRIPE_WEBHOOK_SECRET correspond au webhook configuré');

console.log('\n💡 Commandes utiles:');
console.log('- Voir logs Railway: railway logs --follow');
console.log('- Test webhook manuel: Stripe Dashboard > Webhooks > [votre webhook] > Essayer');

// Tester si Stripe fonctionne
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripe() {
  try {
    console.log('\n🧪 Test de connexion Stripe...');
    
    // Tester la connexion Stripe
    const balance = await stripe.balance.retrieve();
    console.log('✅ Connexion Stripe OK');
    
    // Vérifier si le lookup_key existe
    if (process.env.STRIPE_PREMIUM_LOOKUP_KEY) {
      const prices = await stripe.prices.list({
        lookup_keys: [process.env.STRIPE_PREMIUM_LOOKUP_KEY],
        limit: 1
      });
      
      if (prices.data.length > 0) {
        console.log(`✅ Prix Premium trouvé: ${prices.data[0].id} (${prices.data[0].unit_amount / 100} ${prices.data[0].currency})`);
      } else {
        console.log(`❌ Aucun prix trouvé pour lookup_key: ${process.env.STRIPE_PREMIUM_LOOKUP_KEY}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Erreur Stripe: ${error.message}`);
  }
}

testStripe().then(() => {
  console.log('\n🎯 Prochaines étapes:');
  console.log('1. Faites un test de paiement sur votre site');
  console.log('2. Surveillez les logs pendant le paiement');
  console.log('3. Regardez dans Stripe Dashboard si les webhooks arrivent');
  process.exit(0);
});