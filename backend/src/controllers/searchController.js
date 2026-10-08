const { db } = require('../database/db');
const { decryptText } = require('../security/encryption');

async function searchVault(req, res, next) {
  try {
    const q = req.query.q ? req.query.q.trim() : '';

    if (!q) {
      return res.json({ files: [], passwords: [], notes: [], documents: [] });
    }

    const pattern = `%${q}%`;

    // 1. Files
    const files = db.prepare(`
      SELECT id, original_name, file_size, mime_type, created_at, 'file' as type
      FROM files 
      WHERE user_id = ? AND original_name LIKE ?
      LIMIT 20
    `).all(req.user.id, pattern);

    // 2. Passwords
    const passwords = db.prepare(`
      SELECT id, title, username, url, category, is_favorite, 'password' as type
      FROM passwords 
      WHERE user_id = ? AND (title LIKE ? OR username LIKE ? OR url LIKE ?)
      LIMIT 20
    `).all(req.user.id, pattern, pattern, pattern);

    // 3. Notes
    const rawNotes = db.prepare(`
      SELECT id, title, encrypted_content, tags, is_favorite, created_at, 'note' as type
      FROM notes 
      WHERE user_id = ? AND (title LIKE ? OR tags LIKE ?)
      LIMIT 20
    `).all(req.user.id, pattern, pattern);

    const notes = rawNotes.map((n) => {
      let preview = '';
      try {
        const full = decryptText(n.encrypted_content, req.user.master_salt);
        preview = full.slice(0, 80);
      } catch (e) {
        preview = '';
      }
      return {
        id: n.id,
        title: n.title,
        tags: n.tags ? n.tags.split(',') : [],
        preview,
        type: 'note',
      };
    });

    // 4. Documents
    const documents = db.prepare(`
      SELECT id, title, category, original_name, file_size, mime_type, created_at, 'document' as type
      FROM documents 
      WHERE user_id = ? AND (title LIKE ? OR original_name LIKE ?)
      LIMIT 20
    `).all(req.user.id, pattern, pattern);

    res.json({
      files,
      passwords,
      notes,
      documents,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  searchVault,
};
