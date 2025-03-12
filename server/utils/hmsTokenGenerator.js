
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * Génère un token HMS pour l'authentification à 100ms
 */
const generateHMSToken = (roomId, userName, role = 'host') => {
  try {
    if (!process.env.MS100_APP_ACCESS_KEY || !process.env.MS100_APP_SECRET) {
      throw new Error("MS100_APP_ACCESS_KEY ou MS100_APP_SECRET non définis dans les variables d'environnement");
    }

    // Création du token avec les spécifications de 100ms
    // Documentation: https://www.100ms.live/docs/server-side/v2/foundation/authentication-and-tokens
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 24 * 60 * 60; // Expiration dans 24 heures
    
    const payload = {
      access_key: process.env.MS100_APP_ACCESS_KEY,
      room_id: roomId,
      user_id: uuidv4(),
      role, // "host", "guest", etc.
      type: "app",
      version: 2,
      iat,
      exp,
      jti: uuidv4(),
      name: userName
    };
    
    // Utilisation du secret pour signer le token
    const token = jwt.sign(
      payload,
      process.env.MS100_APP_SECRET,
      { algorithm: 'HS256' }
    );
    
    return token;
  } catch (error) {
    console.error('Erreur lors de la génération du token HMS:', error);
    throw new Error('Impossible de générer le token HMS');
  }
};

module.exports = {
  generateHMSToken
};
