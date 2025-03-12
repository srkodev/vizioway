
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const roomsRouter = require('./routes/rooms');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Base route pour vérifier que le serveur est en marche
app.get('/', (req, res) => {
  res.json({ message: 'CoZoomia API est opérationnelle!' });
});

// Middleware de gestion d'erreur
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
