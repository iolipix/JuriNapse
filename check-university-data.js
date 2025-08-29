const mongoose = require('mongoose');
require('dotenv').config();

// Schéma utilisateur minimal pour le test
const userSchema = new mongoose.Schema({
  username: String,
  firstName: String,
  lastName: String,
  isStudent: Boolean,
  university: String,
  email: String
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

const checkUniversityData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connecté à MongoDB');

    // Chercher tous les étudiants
    const students = await User.find({ isStudent: true }).select('username firstName lastName university isStudent');
    
    console.log('\n📊 ANALYSE DES ÉTUDIANTS:');
    console.log(`Total d'étudiants trouvés: ${students.length}`);
    
    let studentsWithUniversity = 0;
    let studentsWithEmptyUniversity = 0;
    let studentsWithUndefinedUniversity = 0;
    
    students.forEach((student, index) => {
      console.log(`\n${index + 1}. 👤 ${student.firstName} ${student.lastName} (@${student.username})`);
      console.log(`   🎓 isStudent: ${student.isStudent}`);
      console.log(`   🏫 university type: ${typeof student.university}`);
      console.log(`   🏫 university value: "${student.university}"`);
      console.log(`   🏫 university length: ${student.university ? student.university.length : 'N/A'}`);
      
      if (student.university === undefined || student.university === null) {
        studentsWithUndefinedUniversity++;
        console.log(`   ❌ Université: NON DÉFINIE`);
      } else if (student.university === '') {
        studentsWithEmptyUniversity++;
        console.log(`   ⚠️  Université: CHAÎNE VIDE`);
      } else {
        studentsWithUniversity++;
        console.log(`   ✅ Université: ${student.university}`);
        console.log(`   🌆 Ville après regex: ${student.university.replace(/^Université de\s+/i, '')}`);
      }
    });
    
    console.log('\n📈 STATISTIQUES:');
    console.log(`✅ Étudiants avec université: ${studentsWithUniversity}`);
    console.log(`⚠️  Étudiants avec université vide: ${studentsWithEmptyUniversity}`);
    console.log(`❌ Étudiants avec université undefined/null: ${studentsWithUndefinedUniversity}`);
    
    // Test spécifique sur un utilisateur si donné
    if (process.argv[2]) {
      const username = process.argv[2];
      console.log(`\n🔍 TEST SPÉCIFIQUE pour @${username}:`);
      const specificUser = await User.findOne({ username }).select('username firstName lastName university isStudent');
      
      if (specificUser) {
        console.log(`👤 Utilisateur: ${specificUser.firstName} ${specificUser.lastName}`);
        console.log(`🎓 isStudent: ${specificUser.isStudent}`);
        console.log(`🏫 university: "${specificUser.university}"`);
        console.log(`🏫 university type: ${typeof specificUser.university}`);
        console.log(`🏫 university == '': ${specificUser.university === ''}`);
        console.log(`🏫 university trim: "${specificUser.university ? specificUser.university.trim() : 'N/A'}"`);
        console.log(`🏫 condition actuelle: ${specificUser.university && specificUser.university.trim() !== ''}`);
      } else {
        console.log(`❌ Utilisateur @${username} non trouvé`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
};

checkUniversityData();
