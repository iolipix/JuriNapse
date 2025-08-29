const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  username: String,
  firstName: String,
  lastName: String,
  isStudent: Boolean,
  university: String,
  email: String
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connecté à MongoDB');
    
    const students = await User.find({ isStudent: true }).select('username firstName lastName university isStudent').limit(10);
    
    console.log(`📊 Premiers étudiants (sur ${students.length}):`);
    students.forEach((s, i) => {
      console.log(`${i+1}. ${s.firstName} ${s.lastName} (@${s.username})`);
      console.log(`   🏫 university: "${s.university}" (type: ${typeof s.university})`);
      console.log(`   📏 length: ${s.university ? s.university.length : 'N/A'}`);
      console.log(`   ✅ condition: ${s.university && s.university.trim() !== ''}`);
      console.log(`   🌆 ville: ${s.university && s.university.trim() !== '' ? s.university.replace(/^Université de\\s+/i, '') : 'N/A'}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

checkData();
