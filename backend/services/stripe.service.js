/**
 * Service Stripe pour la gestion des abonnements premium
 */
const Stripe = require('stripe');

// Initialiser Stripe avec la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class StripeService {
  /**
   * Créer une session de checkout pour l'abonnement premium
   * @param {string} userId - ID de l'utilisateur
   * @param {string} userEmail - Email de l'utilisateur
   * @param {string} successUrl - URL de redirection en cas de succès
   * @param {string} cancelUrl - URL de redirection en cas d'annulation
   * @returns {Object} Session de checkout Stripe
   */
  async createCheckoutSession(userId, userEmail, successUrl, cancelUrl) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PREMIUM_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: userEmail,
        client_reference_id: userId,
        metadata: {
          userId: userId,
          type: 'premium_subscription'
        },
        subscription_data: {
          metadata: {
            userId: userId,
            type: 'premium_subscription'
          }
        },
        // Permettre les codes de réduction
        allow_promotion_codes: true,
        // Configuration des essais gratuits si nécessaire
        subscription_data: {
          trial_period_days: 7, // 7 jours d'essai gratuit
          metadata: {
            userId: userId,
            type: 'premium_subscription'
          }
        }
      });

      return session;
    } catch (error) {
      console.error('Erreur lors de la création de la session Stripe:', error);
      throw new Error(`Erreur Stripe: ${error.message}`);
    }
  }

  /**
   * Créer un portail client pour gérer l'abonnement
   * @param {string} customerId - ID du client Stripe
   * @param {string} returnUrl - URL de retour
   * @returns {Object} Session du portail client
   */
  async createCustomerPortalSession(customerId, returnUrl) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error('Erreur lors de la création du portail client:', error);
      throw new Error(`Erreur portail Stripe: ${error.message}`);
    }
  }

  /**
   * Récupérer les informations d'abonnement d'un client
   * @param {string} customerId - ID du client Stripe
   * @returns {Object} Informations d'abonnement
   */
  async getCustomerSubscriptions(customerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10,
      });

      return subscriptions;
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnements:', error);
      throw new Error(`Erreur récupération abonnements: ${error.message}`);
    }
  }

  /**
   * Annuler un abonnement
   * @param {string} subscriptionId - ID de l'abonnement
   * @returns {Object} Abonnement annulé
   */
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      return subscription;
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      throw new Error(`Erreur annulation: ${error.message}`);
    }
  }

  /**
   * Vérifier une session de checkout
   * @param {string} sessionId - ID de la session
   * @returns {Object} Session de checkout
   */
  async verifySession(sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      console.error('Erreur lors de la vérification de la session:', error);
      throw new Error(`Erreur vérification session: ${error.message}`);
    }
  }

  /**
   * Traiter un webhook Stripe
   * @param {string} payload - Corps de la requête webhook
   * @param {string} signature - Signature Stripe
   * @returns {Object} Événement traité
   */
  constructWebhookEvent(payload, signature) {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Erreur lors de la vérification du webhook:', error);
      throw new Error(`Webhook invalide: ${error.message}`);
    }
  }

  /**
   * Récupérer les détails d'un client par email
   * @param {string} email - Email du client
   * @returns {Object} Client Stripe ou null
   */
  async getCustomerByEmail(email) {
    try {
      const customers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      return customers.data.length > 0 ? customers.data[0] : null;
    } catch (error) {
      console.error('Erreur lors de la recherche du client:', error);
      throw new Error(`Erreur recherche client: ${error.message}`);
    }
  }

  /**
   * Créer un nouveau client Stripe
   * @param {string} email - Email du client
   * @param {string} name - Nom du client
   * @param {Object} metadata - Métadonnées supplémentaires
   * @returns {Object} Client Stripe créé
   */
  async createCustomer(email, name, metadata = {}) {
    try {
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: metadata,
      });

      return customer;
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw new Error(`Erreur création client: ${error.message}`);
    }
  }
}

module.exports = new StripeService();