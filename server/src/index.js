const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { initDb } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Import API routes
const authRoutes = require('./routes/authRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const diaryRoutes = require('./routes/diaryRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/diary', diaryRoutes);

// System health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Memory Vault & Tragic Diary',
    timestamp: new Date().toISOString(),
    security: 'Strict per-user data isolation active'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal error occurred in the vault.'
  });
});

// Initialize database and boot server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`Memory Vault & Tragic Diary API Server is running`);
      console.log(`Port: http://localhost:${PORT}`);
      console.log(`Database: SQLite (Permanent Local Storage)`);
      console.log(`=================================================`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
