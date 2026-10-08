const { db, logActivity } = require('../database/db');
const { encryptText, decryptText } = require('../security/encryption');

async function getPasswords(req, res, next) {
  try {
    const { category, search, favorite } = req.query;

    let query = 'SELECT id, user_id, title, username, url, category, is_favorite, created_at, updated_at FROM passwords WHERE user_id = ?';
    const params = [req.user.id];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (favorite === 'true') {
      query += ' AND is_favorite = 1';
    }

    if (search) {
      query += ' AND (title LIKE ? OR username LIKE ? OR url LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY is_favorite DESC, title ASC';

    const passwords = db.prepare(query).all(...params);
    res.json({ passwords });
  } catch (err) {
    next(err);
  }
}

async function createPassword(req, res, next) {
  try {
    const { title, username, password, url, category, notes } = req.body;

    if (!title || !password) {
      return res.status(400).json({ error: 'Title and Password are required.' });
    }

    const encryptedPassword = encryptText(password, req.user.master_salt);
    const encryptedNotes = notes ? encryptText(notes, req.user.master_salt) : '';

    const stmt = db.prepare(`
      INSERT INTO passwords (user_id, title, username, encrypted_password, url, category, encrypted_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.user.id,
      title.trim(),
      username ? username.trim() : '',
      encryptedPassword,
      url ? url.trim() : '',
      category || 'General',
      encryptedNotes
    );

    logActivity(req.user.id, 'PASSWORD_CREATED', `Created password entry: ${title.trim()}`, req.ip);

    res.status(201).json({ message: 'Password entry created & encrypted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function revealPassword(req, res, next) {
  try {
    const passwordId = parseInt(req.params.id, 10);
    const entry = db.prepare('SELECT * FROM passwords WHERE id = ? AND user_id = ?').get(passwordId, req.user.id);

    if (!entry) {
      return res.status(404).json({ error: 'Password entry not found or access denied.' });
    }

    const decryptedPassword = decryptText(entry.encrypted_password, req.user.master_salt);
    const decryptedNotes = entry.encrypted_notes ? decryptText(entry.encrypted_notes, req.user.master_salt) : '';

    logActivity(req.user.id, 'PASSWORD_VIEWED', `Viewed password for: ${entry.title}`, req.ip);

    res.json({
      id: entry.id,
      title: entry.title,
      username: entry.username,
      password: decryptedPassword,
      url: entry.url,
      category: entry.category,
      notes: decryptedNotes,
      is_favorite: entry.is_favorite,
    });
  } catch (err) {
    next(err);
  }
}

async function updatePassword(req, res, next) {
  try {
    const passwordId = parseInt(req.params.id, 10);
    const { title, username, password, url, category, notes } = req.body;

    const entry = db.prepare('SELECT * FROM passwords WHERE id = ? AND user_id = ?').get(passwordId, req.user.id);
    if (!entry) {
      return res.status(404).json({ error: 'Password entry not found or access denied.' });
    }

    const encryptedPassword = password ? encryptText(password, req.user.master_salt) : entry.encrypted_password;
    const encryptedNotes = notes !== undefined ? encryptText(notes, req.user.master_salt) : entry.encrypted_notes;

    db.prepare(`
      UPDATE passwords 
      SET title = ?, username = ?, encrypted_password = ?, url = ?, category = ?, encrypted_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      title ? title.trim() : entry.title,
      username !== undefined ? username.trim() : entry.username,
      encryptedPassword,
      url !== undefined ? url.trim() : entry.url,
      category || entry.category,
      encryptedNotes,
      passwordId,
      req.user.id
    );

    logActivity(req.user.id, 'PASSWORD_UPDATED', `Updated password entry: ${title || entry.title}`, req.ip);

    res.json({ message: 'Password entry updated successfully.' });
  } catch (err) {
    next(err);
  }
}

async function deletePassword(req, res, next) {
  try {
    const passwordId = parseInt(req.params.id, 10);
    const entry = db.prepare('SELECT title FROM passwords WHERE id = ? AND user_id = ?').get(passwordId, req.user.id);

    if (!entry) {
      return res.status(404).json({ error: 'Password entry not found or access denied.' });
    }

    db.prepare('DELETE FROM passwords WHERE id = ? AND user_id = ?').run(passwordId, req.user.id);

    logActivity(req.user.id, 'PASSWORD_DELETED', `Deleted password entry: ${entry.title}`, req.ip);

    res.json({ message: 'Password entry deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function toggleFavorite(req, res, next) {
  try {
    const passwordId = parseInt(req.params.id, 10);
    const entry = db.prepare('SELECT is_favorite FROM passwords WHERE id = ? AND user_id = ?').get(passwordId, req.user.id);

    if (!entry) {
      return res.status(404).json({ error: 'Password entry not found or access denied.' });
    }

    const newFav = entry.is_favorite ? 0 : 1;
    db.prepare('UPDATE passwords SET is_favorite = ? WHERE id = ? AND user_id = ?').run(newFav, passwordId, req.user.id);

    res.json({ is_favorite: newFav });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPasswords,
  createPassword,
  revealPassword,
  updatePassword,
  deletePassword,
  toggleFavorite,
};
