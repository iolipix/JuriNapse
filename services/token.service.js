const crypto = require('crypto');
const VerificationToken = require('../models/verificationToken.model');

class TokenService {
  /**
   * Générer un token de vérification unique
   * @param {String} userId - L'ID de l'utilisateur
   * @param {String} tokenType - Le type de token ('email_verification' ou 'password_reset')
   * @param {Number} expirationHours - Durée de validité en heures (défaut: 1h)
   * @returns {String} Le token généré
   */
  async generateVerificationToken(userId, tokenType = 'email_verification', expirationHours = 1) {
    try {
      // Supprimer les anciens tokens pour cet utilisateur et ce type
      await VerificationToken.deleteMany({ userId, tokenType });

      // Générer un token unique et sécurisé
      const token = crypto.randomBytes(32).toString('hex');
      
      // Date d'expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      // Créer le nouveau token
      const verificationToken = new VerificationToken({
        userId,
        token,
        tokenType,
        expiresAt
      });

      await verificationToken.save();
      
      console.log(`✅ Token ${tokenType} généré pour l'utilisateur ${userId}`);
      return token;

    } catch (error) {
      console.error('❌ Erreur génération token:', error);
      throw new Error('Erreur lors de la génération du token de vérification');
    }
  }

  /**
   * Vérifier et consommer un token
   * @param {String} token - Le token à vérifier
   * @param {String} tokenType - Le type de token attendu
   * @returns {Object} Les informations du token si valide
   */
  async verifyAndConsumeToken(token, tokenType = 'email_verification') {
    try {
      // Chercher le token dans la base de données
      const verificationToken = await VerificationToken.findOne({
        token,
        tokenType
      }).populate('userId');

      if (!verificationToken) {
        throw new Error('Token invalide ou expiré');
      }

      // Vérifier si le token est expiré
      if (verificationToken.isExpired()) {
        // Supprimer le token expiré
        await VerificationToken.findByIdAndDelete(verificationToken._id);
        throw new Error('Token expiré');
      }

      // Le token est valide, on le récupère avant de le supprimer
      const result = {
        userId: verificationToken.userId,
        tokenType: verificationToken.tokenType,
        createdAt: verificationToken.createdAt
      };

      // Supprimer le token pour éviter la réutilisation
      await VerificationToken.findByIdAndDelete(verificationToken._id);

      console.log(`✅ Token ${tokenType} vérifié et consommé pour l'utilisateur ${result.userId._id}`);
      return result;

    } catch (error) {
      console.error('❌ Erreur vérification token:', error);
      throw error;
    }
  }

  /**
   * Supprimer tous les tokens d'un utilisateur
   * @param {String} userId - L'ID de l'utilisateur
   * @param {String} tokenType - Le type de token (optionnel)
   */
  async deleteUserTokens(userId, tokenType = null) {
    try {
      const query = { userId };
      if (tokenType) {
        query.tokenType = tokenType;
      }

      const result = await VerificationToken.deleteMany(query);
      console.log(`✅ ${result.deletedCount} token(s) supprimé(s) pour l'utilisateur ${userId}`);
      return result.deletedCount;

    } catch (error) {
      console.error('❌ Erreur suppression tokens:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les tokens expirés (tâche de maintenance)
   */
  async cleanupExpiredTokens() {
    try {
      const result = await VerificationToken.cleanupExpired();
      console.log(`🧹 ${result.deletedCount} token(s) expiré(s) supprimé(s)`);
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Erreur nettoyage tokens:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des tokens
   */
  async getTokenStats() {
    try {
      const stats = await VerificationToken.aggregate([
        {
          $group: {
            _id: '$tokenType',
            count: { $sum: 1 },
            expired: {
              $sum: {
                $cond: [
                  { $lt: ['$expiresAt', new Date()] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('❌ Erreur stats tokens:', error);
      throw error;
    }
  }

  /**
   * Générer un token simple pour les URLs (plus court)
   * Utilisé pour des liens publics moins sensibles
   */
  generateSimpleToken(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Générer un token UUID v4
   */
  generateUUIDToken() {
    return crypto.randomUUID();
  }
}

module.exports = new TokenService();
