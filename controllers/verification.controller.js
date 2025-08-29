const User = require('../models/user.model');
const TokenService = require('../services/token.service');
const EmailService = require('../services/email.service');

class VerificationController {
  /**
   * Envoyer un email de vérification
   */
  async sendVerificationEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email requis'
        });
      }

      // Chercher l'utilisateur
      const user = await User.findOne({ email }).select('+email');
      
      if (!user) {
        // Pour la sécurité, on ne révèle pas si l'email existe
        return res.status(200).json({
          success: true,
          message: 'Si cet email existe dans notre système, un lien de vérification a été envoyé.'
        });
      }

      // Si déjà vérifié
      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Ce compte est déjà vérifié'
        });
      }

      // Générer le token de vérification
      const token = await TokenService.generateVerificationToken(user._id, 'email_verification');

      // Envoyer l'email
      await EmailService.sendVerificationEmail(user, token);

      console.log(`📧 Email de vérification envoyé à ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Email de vérification envoyé avec succès',
        data: {
          email: user.email,
          expiresIn: '1 heure'
        }
      });

    } catch (error) {
      console.error('❌ Erreur envoi email vérification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de vérification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Vérifier un compte via le token
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token de vérification manquant'
        });
      }

      console.log(`🔍 Tentative de vérification avec token: ${token.substring(0, 10)}...`);

      // Vérifier et consommer le token
      const tokenData = await TokenService.verifyAndConsumeToken(token, 'email_verification');
      
      if (!tokenData.userId) {
        throw new Error('Utilisateur non trouvé');
      }

      const user = tokenData.userId;

      // Vérifier si déjà vérifié
      if (user.isVerified) {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/login?status=already-verified&message=Votre compte est déjà vérifié`);
      }

      // Activer le compte
      await User.findByIdAndUpdate(user._id, {
        isVerified: true,
        verifiedAt: new Date()
      });

      console.log(`✅ Compte vérifié pour l'utilisateur: ${user.email}`);

      // Envoyer l'email de bienvenue (optionnel, en arrière-plan)
      try {
        await EmailService.sendWelcomeEmail(user);
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email bienvenue:', emailError);
        // On ne bloque pas le processus de vérification pour ça
      }

      // Rediriger vers le frontend avec succès
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/login?status=verified&message=Votre compte a été vérifié avec succès ! Vous pouvez maintenant vous connecter.`;
      
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('❌ Erreur vérification email:', error);
      
      let errorMessage = 'Erreur lors de la vérification';
      let statusCode = 400;

      if (error.message.includes('invalide')) {
        errorMessage = 'Lien de vérification invalide';
        statusCode = 400;
      } else if (error.message.includes('expiré')) {
        errorMessage = 'Lien de vérification expiré';
        statusCode = 410;
      } else {
        errorMessage = 'Erreur technique lors de la vérification';
        statusCode = 500;
      }

      // Rediriger vers le frontend avec l'erreur
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/register?status=error&message=${encodeURIComponent(errorMessage)}`;
      res.redirect(redirectUrl);
    }
  }

  /**
   * Renvoyer un email de vérification
   */
  async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email requis'
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Aucun compte trouvé avec cet email'
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Ce compte est déjà vérifié'
        });
      }

      // Générer un nouveau token
      const token = await TokenService.generateVerificationToken(user._id, 'email_verification');

      // Envoyer l'email
      await EmailService.sendVerificationEmail(user, token);

      console.log(`📧 Email de vérification renvoyé à ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Email de vérification renvoyé avec succès',
        data: {
          email: user.email,
          expiresIn: '1 heure'
        }
      });

    } catch (error) {
      console.error('❌ Erreur renvoi email vérification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du renvoi de l\'email',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Vérifier le statut de vérification d'un utilisateur
   */
  async checkVerificationStatus(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email requis'
        });
      }

      const user = await User.findOne({ email }).select('isVerified email verifiedAt');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          email: user.email,
          isVerified: user.isVerified,
          verifiedAt: user.verifiedAt || null
        }
      });

    } catch (error) {
      console.error('❌ Erreur vérification statut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du statut'
      });
    }
  }

  /**
   * Statistiques des tokens (admin uniquement)
   */
  async getTokenStats(req, res) {
    try {
      // TODO: Ajouter une vérification admin ici
      
      const stats = await TokenService.getTokenStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('❌ Erreur stats tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
}

module.exports = new VerificationController();
