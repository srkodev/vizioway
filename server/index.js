
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'vizioway-super-secret-key';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Base de données simulée (en production, utiliser MongoDB ou une autre BD)
const users = new Map();
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
    const decoded = jwt.verify(token, JWT_SECRET);
    
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

// ------ ROUTES UTILISATEURS ------

// Inscription
app.post('/api/users/register', async (req, res) => {
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
      JWT_SECRET,
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
app.post('/api/users/login', async (req, res) => {
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
      JWT_SECRET,
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
app.post('/api/users/guest', (req, res) => {
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
      JWT_SECRET,
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
app.get('/api/users/me', authenticate, (req, res) => {
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

// ------ ROUTES SALLES ------

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
app.post('/api/rooms/create', authenticate, (req, res) => {
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
app.post('/api/rooms/join-by-code', authenticate, (req, res) => {
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
app.get('/api/rooms/:roomId', authenticate, (req, res) => {
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
app.put('/api/rooms/:roomId/settings', authenticate, (req, res) => {
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

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Vizioway API est opérationnelle!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ------ SOCKET.IO ------

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userName = decoded.fullName || decoded.username;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log(`Utilisateur connecté: ${socket.userName} (${socket.userId})`);
  
  // Rejoindre une salle
  socket.on('join-room', ({ roomId }) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { participants: new Map() });
    }
    
    const room = rooms.get(roomId);
    
    // Ajouter le participant à la salle
    room.participants.set(socket.userId, {
      id: socket.userId,
      name: socket.userName,
      socketId: socket.id
    });
    
    // Rejoindre la salle socket.io
    socket.join(roomId);
    
    // Informer les autres participants
    socket.to(roomId).emit('user-joined', {
      userId: socket.userId,
      name: socket.userName
    });
    
    // Envoyer la liste des participants au nouvel arrivant
    socket.emit('room-participants', Array.from(room.participants.values()));
    
    console.log(`${socket.userName} a rejoint la salle ${roomId}`);
  });
  
  // Gérer les offres WebRTC
  socket.on('send-offer', ({ to, offer }) => {
    io.to(to).emit('receive-offer', {
      from: socket.userId,
      fromName: socket.userName,
      offer
    });
  });
  
  // Gérer les réponses WebRTC
  socket.on('send-answer', ({ to, answer }) => {
    io.to(to).emit('receive-answer', {
      from: socket.userId,
      answer
    });
  });
  
  // Gérer les ICE candidates
  socket.on('send-ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('receive-ice-candidate', {
      from: socket.userId,
      candidate
    });
  });
  
  // Gérer les messages du chat
  socket.on('send-message', ({ roomId, message }) => {
    const messageObj = {
      id: uuidv4(),
      senderId: socket.userId,
      senderName: socket.userName,
      text: message,
      timestamp: new Date()
    };
    
    io.to(roomId).emit('receive-message', messageObj);
  });
  
  // Gérer les changements d'état du média
  socket.on('media-state-change', ({ roomId, video, audio }) => {
    socket.to(roomId).emit('user-media-change', {
      userId: socket.userId,
      video,
      audio
    });
  });
  
  // Gérer le partage d'écran
  socket.on('screen-share-started', ({ roomId }) => {
    socket.to(roomId).emit('user-screen-share-started', {
      userId: socket.userId,
      name: socket.userName
    });
  });
  
  socket.on('screen-share-stopped', ({ roomId }) => {
    socket.to(roomId).emit('user-screen-share-stopped', {
      userId: socket.userId
    });
  });
  
  // Gérer la déconnexion
  socket.on('disconnect', () => {
    console.log(`Utilisateur déconnecté: ${socket.userName} (${socket.userId})`);
    
    // Rechercher toutes les salles où l'utilisateur était présent
    for (const [roomId, room] of rooms.entries()) {
      if (room.participants?.has(socket.userId)) {
        // Retirer l'utilisateur de la salle
        room.participants.delete(socket.userId);
        
        // Informer les autres participants
        socket.to(roomId).emit('user-left', {
          userId: socket.userId
        });
        
        // Si la salle est vide, la supprimer
        if (room.participants.size === 0) {
          rooms.delete(roomId);
          console.log(`Salle ${roomId} supprimée car vide`);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = { app, io };
