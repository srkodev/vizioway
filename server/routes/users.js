
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Stockage des utilisateurs en mémoire (à remplacer par une BD en production)
const users = new Map();

// Obtenir les informations de l'utilisateur actuel
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!users.has(decoded.userId)) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    const user = users.get(decoded.userId);
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des infos utilisateur:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
});

// Création d'un compte temporaire (pour la démonstration)
router.post('/guest', (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nom requis'
      });
    }
    
    const userId = uuidv4();
    
    // Créer un utilisateur temporaire
    const newUser = {
      id: userId,
      name,
      guest: true,
      createdAt: new Date()
    };
    
    users.set(userId, newUser);
    
    // Générer un token temporaire
    const token = jwt.sign(
      { userId, name, guest: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          name
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création du compte invité:', error);
    res.status(500).json({
      success: false,
      message: 'Impossible de créer un compte invité'
    });
  }
});

module.exports = router;
