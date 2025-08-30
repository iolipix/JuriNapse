const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://theophane:XkQ9HfZhZz8S2zcG@cluster0.9zr7k.mongodb.net/jurinapse?retryWrites=true&w=majority&appName=Cluster0';

async function diagnosePictureProfile() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db('jurinapse');
    const usersCollection = db.collection('users');
    
    // Rechercher l'utilisateur theophane_mry
    const user = await usersCollection.findOne({ 
      $or: [
        { username: 'theophane_mry' },
        { email: 'theophane.mry@example.com' }
      ]
    });
    
    if (!user) {
      console.log('❌ Utilisateur theophane_mry non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:', user.username);
    console.log('📧 Email:', user.email);
    console.log('🆔 ID:', user._id);
    
    // Vérifier la photo de profil
    if (user.profilePicture) {
      console.log('📸 Photo de profil trouvée:');
      console.log('   Type:', typeof user.profilePicture);
      console.log('   Longueur:', user.profilePicture.length);
      
      if (user.profilePicture.startsWith('data:')) {
        console.log('   ✅ Format: Base64 Data URL');
        console.log('   📄 Preview:', user.profilePicture.substring(0, 100) + '...');
      } else if (user.profilePicture.startsWith('/api/')) {
        console.log('   ✅ Format: API URL');
        console.log('   🔗 URL:', user.profilePicture);
      } else if (user.profilePicture.startsWith('http')) {
        console.log('   ✅ Format: HTTP URL');
        console.log('   🔗 URL:', user.profilePicture);
      } else {
        console.log('   ⚠️ Format: Base64 brut (sans préfixe)');
        console.log('   📄 Preview:', user.profilePicture.substring(0, 100) + '...');
      }
    } else {
      console.log('❌ Aucune photo de profil trouvée');
    }
    
    // Vérifier aussi la collection ProfilePicture
    const profilePicturesCollection = db.collection('profilePictures');
    const profilePicture = await profilePicturesCollection.findOne({ userId: user._id });
    
    if (profilePicture) {
      console.log('\n📸 Photo de profil dans ProfilePictures:');
      console.log('   🆔 ID:', profilePicture._id);
      console.log('   👤 UserId:', profilePicture.userId);
      console.log('   📄 ImageData longueur:', profilePicture.imageData ? profilePicture.imageData.length : 'N/A');
      console.log('   📄 Preview:', profilePicture.imageData ? profilePicture.imageData.substring(0, 100) + '...' : 'N/A');
    } else {
      console.log('\n❌ Aucune entrée dans ProfilePictures pour cet utilisateur');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

diagnosePictureProfile();
