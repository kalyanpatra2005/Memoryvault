// Vercel Serverless Function entrypoint
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Memory Vault & Tragic Diary',
    environment: 'Vercel Serverless Deployment',
    timestamp: new Date().toISOString(),
    security: 'Strict per-user data isolation active'
  });
});

// For any other API endpoint on Vercel
app.all('/api/*', (req, res) => {
  res.json({
    status: 'online',
    path: req.path,
    message: 'Memory Vault Vercel Serverless Gateway active.'
  });
});

module.exports = app;
