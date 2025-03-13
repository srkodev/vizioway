
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// Base de données simulée (en production, utiliser MongoDB ou une autre BD)
const rooms = new Map();

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

// Générer un code de salle facile à retenir
const generateRoomCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  
  return code;
};

// Créer une nouvelle salle
router.post('/create', authenticate, (req, res) => {
  try {
    const { userId, fullName } = req.user;
    const { name } = req.body;
    
    const roomId = uuidv4();
    const roomCode = generateRoomCode();
    
    const newRoom = {
      id: roomId,
      code: roomCode,
      name: name || `Salle de ${fullName}`,
      createdBy: userId,
      createdAt: new Date(),
      participants: [],
      settings: {
        maxParticipants: 10,
        isScreenShareEnabled: true,
        isChatEnabled: true,
        isRecordingEnabled: false
      }
    };
    
    rooms.set(roomId, newRoom);
    
    res.status(201).json({
      success: true,
      data: {
        roomId,
        roomCode,
        name: newRoom.name
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la salle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la salle'
    });
  }
});

// Rejoindre une salle avec un code
router.post('/join-by-code', authenticate, (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code de salle requis'
      });
    }
    
    // Rechercher la salle par code
    let foundRoom = null;
    let roomId = null;
    
    for (const [id, room] of rooms.entries()) {
      if (room.code === code.toUpperCase()) {
        foundRoom = room;
        roomId = id;
        break;
      }
    }
    
    if (!foundRoom) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée avec ce code'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        roomId,
        roomCode: foundRoom.code,
        name: foundRoom.name
      }
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de la salle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la recherche de la salle'
    });
  }
});

// Obtenir les détails d'une salle
router.get('/:roomId', authenticate, (req, res) => {
  try {
    const { roomId } = req.params;
    
    if (!rooms.has(roomId)) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    const room = rooms.get(roomId);
    
    res.status(200).json({
      success: true,
      data: {
        id: room.id,
        code: room.code,
        name: room.name,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        settings: room.settings
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la salle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Mettre à jour les paramètres d'une salle
router.put('/:roomId/settings', authenticate, (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.user;
    const { settings } = req.body;
    
    if (!rooms.has(roomId)) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    const room = rooms.get(roomId);
    
    // Vérifier que l'utilisateur est le créateur de la salle
    if (room.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Seul le créateur de la salle peut modifier les paramètres'
      });
    }
    
    // Mettre à jour les paramètres
    room.settings = {
      ...room.settings,
      ...settings
    };
    
    res.status(200).json({
      success: true,
      data: {
        settings: room.settings
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
