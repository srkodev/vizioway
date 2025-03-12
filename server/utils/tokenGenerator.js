
const jwt = require('jsonwebtoken');

/**
 * Génère un token JWT pour l'authentification
 * Pour 100ms en production, il faudrait utiliser leur SDK pour générer le token spécifique
 */
const generateToken = (payload) => {
  try {
    // Dans une vraie implémentation 100ms, nous utiliserions leur SDK pour générer le token
    // Mais pour notre simulation, nous utilisons un JWT standard
    const token = jwt.sign(
      {
        roomId: payload.roomId,
        userId: payload.userId,
        name: payload.name,
        role: payload.role,
        // Ajoutez tous les champs requis par 100ms ici
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return token;
  } catch (error) {
    console.error('Erreur lors de la génération du token:', error);
    throw new Error('Impossible de générer le token');
  }
};

module.exports = {
  generateToken
};
