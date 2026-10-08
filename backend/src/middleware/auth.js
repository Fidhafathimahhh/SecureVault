const jwt = require('jsonwebtoken');
const { db } = require('../database/db');

function authMiddleware(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.vault_token) {
      token = req.cookies.vault_token;
    } else if (req.headers['x-vault-token']) {
      token = req.headers['x-vault-token'];
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const secret = process.env.JWT_SECRET || 'super_secure_vault_jwt_secret_key_987654321_alpha_beta';
    const decoded = jwt.verify(token, secret);

    // Verify session existence in database for immediate session revocation support
    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ? AND expires_at > datetime("now")')
      .get(decoded.sessionId, decoded.userId);

    if (!session) {
      return res.status(401).json({ error: 'Session has expired or been terminated. Please log in again.' });
    }

    // Fetch user details
    const user = db.prepare('SELECT id, email, master_salt, auto_lock_minutes, created_at FROM users WHERE id = ?')
      .get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    req.user = user;
    req.sessionId = session.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

module.exports = authMiddleware;
