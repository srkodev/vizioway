
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// Routes
const roomsRouter = require('./routes/rooms');
const usersRouter = require('./routes/users');

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

// Routes
app.use('/api/rooms', roomsRouter);
app.use('/api/users', usersRouter);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Vizioway API est opérationnelle!' });
});

// Socket.io handling
const rooms = new Map();

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userName = decoded.name;
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
  
  // Gérer la déconnexion
  socket.on('disconnect', () => {
    console.log(`Utilisateur déconnecté: ${socket.userName} (${socket.userId})`);
    
    // Rechercher toutes les salles où l'utilisateur était présent
    for (const [roomId, room] of rooms.entries()) {
      if (room.participants.has(socket.userId)) {
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = { app, io };
