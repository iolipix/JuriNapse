const mongoose = require('mongoose');
require('dotenv').config();

// Connecter à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('❌ Erreur MongoDB:', error);
    process.exit(1);
  }
};

// Schéma utilisateur
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  role: String,
  roles: [String]
}, { strict: false });

const User = mongoose.model('User', userSchema);

const restoreAdminRights = async () => {
  try {
    console.log('🔧 Restauration des droits administrateur pour theophane_mry...');
    
    // Trouver l'utilisateur
    const user = await User.findOne({ 
      $or: [
        { username: 'theophane_mry' },
        { email: 'theophane.maurey@gmail.com' }
      ]
    });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log(`👤 Utilisateur trouvé: ${user.username} (${user.email})`);
    console.log(`📋 Rôle actuel: ${user.role}`);
    console.log(`🎯 Rôles actuels: ${JSON.stringify(user.roles)}`);
    
    // Forcer la mise à jour complète
    const updateResult = await User.updateOne(
      { _id: user._id },
      { 
        $set: {
          role: 'administrator',
          roles: ['user', 'administrator', 'moderator', 'premium']
        }
      }
    );
    
    console.log('📝 Résultat de la mise à jour:', updateResult);
    
    // Vérifier la mise à jour
    const updatedUser = await User.findById(user._id);
    console.log('\n✅ Vérification après mise à jour:');
    console.log(`  - ID: ${updatedUser._id}`);
    console.log(`  - Username: ${updatedUser.username}`);
    console.log(`  - Email: ${updatedUser.email}`);
    console.log(`  - Rôle principal: ${updatedUser.role}`);
    console.log(`  - Rôles multiples: ${JSON.stringify(updatedUser.roles)}`);
    
    // Test des rôles
    const hasAdmin = updatedUser.roles && updatedUser.roles.includes('administrator');
    const hasMod = updatedUser.roles && updatedUser.roles.includes('moderator');
    const hasPremium = updatedUser.roles && updatedUser.roles.includes('premium');
    
    console.log('\n🧪 Tests:');
    console.log(`  - Est administrateur: ${hasAdmin ? '✅' : '❌'}`);
    console.log(`  - Est modérateur: ${hasMod ? '✅' : '❌'}`);
    console.log(`  - Est premium: ${hasPremium ? '✅' : '❌'}`);
    console.log(`  - Rôle principal: ${updatedUser.role === 'administrator' ? '✅' : '❌'} administrator`);
    
    if (hasAdmin && hasMod && updatedUser.role === 'administrator') {
      console.log('\n🎉 SUCCÈS ! Vous devriez maintenant avoir accès aux deux onglets !');
      console.log('🔄 Reconnectez-vous ou rechargez la page pour voir les changements.');
    } else {
      console.log('\n⚠️ Quelque chose ne va pas, vérifiez manuellement en base.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
  }
};

const main = async () => {
  await connectDB();
  await restoreAdminRights();
  await mongoose.connection.close();
};

main().catch(console.error);
