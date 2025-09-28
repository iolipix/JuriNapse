// Script pour analyser le paiement spécifique qui n'a pas accordé le premium
const User = require('./backend/models/user.model');
require('dotenv').config({ path: './config/.env' });

const userId = '68b25c61a298353484294248';

async function analyzePayment() {
  try {
    console.log('🔍 Analyse du paiement spécifique...');
    console.log('UserID du paiement:', userId);
    
    // 1. Vérifier l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ Utilisateur introuvable dans la base !');
      return;
    }
    
    console.log('\n👤 Utilisateur trouvé:');
    console.log('- Email:', user.email);
    console.log('- Roles:', user.roles);
    console.log('- Premium actuel:', user.isPremium());
    console.log('- Premium expires:', user.premiumExpiresAt);
    console.log('- Premium granted:', user.premiumGrantedAt);
    console.log('- Stripe Customer ID:', user.stripeCustomerId);
    console.log('- Stripe Sub ID:', user.stripeSubscriptionId);
    
    // 2. Vérifier dans Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      console.log('\n💳 Recherche dans Stripe...');
      
      // Chercher les sessions de checkout récentes avec ce userId
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
        expand: ['data.subscription']
      });
      
      const userSessions = sessions.data.filter(session => 
        session.client_reference_id === userId
      );
      
      console.log(`📋 Sessions trouvées pour cet utilisateur: ${userSessions.length}`);
      
      userSessions.forEach((session, index) => {
        console.log(`\n💰 Session ${index + 1}:`);
        console.log('- ID:', session.id);
        console.log('- Status:', session.status);
        console.log('- Mode:', session.mode);
        console.log('- Email:', session.customer_email);
        console.log('- Created:', new Date(session.created * 1000).toLocaleString());
        console.log('- Subscription ID:', session.subscription);
        
        if (session.subscription) {
          console.log('- Subscription expanded:', !!session.subscription.id);
        }
      });
      
      // 3. Vérifier les abonnements
      if (user.stripeCustomerId) {
        console.log('\n📅 Abonnements du customer:');
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId
        });
        
        subscriptions.data.forEach(sub => {
          console.log(`- ${sub.id}: ${sub.status} (created: ${new Date(sub.created * 1000).toLocaleString()})`);
        });
      }
      
      // 4. Vérifier les événements webhook récents
      console.log('\n🔔 Événements webhook récents:');
      const events = await stripe.events.list({
        type: 'checkout.session.completed',
        limit: 20
      });
      
      const userEvents = events.data.filter(event => {
        const session = event.data.object;
        return session.client_reference_id === userId;
      });
      
      console.log(`📨 Événements webhook pour cet utilisateur: ${userEvents.length}`);
      
      userEvents.forEach((event, index) => {
        console.log(`\n⚡ Event ${index + 1}:`);
        console.log('- ID:', event.id);
        console.log('- Created:', new Date(event.created * 1000).toLocaleString());
        console.log('- Type:', event.type);
        console.log('- Livemode:', event.livemode);
        
        const session = event.data.object;
        console.log('- Session ID:', session.id);
        console.log('- Session Status:', session.status);
        console.log('- Mode:', session.mode);
      });
    }
    
    console.log('\n✅ Analyse terminée !');
    
    // 5. SOLUTION TEMPORAIRE - forcer le premium pour ce user
    console.log('\n🔧 Application du premium manuellement...');
    if (!user.isPremium()) {
      user.grantPremium(365, 'Fix manuel - webhook défaillant');
      await user.save();
      console.log('✅ Premium accordé pour 1 an !');
    } else {
      console.log('ℹ️  Premium déjà présent');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

analyzePayment();