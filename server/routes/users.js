
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Base de données simulée (en production, utiliser MongoDB ou une autre BD)
const users = new Map();

// Middleware pour vérifier l'authentification
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vizioway-super-secret-key');
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;
    
    // Valider les données
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }
    
    // Vérifier si l'email existe déjà
    for (const user of users.values()) {
      if (user.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
      if (user.username === username) {
        return res.status(400).json({
          success: false,
          message: 'Ce nom d\'utilisateur est déjà utilisé'
        });
      }
    }
    
    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Créer un nouvel utilisateur
    const userId = uuidv4();
    const newUser = {
      id: userId,
      fullName,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    // Sauvegarder l'utilisateur
    users.set(userId, newUser);
    
    // Créer et signer un JWT
    const token = jwt.sign(
      { userId, fullName, username, email },
      process.env.JWT_SECRET || 'vizioway-super-secret-key',
      { expiresIn: '7d' }
    );
    
    // Répondre avec le token et les informations utilisateur
    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          fullName,
          username,
          email
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Valider les données
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }
    
    // Rechercher l'utilisateur
    let foundUser = null;
    for (const user of users.values()) {
      if (user.email === email) {
        foundUser = user;
        break;
      }
    }
    
    if (!foundUser) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Créer et signer un JWT
    const token = jwt.sign(
      { 
        userId: foundUser.id, 
        fullName: foundUser.fullName, 
        username: foundUser.username, 
        email: foundUser.email 
      },
      process.env.JWT_SECRET || 'vizioway-super-secret-key',
      { expiresIn: '7d' }
    );
    
    // Répondre avec le token et les informations utilisateur
    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: foundUser.id,
          fullName: foundUser.fullName,
          username: foundUser.username,
          email: foundUser.email
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
});

// Pour accès invité (connexion rapide sans inscription)
router.post('/guest', (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Un nom d\'utilisateur est requis'
      });
    }
    
    const userId = uuidv4();
    const email = `guest-${userId.substring(0, 8)}@vizioway.temp`;
    
    const guestUser = {
      id: userId,
      fullName: username,
      username,
      email,
      isGuest: true,
      createdAt: new Date()
    };
    
    // Sauvegarder l'utilisateur temporaire
    users.set(userId, guestUser);
    
    // Créer et signer un JWT avec durée plus courte pour les invités
    const token = jwt.sign(
      { userId, fullName: username, username, email, isGuest: true },
      process.env.JWT_SECRET || 'vizioway-super-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          fullName: username,
          username,
          email,
          isGuest: true
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création du compte invité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du compte invité'
    });
  }
});

// Obtenir les informations de l'utilisateur connecté
router.get('/me', authenticate, (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!users.has(userId)) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    const user = users.get(userId);
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        isGuest: user.isGuest || false
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des infos utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
