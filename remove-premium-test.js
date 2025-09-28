/**
 * Script pour retirer temporairement le statut premium à un utilisateur
 * Utile pour tester le flux d'abonnement
 */

require('dotenv').config({ path: './config/.env' });
const mongoose = require('mongoose');
const User = require('./models/user.model');

async function removeUserPremium(userEmail) {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`🔍 Recherche de l'utilisateur : ${userEmail}`);
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('📋 Statut actuel :');
    console.log(`   - Rôles: ${user.roles}`);
    console.log(`   - Premium jusqu'au: ${user.premiumExpiresAt}`);
    console.log(`   - Stripe ID: ${user.stripeCustomerId}`);
    
    // Retirer le statut premium temporairement
    await user.revokePremium('Test flux d\'abonnement Stripe');
    
    console.log('✅ Statut premium retiré temporairement !');
    console.log('🧪 Vous pouvez maintenant tester le flux d\'abonnement');
    console.log('🔄 Pour restaurer : utilisez le script restore-premium.js');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Utilisation : node remove-premium-test.js votre@email.com
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('Usage: node remove-premium-test.js votre@email.com');
  process.exit(1);
}

removeUserPremium(userEmail);