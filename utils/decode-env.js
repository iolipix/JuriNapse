require('dotenv').config({ path: '.env.encoded' });

// Fonction pour décoder les variables Base64
const decodeEnvVars = () => {
  const encodedVars = {
    DB_USER: process.env.DB_USER_ENCODED,
    DB_PASSWORD: process.env.DB_PASSWORD_ENCODED,
    DB_CLUSTER: process.env.DB_CLUSTER_ENCODED,
    DB_APP_NAME: process.env.DB_APP_NAME_ENCODED
  };

  // Décoder et définir les vraies variables
  for (const [key, encodedValue] of Object.entries(encodedVars)) {
    if (encodedValue) {
      process.env[key] = Buffer.from(encodedValue, 'base64').toString('utf8');
    }
  }

  console.log('✅ Variables décodées et chargées');
};

module.exports = { decodeEnvVars };
