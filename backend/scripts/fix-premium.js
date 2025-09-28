/**
 * Script simple à exécuter sur Railway pour accorder premium manuellement
 * Utilise ce script dans Railway Console ou comme job temporaire
 */

const User = require('./models/user.model');

async function fixTheoPremium() {
  try {
    // Chercher l'admin Théophane
    const theo = await User.findOne({ 
      roles: /administrator/
    });

    if (!theo) {
      console.log('❌ Admin non trouvé');
      return;
    }

    console.log(`👤 Admin trouvé: ${theo.username} (${theo.email})`);
    console.log(`🎭 Rôles actuels: ${theo.roles}`);
    console.log(`👑 Premium: ${theo.isPremium ? 'OUI' : 'NON'}`);

    // Ajouter premium s'il ne l'a pas
    if (!theo.hasRole('premium')) {
      theo.grantPremium(365, 'Manuel - correction après paiement Stripe'); // 1 an
      await theo.save();
      console.log('✅ Premium accordé pour 1 an !');
    } else {
      console.log('✅ A déjà premium');
    }

    // Vérifier le résultat
    const updated = await User.findById(theo._id);
    console.log(`🎉 Nouveaux rôles: ${updated.roles}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

module.exports = fixTheoPremium;

// Si c'est exécuté directement
if (require.main === module) {
  fixTheoPremium().then(() => {
    console.log('✅ Script terminé');
  });
}