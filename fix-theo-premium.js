/**
 * Script pour diagnostiquer et corriger manuellement le premium de Théophane
 */

const User = require('./backend/models/user.model');
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/config/.env' });

async function checkAndFixTheoPremium() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connecté à MongoDB\n');

    // Chercher Théophane
    const theo = await User.findOne({ 
      $or: [
        { username: /theo/i },
        { email: /theo/i },
        { roles: /administrator/ }
      ]
    }).limit(1);

    if (!theo) {
      console.log('❌ Théophane non trouvé');
      return;
    }

    console.log(`👤 Utilisateur trouvé: ${theo.username}`);
    console.log(`📧 Email: ${theo.email}`);
    console.log(`🎭 Rôles actuels: ${theo.roles}`);
    console.log(`👑 Premium: ${theo.isPremium ? 'OUI' : 'NON'}`);
    console.log(`💳 Stripe Customer ID: ${theo.stripeCustomerId || 'Non défini'}`);
    console.log(`🔑 Stripe Subscription ID: ${theo.stripeSubscriptionId || 'Non défini'}`);
    console.log(`📊 Statut abonnement: ${theo.stripeSubscriptionStatus || 'Non défini'}`);

    // Vérifier l'historique premium
    if (theo.premiumHistory && theo.premiumHistory.length > 0) {
      console.log('\n📜 Historique Premium:');
      theo.premiumHistory.slice(-3).forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.action} - ${entry.date} - Durée: ${entry.duration || 'N/A'} jours`);
      });
    } else {
      console.log('\n📜 Aucun historique premium trouvé');
    }

    // Ajouter premium manuellement
    if (!theo.hasRole('premium')) {
      console.log('\n🔧 Ajout du premium manuellement...');
      theo.grantPremium(30, 'Manuel - correction bug webhook'); 
      await theo.save();
      console.log('✅ Premium accordé manuellement !');
      
      // Vérifier
      const updatedTheo = await User.findById(theo._id);
      console.log(`🎉 Nouveau statut: ${updatedTheo.roles}`);
      console.log(`👑 Premium: ${updatedTheo.isPremium ? 'OUI' : 'NON'}`);
    } else {
      console.log('\n✅ Théophane a déjà premium');
    }

    console.log('\n💡 Pour diagnostiquer pourquoi le webhook n\'a pas marché:');
    console.log('1. Vérifiez les logs Railway après paiement');
    console.log('2. Allez dans Stripe Dashboard > Webhooks pour voir les tentatives');
    console.log('3. Vérifiez que l\'URL webhook pointe bien vers: https://jurinapse.railway.app/api/stripe/webhook');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

checkAndFixTheoPremium();