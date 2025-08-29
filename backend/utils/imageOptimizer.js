const sharp = require('sharp');

/**
 * Middleware pour optimiser automatiquement les images uploadées
 * À utiliser dans les controllers d'upload
 */
class ImageOptimizer {
  static async optimizeProfilePicture(imageBuffer, options = {}) {
    const {
      width = 200,
      height = 200,
      quality = 80,
      format = 'jpeg'
    } = options;

    try {
      console.log(`📸 Image originale: ${imageBuffer.length} bytes`);
      
      const optimizedBuffer = await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality, progressive: true })
        .toBuffer();

      console.log(`⚡ Image optimisée: ${optimizedBuffer.length} bytes`);
      console.log(`📉 Réduction: ${((1 - optimizedBuffer.length / imageBuffer.length) * 100).toFixed(1)}%`);

      return optimizedBuffer;
    } catch (error) {
      console.error('❌ Erreur optimisation image:', error);
      throw error;
    }
  }

  static async optimizeBase64Image(base64String, options = {}) {
    try {
      // Extraire les données base64 (enlever le préfixe data:image/...)
      const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      const optimizedBuffer = await this.optimizeProfilePicture(imageBuffer, options);
      
      // Reconvertir en base64 avec le bon préfixe
      const optimizedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
      
      return optimizedBase64;
    } catch (error) {
      console.error('❌ Erreur optimisation base64:', error);
      throw error;
    }
  }

  static async compressAllUserProfilePictures() {
    const mongoose = require('mongoose');
    const User = require('../models/user.model');

    try {
      console.log('🔄 Compression de toutes les photos de profil...');
      
      const users = await User.find({ 
        profilePicture: { $exists: true, $ne: null, $ne: "" }
      });

      console.log(`👥 ${users.length} utilisateurs avec photos trouvés`);

      let compressed = 0;
      let totalSavings = 0;

      for (const user of users) {
        try {
          if (user.profilePicture && user.profilePicture.startsWith('data:image')) {
            const originalSize = user.profilePicture.length;
            console.log(`\n👤 ${user.username}: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
            
            const optimized = await this.optimizeBase64Image(user.profilePicture);
            const newSize = optimized.length;
            const savings = originalSize - newSize;
            
            user.profilePicture = optimized;
            await user.save();
            
            compressed++;
            totalSavings += savings;
            
            console.log(`✅ ${user.username}: ${(newSize / 1024).toFixed(1)}KB (économie: ${(savings / 1024 / 1024).toFixed(2)}MB)`);
          }
        } catch (error) {
          console.error(`❌ Erreur pour ${user.username}:`, error.message);
        }
      }

      console.log(`\n🎉 RÉSULTATS:`);
      console.log(`📸 Images compressées: ${compressed}`);
      console.log(`💾 Économie totale: ${(totalSavings / 1024 / 1024).toFixed(2)}MB`);
      
      return { compressed, totalSavings };
    } catch (error) {
      console.error('❌ Erreur compression batch:', error);
      throw error;
    }
  }
}

module.exports = ImageOptimizer;

// Si exécuté directement, compresser toutes les images
if (require.main === module) {
  const mongoose = require('mongoose');
  require('dotenv').config();

  async function run() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connecté à MongoDB');
      
      await ImageOptimizer.compressAllUserProfilePictures();
      
    } catch (error) {
      console.error('❌ Erreur:', error);
    } finally {
      await mongoose.disconnect();
      console.log('🔌 Déconnecté');
    }
  }

  run();
}
