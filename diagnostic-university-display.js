const mongoose = require('mongoose');

// Schema utilisateur basique pour le diagnostic
const userSchema = new mongoose.Schema({
  username: String,
  firstName: String,
  lastName: String,
  isStudent: Boolean,
  university: String,
  bio: String,
  joinedAt: Date,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function diagnosticUniversityDisplay() {
  try {
    console.log('🔍 Diagnostic de l\'affichage des universités...');
    
    // Récupérer tous les étudiants avec leurs universités
    const students = await User.find({ 
      isStudent: true,
      university: { $exists: true, $ne: null, $ne: '' }
    }).select('username firstName lastName isStudent university').limit(10);
    
    console.log(`\n📊 Trouvé ${students.length} étudiants avec université:`);
    
    for (const student of students) {
      console.log(`\n👤 ${student.firstName} ${student.lastName} (@${student.username})`);
      console.log(`   📚 isStudent: ${student.isStudent}`);
      console.log(`   🏫 university: "${student.university}"`);
      console.log(`   🔧 university après regex: "${student.university.replace(/^Université de\s+/i, '')}"`);
      console.log(`   ✅ Condition userProfile.university: ${!!student.university}`);
    }
    
    // Tester spécifiquement avec un utilisateur pour voir les données complètes
    console.log('\n🔍 Test détaillé avec un étudiant spécifique:');
    const testUser = await User.findOne({ 
      isStudent: true,
      university: { $exists: true, $ne: null, $ne: '' }
    }).select('username firstName lastName isStudent university bio joinedAt createdAt');
    
    if (testUser) {
      console.log('\n📋 Données complètes de l\'utilisateur test:');
      console.log(JSON.stringify(testUser, null, 2));
      
      console.log('\n🧪 Tests de condition:');
      console.log(`userProfile.university: ${testUser.university}`);
      console.log(`!!userProfile.university: ${!!testUser.university}`);
      console.log(`userProfile.university && condition: ${testUser.university && true}`);
      console.log(`Regex result: ${testUser.university.replace(/^Université de\s+/i, '')}`);
    }
    
    // Vérifier les données directement depuis MongoDB
    console.log('\n🌐 Test direct MongoDB sans API...');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
}

diagnosticUniversityDisplay();
