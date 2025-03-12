
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../utils/tokenGenerator');

// Stockage des salles en mémoire (à remplacer par une BD en production)
const rooms = new Map();

// Créer une nouvelle salle
router.post('/', (req, res) => {
  try {
    const roomId = uuidv4();
    const newRoom = {
      id: roomId,
      name: req.body.name || `Salle ${roomId.substring(0, 8)}`,
      createdAt: new Date(),
      participants: [],
      settings: req.body.settings || { maxParticipants: 10 }
    };

    rooms.set(roomId, newRoom);

    res.status(201).json({
      success: true,
      data: {
        roomId,
        name: newRoom.name
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la salle:', error);
    res.status(500).json({
      success: false,
      message: 'Impossible de créer la salle'
    });
  }
});

// Obtenir les détails d'une salle
router.get('/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  if (!rooms.has(roomId)) {
    return res.status(404).json({
      success: false,
      message: 'Salle non trouvée'
    });
  }

  res.status(200).json({
    success: true,
    data: rooms.get(roomId)
  });
});

// Joindre une salle (obtenir un token)
router.post('/:roomId/join', (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, role = 'guest' } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Le nom est requis'
      });
    }
    
    // Vérifier si la salle existe
    if (!rooms.has(roomId)) {
      // Create room if it doesn't exist (only in dev)
      if (process.env.NODE_ENV === 'development') {
        const newRoom = {
          id: roomId,
          name: `Salle ${roomId.substring(0, 8)}`,
          createdAt: new Date(),
          participants: [],
          settings: { maxParticipants: 10 }
        };
        rooms.set(roomId, newRoom);
      } else {
        return res.status(404).json({
          success: false,
          message: 'Salle non trouvée'
        });
      }
    }
    
    // Generate token for 100ms (or our own jwt token for simulation)
    const token = generateToken({
      roomId,
      userId: uuidv4(),
      name,
      role
    });
    
    const room = rooms.get(roomId);
    const participantId = uuidv4();
    
    // Add participant to room
    room.participants.push({
      id: participantId,
      name,
      role,
      joinedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      data: {
        token,
        roomId,
        participantId
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création du token:', error);
    res.status(500).json({
      success: false,
      message: 'Impossible de joindre la salle'
    });
  }
});

// Quitter une salle
router.post('/:roomId/leave', (req, res) => {
  const { roomId } = req.params;
  const { participantId } = req.body;
  
  if (!rooms.has(roomId)) {
    return res.status(404).json({
      success: false,
      message: 'Salle non trouvée'
    });
  }
  
  const room = rooms.get(roomId);
  
  // Remove participant
  room.participants = room.participants.filter(p => p.id !== participantId);
  
  // If room is empty, delete it
  if (room.participants.length === 0) {
    rooms.delete(roomId);
  }
  
  res.status(200).json({
    success: true,
    message: 'Salle quittée avec succès'
  });
});

module.exports = router;
