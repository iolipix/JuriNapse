const { Resend } = require('resend');

// S'assurer que dotenv est chargé
require('dotenv').config();

// Initialiser Resend avec la clé API depuis les variables d'environnement (conditionnellement)
let resend = null;
if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your_resend_api_key_here') {
  resend = new Resend(process.env.RESEND_API_KEY);
}

class EmailService {
  constructor() {
    this.from = process.env.FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    this.appName = 'Jurinapse';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.apiUrl = process.env.API_URL || 'http://localhost:5000/api';
  }

  /**
   * Envoyer un email de vérification
   * @param {Object} user - L'utilisateur 
   * @param {String} token - Le token de vérification
   */
  async sendVerificationEmail(user, token) {
    try {
      const verificationLink = `${this.apiUrl}/auth/verify?token=${token}`;
      
      const htmlContent = this.getVerificationEmailTemplate({
        firstName: user.firstName,
        verificationLink: verificationLink,
        appName: this.appName
      });

      // Vérifier si Resend est configuré
      if (!resend) {
        console.warn('⚠️ Resend non configuré - simulation d\'envoi d\'email');
        console.log('📧 Email de vérification simulé pour:', user.email);
        console.log('🔗 Lien de vérification:', verificationLink);
        return { 
          success: true, 
          messageId: 'simulated-' + Date.now(),
          simulated: true 
        };
      }

      const { data, error } = await resend.emails.send({
        from: this.from,
        to: [user.email],
        subject: `Confirmez votre compte ${this.appName}`,
        html: htmlContent,
        text: this.getVerificationEmailText({
          firstName: user.firstName,
          verificationLink: verificationLink,
          appName: this.appName
        })
      });

      if (error) {
        console.error('❌ Erreur Resend:', error);
        throw new Error(`Échec envoi email: ${error.message}`);
      }

      console.log('✅ Email de vérification envoyé:', data);
      return { success: true, messageId: data.id };

    } catch (error) {
      console.error('❌ Erreur service email:', error);
      throw error;
    }
  }

  /**
   * Template HTML pour l'email de vérification
   */
  getVerificationEmailTemplate({ firstName, verificationLink, appName }) {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmez votre compte</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
          color: #334155;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1e293b;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
          color: #475569;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-2px);
        }
        .link-text {
          font-size: 14px;
          color: #64748b;
          margin-top: 20px;
        }
        .link-url {
          word-break: break-all;
          color: #3b82f6;
        }
        .footer {
          background-color: #f1f5f9;
          padding: 30px;
          text-align: center;
          font-size: 14px;
          color: #64748b;
        }
        .footer strong {
          color: #1e293b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚖️ ${appName}</h1>
        </div>
        <div class="content">
          <div class="greeting">Bonjour ${firstName} !</div>
          <div class="message">
            Bienvenue sur ${appName} ! Pour finaliser votre inscription et sécuriser votre compte, 
            veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :
          </div>
          <div style="text-align: center;">
            <a href="${verificationLink}" class="cta-button">
              ✅ Confirmer mon compte
            </a>
          </div>
          <div class="link-text">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
            <span class="link-url">${verificationLink}</span>
          </div>
          <div class="message" style="margin-top: 30px; font-size: 14px; color: #64748b;">
            ⏱️ <strong>Important :</strong> Ce lien est valide pendant 1 heure seulement.<br>
            Si vous n'avez pas créé de compte sur ${appName}, ignorez cet email.
          </div>
        </div>
        <div class="footer">
          <strong>${appName}</strong> - Votre plateforme juridique de référence<br>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </div>
      </div>
    </body>
    </html>`;
  }

  /**
   * Version texte de l'email de vérification
   */
  getVerificationEmailText({ firstName, verificationLink, appName }) {
    return `
Bonjour ${firstName} !

Bienvenue sur ${appName} !

Pour finaliser votre inscription et sécuriser votre compte, veuillez confirmer votre adresse email en cliquant sur le lien suivant :

${verificationLink}

Important : Ce lien est valide pendant 1 heure seulement.

Si vous n'avez pas créé de compte sur ${appName}, ignorez cet email.

${appName} - Votre plateforme juridique de référence
    `.trim();
  }

  /**
   * Envoyer un email de bienvenue après vérification
   * @param {Object} user - L'utilisateur vérifié
   */
  async sendWelcomeEmail(user) {
    try {
      // Vérifier si Resend est configuré
      if (!resend) {
        console.warn('⚠️ Resend non configuré - simulation email de bienvenue');
        console.log('🎉 Email de bienvenue simulé pour:', user.email);
        return { 
          success: true, 
          messageId: 'welcome-simulated-' + Date.now(),
          simulated: true 
        };
      }

      const { data, error } = await resend.emails.send({
        from: this.from,
        to: [user.email],
        subject: `Bienvenue sur ${this.appName} !`,
        html: this.getWelcomeEmailTemplate(user),
        text: `Bienvenue sur ${this.appName}, ${user.firstName} ! Votre compte est maintenant activé.`
      });

      if (error) {
        console.error('❌ Erreur envoi email bienvenue:', error);
        throw new Error(`Échec envoi email bienvenue: ${error.message}`);
      }

      console.log('✅ Email de bienvenue envoyé:', data);
      return { success: true, messageId: data.id };

    } catch (error) {
      console.error('❌ Erreur service email bienvenue:', error);
      throw error;
    }
  }

  getWelcomeEmailTemplate(user) {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue !</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
          color: #334155;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .content {
          padding: 40px 30px;
        }
        .footer {
          background-color: #f1f5f9;
          padding: 30px;
          text-align: center;
          font-size: 14px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bienvenue sur ${this.appName} !</h1>
        </div>
        <div class="content">
          <div style="font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #1e293b;">
            Félicitations ${user.firstName} !
          </div>
          <div style="font-size: 16px; line-height: 1.6; color: #475569;">
            Votre compte a été vérifié avec succès. Vous pouvez maintenant profiter pleinement de toutes les fonctionnalités de ${this.appName}.
            <br><br>
            Commencez dès maintenant à explorer notre plateforme et rejoignez la communauté juridique !
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.frontendUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              🚀 Découvrir ${this.appName}
            </a>
          </div>
        </div>
        <div class="footer">
          <strong>${this.appName}</strong> - Votre plateforme juridique de référence
        </div>
      </div>
    </body>
    </html>`;
  }
}

module.exports = new EmailService();
