const fetch = require('node-fetch');

// Créer un endpoint temporaire pour récupérer le token
async function getVerificationToken() {
    console.log('🔑 Récupération du token de vérification...\n');
    
    // Créer un script temporaire côté serveur
    const serverScript = `
const mongoose = require('mongoose');
const User = require('./models/user.model');
const VerificationToken = require('./models/verificationToken.model');

// Route temporaire pour récupérer le token
app.get('/debug/get-verification-token/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = await User.findOne({ email: email });
        
        if (!user) {
            return res.json({ success: false, message: 'Utilisateur non trouvé' });
        }
        
        const tokens = await VerificationToken.find({ userId: user._id }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                isVerified: user.isVerified || user.emailVerified,
                requiresVerification: user.requiresVerification
            },
            tokens: tokens.map(t => ({
                token: t.token,
                createdAt: t.createdAt,
                expiresAt: t.expiresAt,
                isExpired: t.expiresAt < new Date()
            }))
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
`;

    console.log('📝 Script serveur à ajouter temporairement:');
    console.log(serverScript);
    
    console.log('\n🔧 Solution temporaire:');
    console.log('1. Je vais créer un token de vérification directement');
    console.log('2. Puis générer le lien de vérification');
    
    // Générer un token factice pour test
    const crypto = require('crypto');
    const testToken = crypto.randomBytes(32).toString('hex');
    
    console.log('\n🎯 Token de test généré:');
    console.log('Token:', testToken);
    
    const verificationUrl = `https://jurinapse.com/verify-email?token=${testToken}`;
    console.log('\n🔗 Lien de vérification de test:');
    console.log(verificationUrl);
    
    console.log('\n✨ Liens à essayer:');
    console.log('1. Ouvrez votre page de test locale: test-email-verification.html');
    console.log('2. Ou utilisez ce lien factice:', verificationUrl);
    
    // Essayer de tester directement avec l'API
    console.log('\n🧪 Test direct avec l\'API...');
    
    try {
        const response = await fetch('https://jurinapse-production.up.railway.app/api/auth/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: testToken
            })
        });
        
        const result = await response.json();
        console.log('Status de vérification:', response.status);
        console.log('Réponse:', result);
        
    } catch (error) {
        console.log('❌ Erreur API:', error.message);
    }
}

getVerificationToken();
