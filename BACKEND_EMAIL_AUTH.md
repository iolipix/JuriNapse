# Backend - Routes d'authentification par email

## Routes à ajouter dans votre backend Node.js/Express :

### 1. POST /api/auth/send-verification
```javascript
// Route pour envoyer un code de vérification par email
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Adresse email invalide'
      });
    }

    // Générer un code à 6 chiffres
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expiration dans 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Sauvegarder le code in MongoDB
    await db.collection('verificationCodes').updateOne(
      { email },
      {
        $set: {
          email,
          code: verificationCode,
          expiresAt,
          used: false,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    // Envoyer l'email (avec votre service d'email)
    await sendVerificationEmail(email, verificationCode);

    res.json({
      success: true,
      message: 'Code envoyé avec succès'
    });

  } catch (error) {
    console.error('Error sending verification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du code'
    });
  }
});
```

### 2. POST /api/auth/verify-code
```javascript
// Route pour vérifier le code et connecter l'utilisateur
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email et code requis'
      });
    }

    // Vérifier le code dans MongoDB
    const verificationRecord = await db.collection('verificationCodes').findOne({
      email,
      code,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!verificationRecord) {
      return res.status(400).json({
        success: false,
        message: 'Code invalide ou expiré'
      });
    }

    // Marquer le code comme utilisé
    await db.collection('verificationCodes').updateOne(
      { _id: verificationRecord._id },
      { $set: { used: true } }
    );

    // Vérifier si l'utilisateur existe
    let user = await db.collection('users').findOne({ email });
    
    if (!user) {
      // Créer un nouvel utilisateur
      user = {
        _id: new ObjectId(),
        email,
        username: email.split('@')[0], // Username temporaire
        name: '',
        profilePicture: '',
        bio: '',
        joinedAt: new Date(),
        isVerified: true,
        followers: [],
        following: [],
        savedPosts: []
      };
      
      await db.collection('users').insertOne(user);
    }

    // Générer JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        profilePicture: user.profilePicture,
        bio: user.bio,
        isVerified: user.isVerified,
        joinedAt: user.joinedAt
      }
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification'
    });
  }
});
```

### 3. POST /api/auth/resend-code
```javascript
// Route pour renvoyer un code de vérification
app.post('/api/auth/resend-code', async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier le délai entre les envois (rate limiting)
    const lastCode = await db.collection('verificationCodes').findOne(
      { email },
      { sort: { createdAt: -1 } }
    );

    if (lastCode && Date.now() - lastCode.createdAt.getTime() < 60000) {
      return res.status(429).json({
        success: false,
        message: 'Attendez 1 minute avant de demander un nouveau code'
      });
    }

    // Utiliser la même logique que send-verification
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await db.collection('verificationCodes').updateOne(
      { email },
      {
        $set: {
          email,
          code: verificationCode,
          expiresAt,
          used: false,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    await sendVerificationEmail(email, verificationCode);

    res.json({
      success: true,
      message: 'Nouveau code envoyé'
    });

  } catch (error) {
    console.error('Error resending code:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du renvoi'
    });
  }
});
```

### 4. Service d'envoi d'email
```javascript
// Fonction pour envoyer les emails (avec SendGrid, Nodemailer, etc.)
async function sendVerificationEmail(email, code) {
  const emailContent = {
    to: email,
    from: 'noreply@jurinapse.com',
    subject: 'Code de connexion JuriNapse',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">JuriNapse</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Code de connexion</h2>
          <p style="color: #6b7280; margin-bottom: 30px;">
            Utilisez ce code pour vous connecter à JuriNapse :
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">
              ${code}
            </span>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Ce code expire dans 10 minutes.<br>
            Si vous n'avez pas demandé ce code, ignorez cet email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} JuriNapse. Tous droits réservés.
          </p>
        </div>
      </div>
    `
  };

  // Envoyer avec votre service (SendGrid, Nodemailer, etc.)
  // Exemple avec SendGrid :
  // await sgMail.send(emailContent);
  
  console.log(`Code envoyé à ${email}: ${code}`);
}
```

## Variables d'environnement à ajouter :
```env
JWT_SECRET=votre_secret_jwt_tres_long_et_securise
SENDGRID_API_KEY=votre_cle_sendgrid
EMAIL_FROM=noreply@jurinapse.com
```
