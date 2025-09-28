// Route simple pour diagnostiquer et fixer le premium de Théophane
const express = require('express');
const User = require('../models/user.model');
const router = express.Router();

// Route ultra simple pour fixer le premium de Théophane
router.get('/fix-theophane-premium', async (req, res) => {
  try {
    console.log('🔧 Recherche de Théophane...');
    
    // Chercher Théophane par email
    const user = await User.findOne({ email: 'theophane.aburey@gmail.com' });
    
    if (!user) {
      return res.json({
        success: false,
        error: 'Utilisateur Théophane non trouvé'
      });
    }
    
    console.log('👤 Théophane trouvé:', {
      id: user._id,
      email: user.email,
      roles: user.roles,
      isPremium: user.isPremium(),
      premiumExpiresAt: user.premiumExpiresAt
    });
    
    // Forcer le premium
    const result = {
      before: {
        roles: user.roles,
        isPremium: user.isPremium(),
        premiumExpiresAt: user.premiumExpiresAt
      }
    };
    
    // Accorder le premium pour 1 an
    user.grantPremium(365, 'Fix manuel - paiements Stripe non traités');
    await user.save();
    
    // Vérifier après
    const updatedUser = await User.findById(user._id);
    
    result.after = {
      roles: updatedUser.roles,
      isPremium: updatedUser.isPremium(),
      premiumExpiresAt: updatedUser.premiumExpiresAt,
      premiumGrantedAt: updatedUser.premiumGrantedAt
    };
    
    result.success = true;
    result.message = 'Premium accordé avec succès !';
    
    console.log('✅ Premium accordé:', result.after);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour analyser les paiements Stripe de Théophane
router.get('/analyze-theophane-payments', async (req, res) => {
  try {
    const user = await User.findOne({ email: 'theophane.aburey@gmail.com' });
    
    if (!user) {
      return res.json({ error: 'Utilisateur non trouvé' });
    }
    
    const result = {
      user: {
        id: user._id.toString(),
        email: user.email,
        roles: user.roles,
        isPremium: user.isPremium()
      },
      stripeAnalysis: {}
    };
    
    // Analyser Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      // Rechercher toutes les sessions avec l'userId de Théophane
      const sessions = await stripe.checkout.sessions.list({
        limit: 100
      });
      
      const theophaneId = user._id.toString();
      const userSessions = sessions.data.filter(session => 
        session.client_reference_id === theophaneId
      );
      
      result.stripeAnalysis.totalSessions = sessions.data.length;
      result.stripeAnalysis.userSessions = userSessions.length;
      result.stripeAnalysis.sessions = userSessions.map(session => ({
        id: session.id,
        status: session.status,
        mode: session.mode,
        email: session.customer_email,
        created: new Date(session.created * 1000).toISOString(),
        userId: session.client_reference_id
      }));
      
      // Analyser les événements webhooks
      const events = await stripe.events.list({
        type: 'checkout.session.completed',
        limit: 50
      });
      
      const userEvents = events.data.filter(event => {
        const session = event.data.object;
        return session.client_reference_id === theophaneId;
      });
      
      result.stripeAnalysis.webhookEvents = userEvents.length;
      result.stripeAnalysis.events = userEvents.map(event => ({
        id: event.id,
        created: new Date(event.created * 1000).toISOString(),
        sessionId: event.data.object.id
      }));
      
      // Diagnostic
      if (userSessions.length > 0 && userEvents.length === 0) {
        result.problem = 'Paiements effectués mais aucun webhook reçu';
        result.solution = 'Webhooks Stripe mal configurés';
      } else if (userEvents.length > 0 && !user.isPremium()) {
        result.problem = 'Webhooks reçus mais premium pas accordé';
        result.solution = 'Bug dans le traitement des webhooks';
      }
    }
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;