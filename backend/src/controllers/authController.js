const { db, logActivity } = require('../database/db');
const { hashPassword, verifyPassword } = require('../security/hasher');
const { generateSalt } = require('../security/encryption');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_vault_jwt_secret_key_987654321_alpha_beta';

async function register(req, res, next) {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    // Check existing email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const masterSalt = generateSalt(16);

    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, master_salt, auto_lock_minutes)
      VALUES (?, ?, ?, 15)
    `);
    const result = stmt.run(email.toLowerCase().trim(), passwordHash, masterSalt);

    const userId = result.lastInsertRowid;
    logActivity(userId, 'ACCOUNT_CREATED', 'Account registered successfully', req.ip);

    res.status(201).json({
      message: 'Account created successfully. Please log in.',
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate Session ID
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const token = jwt.sign(
      { userId: user.id, email: user.email, sessionId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Save session in DB
    db.prepare(`
      INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionId, user.id, token, req.ip || '', req.get('User-Agent') || '', expiresAt);

    logActivity(user.id, 'USER_LOGIN', 'User logged in successfully', req.ip);

    res.cookie('vault_token', token, {
      httpOnly: true,
      secure: false, // Set to true in production HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        auto_lock_minutes: user.auto_lock_minutes,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (req.sessionId) {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(req.sessionId);
      logActivity(req.user.id, 'USER_LOGOUT', 'User logged out', req.ip);
    }
    res.clearCookie('vault_token');
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

async function logoutAll(req, res, next) {
  try {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.user.id);
    logActivity(req.user.id, 'USER_LOGOUT_ALL', 'Logged out from all active sessions', req.ip);
    res.clearCookie('vault_token');
    res.json({ message: 'All active sessions terminated successfully.' });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        auto_lock_minutes: req.user.auto_lock_minutes,
        created_at: req.user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newHash, req.user.id);

    // Revoke all other sessions
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').run(req.user.id, req.sessionId);

    logActivity(req.user.id, 'PASSWORD_CHANGED', 'Master password changed', req.ip);

    res.json({ message: 'Password updated successfully. Other sessions terminated.' });
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Current password is required to delete account.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Password is incorrect.' });
    }

    // Clean up physical file storage for user
    const files = db.prepare('SELECT stored_filename FROM files WHERE user_id = ?').all(req.user.id);
    const docs = db.prepare('SELECT stored_filename FROM documents WHERE user_id = ?').all(req.user.id);

    const storageBase = process.env.STORAGE_DIR || path.join(__dirname, '../../storage');
    const vaultFilesDir = path.join(storageBase, 'vault_files');
    const vaultDocsDir = path.join(storageBase, 'vault_documents');

    [...files, ...docs].forEach((item) => {
      const filePath = path.join(vaultFilesDir, item.stored_filename);
      const docPath = path.join(vaultDocsDir, item.stored_filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (fs.existsSync(docPath)) fs.unlinkSync(docPath);
    });

    // Cascade delete in database
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);

    res.clearCookie('vault_token');
    res.json({ message: 'Account and all associated vault data permanently deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  logoutAll,
  getMe,
  changePassword,
  deleteAccount,
};
