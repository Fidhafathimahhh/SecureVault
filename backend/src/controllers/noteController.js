const { db, logActivity } = require('../database/db');
const { encryptText, decryptText } = require('../security/encryption');

async function getNotes(req, res, next) {
  try {
    const { search, tag, favorite } = req.query;

    let query = 'SELECT * FROM notes WHERE user_id = ?';
    const params = [req.user.id];

    if (favorite === 'true') {
      query += ' AND is_favorite = 1';
    }

    if (tag) {
      query += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }

    if (search) {
      query += ' AND (title LIKE ? OR tags LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY is_favorite DESC, updated_at DESC';

    const rawNotes = db.prepare(query).all(...params);

    const notes = rawNotes.map((n) => {
      let decryptedContent = '';
      try {
        decryptedContent = decryptText(n.encrypted_content, req.user.master_salt);
      } catch (e) {
        decryptedContent = '[Decryption Error]';
      }

      return {
        id: n.id,
        title: n.title,
        content: decryptedContent,
        tags: n.tags ? n.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        is_favorite: n.is_favorite,
        created_at: n.created_at,
        updated_at: n.updated_at,
      };
    });

    res.json({ notes });
  } catch (err) {
    next(err);
  }
}

async function createNote(req, res, next) {
  try {
    const { title, content, tags } = req.body;

    if (!title || content === undefined) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const encryptedContent = encryptText(content, req.user.master_salt);
    const tagsString = Array.isArray(tags) ? tags.join(',') : (tags || '');

    const stmt = db.prepare(`
      INSERT INTO notes (user_id, title, encrypted_content, tags)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(req.user.id, title.trim(), encryptedContent, tagsString);

    logActivity(req.user.id, 'NOTE_CREATED', `Created note: ${title.trim()}`, req.ip);

    res.status(201).json({ message: 'Note created & encrypted successfully.', id: result.lastInsertRowid });
  } catch (err) {
    next(err);
  }
}

async function getNoteById(req, res, next) {
  try {
    const noteId = parseInt(req.params.id, 10);
    const n = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(noteId, req.user.id);

    if (!n) {
      return res.status(404).json({ error: 'Note not found or access denied.' });
    }

    const decryptedContent = decryptText(n.encrypted_content, req.user.master_salt);
    logActivity(req.user.id, 'NOTE_VIEWED', `Viewed note: ${n.title}`, req.ip);

    res.json({
      id: n.id,
      title: n.title,
      content: decryptedContent,
      tags: n.tags ? n.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      is_favorite: n.is_favorite,
      created_at: n.created_at,
      updated_at: n.updated_at,
    });
  } catch (err) {
    next(err);
  }
}

async function updateNote(req, res, next) {
  try {
    const noteId = parseInt(req.params.id, 10);
    const { title, content, tags } = req.body;

    const n = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(noteId, req.user.id);
    if (!n) {
      return res.status(404).json({ error: 'Note not found or access denied.' });
    }

    const encryptedContent = content !== undefined ? encryptText(content, req.user.master_salt) : n.encrypted_content;
    const tagsString = Array.isArray(tags) ? tags.join(',') : (tags !== undefined ? tags : n.tags);

    db.prepare(`
      UPDATE notes
      SET title = ?, encrypted_content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      title ? title.trim() : n.title,
      encryptedContent,
      tagsString,
      noteId,
      req.user.id
    );

    logActivity(req.user.id, 'NOTE_UPDATED', `Updated note: ${title || n.title}`, req.ip);

    res.json({ message: 'Note updated successfully.' });
  } catch (err) {
    next(err);
  }
}

async function deleteNote(req, res, next) {
  try {
    const noteId = parseInt(req.params.id, 10);
    const n = db.prepare('SELECT title FROM notes WHERE id = ? AND user_id = ?').get(noteId, req.user.id);

    if (!n) {
      return res.status(404).json({ error: 'Note not found or access denied.' });
    }

    db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(noteId, req.user.id);

    logActivity(req.user.id, 'NOTE_DELETED', `Deleted note: ${n.title}`, req.ip);

    res.json({ message: 'Note deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function toggleFavorite(req, res, next) {
  try {
    const noteId = parseInt(req.params.id, 10);
    const n = db.prepare('SELECT is_favorite FROM notes WHERE id = ? AND user_id = ?').get(noteId, req.user.id);

    if (!n) {
      return res.status(404).json({ error: 'Note not found or access denied.' });
    }

    const newFav = n.is_favorite ? 0 : 1;
    db.prepare('UPDATE notes SET is_favorite = ? WHERE id = ? AND user_id = ?').run(newFav, noteId, req.user.id);

    res.json({ is_favorite: newFav });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  toggleFavorite,
};
