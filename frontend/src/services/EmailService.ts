// Service d'envoi d'emails pour la vérification
class EmailService {
  private static readonly API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  static async sendVerificationCode(email: string): Promise<{success: boolean, message: string}> {
    try {
      const response = await fetch(`${this.API_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'envoi du code');
      }

      return { success: true, message: 'Code envoyé avec succès' };
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur réseau' 
      };
    }
  }

  static async verifyCode(email: string, code: string): Promise<{success: boolean, token?: string, user?: any, message: string}> {
    try {
      const response = await fetch(`${this.API_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Code invalide');
      }

      return {
        success: true,
        token: data.token,
        user: data.user,
        message: 'Connexion réussie'
      };
    } catch (error) {
      console.error('Erreur vérification code:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de vérification'
      };
    }
  }

  static async resendCode(email: string): Promise<{success: boolean, message: string}> {
    try {
      const response = await fetch(`${this.API_URL}/api/auth/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du renvoi');
      }

      return { success: true, message: 'Code renvoyé avec succès' };
    } catch (error) {
      console.error('Erreur renvoi code:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur réseau'
      };
    }
  }
}

export default EmailService;
