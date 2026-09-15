const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vault_super_secret_tragic_memory_key_2026';

const requireAuth = (req, res, next) => {
  // Support Authorization header or query parameter for media embedding
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, name }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

module.exports = {
  requireAuth,
  JWT_SECRET
};
