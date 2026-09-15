const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize database
require('./db');

const authRoutes = require('./routes/auth');
const memoriesRoutes = require('./routes/memories');
const diaryRoutes = require('./routes/diary');
const capsulesRoutes = require('./routes/capsules');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploads
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/capsules', capsulesRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Memory Vault API', time: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred',
  });
});

app.listen(PORT, () => {
  console.log(`✨ Memory Vault API server running on http://localhost:${PORT}`);
  console.log(`📁 Permanent media uploads directory: ${uploadDir}`);
});
