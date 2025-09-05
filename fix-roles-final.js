// Script de nettoyage simple et rapide - à exécuter une seule fois
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/config/.env' });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function cleanupRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à la base de données');

    // 1. Supprimer complètement le champ roles de tous les utilisateurs
    const removeRolesResult = await User.updateMany(
      { roles: { $exists: true } },
      { $unset: { roles: 1 } }
    );
    console.log(`🗑️ Supprimé le champ 'roles' de ${removeRolesResult.modifiedCount} utilisateurs`);

    // 2. Corriger theophane_mry
    const theophaneResult = await User.updateOne(
      { $or: [{ username: 'theophane_mry' }, { email: 'theophane.mourry@gmail.com' }] },
      { role: 'user;premium;moderator;administrator' }
    );
    console.log(`👑 Theophane corrigé: ${theophaneResult.modifiedCount} utilisateur(s)`);

    // 3. Corriger Manon
    const manonResult = await User.updateOne(
      { username: 'Manon' },
      { role: 'user;premium;moderator' }
    );
    console.log(`👩‍💼 Manon corrigée: ${manonResult.modifiedCount} utilisateur(s)`);

    // 4. S'assurer que tous les autres utilisateurs ont au minimum "user"
    const fixOthersResult = await User.updateMany(
      { 
        $or: [
          { role: { $exists: false } },
          { role: '' },
          { role: null },
          { role: { $not: /^user/ } } // Ne commence pas par "user"
        ]
      },
      { role: 'user' }
    );
    console.log(`👤 Utilisateurs basiques corrigés: ${fixOthersResult.modifiedCount}`);

    // 5. Vérification finale
    const allUsers = await User.find({}, 'username email role').limit(20);
    console.log('\n📊 État final (premiers 20 utilisateurs):');
    allUsers.forEach(user => {
      console.log(`   ${user.username || 'Sans nom'}: "${user.role}"`);
    });

    console.log('\n✅ Nettoyage terminé avec succès !');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

cleanupRoles();
