const mongoose = require('mongoose');
require('dotenv').config();

// Connecter à MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Schéma utilisateur simplifié
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  role: {
    type: String,
    enum: ['user', 'moderator', 'administrator'],
    default: 'user'
  },
  roles: {
    type: [String],
    enum: ['user', 'moderator', 'administrator', 'premium'],
    default: ['user']
  }
});

const User = mongoose.model('User', userSchema);

const migrateUsers = async () => {
  try {
    console.log('🔄 Début de la migration vers le système de rôles multiples...');
    
    // Trouver tous les utilisateurs qui n'ont pas encore de champ roles
    const usersToMigrate = await User.find({
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } }
      ]
    });
    
    console.log(`📊 ${usersToMigrate.length} utilisateurs à migrer`);
    
    let migratedCount = 0;
    
    for (const user of usersToMigrate) {
      // Convertir le rôle simple en tableau de rôles
      const currentRole = user.role || 'user';
      
      // Initialiser avec le rôle de base 'user'
      let newRoles = ['user'];
      
      // Ajouter les rôles supplémentaires selon le rôle actuel
      if (currentRole === 'moderator') {
        newRoles.push('moderator');
      } else if (currentRole === 'administrator') {
        newRoles.push('moderator', 'administrator');
      }
      
      // Mettre à jour l'utilisateur
      user.roles = newRoles;
      await user.save();
      
      console.log(`✅ ${user.username} (${user.email}) migré: ${currentRole} -> [${newRoles.join(', ')}]`);
      migratedCount++;
    }
    
    console.log(`🎉 Migration terminée! ${migratedCount} utilisateurs migrés`);
    
    // Afficher les statistiques
    const stats = await User.aggregate([
      { $unwind: '$roles' },
      { $group: { _id: '$roles', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📈 Statistiques des rôles après migration:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} utilisateurs`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
};

const addAdminRole = async (username) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`❌ Utilisateur ${username} non trouvé`);
      return;
    }
    
    if (!user.roles) user.roles = ['user'];
    
    if (!user.roles.includes('administrator')) {
      user.roles.push('administrator');
      user.role = 'administrator';
      await user.save();
      console.log(`✅ Rôle administrateur ajouté à ${username}. Rôles: [${user.roles.join(', ')}]`);
    } else {
      console.log(`ℹ️ ${username} est déjà administrateur`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du rôle admin:', error);
  }
};

const main = async () => {
  await connectDB();
  
  const action = process.argv[2];
  
  if (action === 'migrate') {
    await migrateUsers();
  } else if (action === 'add-admin') {
    const username = process.argv[3];
    if (!username) {
      console.log('Usage: node migrate-to-multiple-roles.js add-admin <username>');
      process.exit(1);
    }
    await addAdminRole(username);
  } else {
    console.log('Usage:');
    console.log('  node migrate-to-multiple-roles.js migrate - Migrer tous les utilisateurs');
    console.log('  node migrate-to-multiple-roles.js add-admin <username> - Ajouter le rôle admin à un utilisateur');
  }
  
  mongoose.connection.close();
};

main().catch(console.error);
