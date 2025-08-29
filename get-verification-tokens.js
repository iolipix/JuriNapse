// Obtenir le token de vérification d'un utilisateur pour test
require('dotenv').config({ path: './backend/config/.env' });
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur MongoDB:', error);
    process.exit(1);
  }
};

const User = require('./backend/models/user.model');
const EmailVerification = require('./backend/models/emailVerification.model');

const getVerificationToken = async () => {
  await connectDB();
  
  try {
    console.log('🔍 Recherche d\'utilisateurs non vérifiés...');
    
    const users = await User.find({ isVerified: false }).limit(5);
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur non vérifié trouvé');
      console.log('💡 Inscrivez-vous sur www.jurinapse.com d\'abord');
      return;
    }
    
    console.log(`\n📋 ${users.length} utilisateur(s) non vérifié(s) trouvé(s):`);
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const verification = await EmailVerification.findOne({ userId: user._id });
      
      console.log(`\n👤 Utilisateur ${i + 1}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user._id}`);
      
      if (verification) {
        const verificationUrl = `https://www.jurinapse.com/verify-email.html?token=${verification.token}`;
        console.log(`   ✅ Token: ${verification.token}`);
        console.log(`   🔗 URL complète: ${verificationUrl}`);
        console.log(`   📅 Expire: ${verification.expiresAt}`);
      } else {
        console.log(`   ❌ Aucun token de vérification trouvé`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');
  }
};

getVerificationToken();
