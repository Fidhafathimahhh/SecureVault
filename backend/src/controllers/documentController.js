const { db, logActivity } = require('../database/db');
const { encryptBuffer, decryptBuffer } = require('../security/encryption');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

function getDocStorageDir() {
  const base = process.env.STORAGE_DIR || path.join(__dirname, '../../storage');
  const dir = path.join(base, 'vault_documents');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function getDocuments(req, res, next) {
  try {
    const { category, search } = req.query;

    let query = 'SELECT * FROM documents WHERE user_id = ?';
    const params = [req.user.id];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (title LIKE ? OR original_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const documents = db.prepare(query).all(...params);
    res.json({ documents });
  } catch (err) {
    next(err);
  }
}

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided.' });
    }

    const { title, category } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Document title is required.' });
    }

    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype || 'application/octet-stream';
    const fileSize = req.file.size;

    // Encrypt binary buffer using AES-256-GCM
    const { encryptedBuffer, ivHex, authTagHex } = encryptBuffer(req.file.buffer, req.user.master_salt);

    const storedFilename = `${uuidv4()}.doc.enc`;
    const targetPath = path.join(getDocStorageDir(), storedFilename);

    fs.writeFileSync(targetPath, encryptedBuffer);

    const stmt = db.prepare(`
      INSERT INTO documents (user_id, title, category, original_name, stored_filename, file_size, mime_type, iv_hex, auth_tag_hex, encryption_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AES-256-GCM Encrypted')
    `);

    const result = stmt.run(
      req.user.id,
      title.trim(),
      category || 'Identity',
      originalName,
      storedFilename,
      fileSize,
      mimeType,
      ivHex,
      authTagHex
    );

    logActivity(req.user.id, 'DOCUMENT_UPLOADED', `Uploaded document: ${title.trim()} (${category || 'Identity'})`, req.ip);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Document encrypted & saved successfully.', document: doc });
  } catch (err) {
    next(err);
  }
}

async function downloadDocument(req, res, next) {
  try {
    const docId = parseInt(req.params.id, 10);
    const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(docId, req.user.id);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    const filePath = path.join(getDocStorageDir(), doc.stored_filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Physical storage document missing.' });
    }

    const encryptedBuffer = fs.readFileSync(filePath);
    const decryptedBuffer = decryptBuffer(encryptedBuffer, doc.iv_hex, doc.auth_tag_hex, req.user.master_salt);

    logActivity(req.user.id, 'DOCUMENT_DOWNLOADED', `Downloaded document: ${doc.title}`, req.ip);

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.original_name)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(decryptedBuffer);
  } catch (err) {
    next(err);
  }
}

async function deleteDocument(req, res, next) {
  try {
    const docId = parseInt(req.params.id, 10);
    const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(docId, req.user.id);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    const filePath = path.join(getDocStorageDir(), doc.stored_filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM documents WHERE id = ? AND user_id = ?').run(docId, req.user.id);

    logActivity(req.user.id, 'DOCUMENT_DELETED', `Deleted document: ${doc.title}`, req.ip);

    res.json({ message: 'Document deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function renameDocument(req, res, next) {
  try {
    const docId = parseInt(req.params.id, 10);
    const { title, category } = req.body;

    const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(docId, req.user.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    db.prepare('UPDATE documents SET title = ?, category = ? WHERE id = ? AND user_id = ?')
      .run(title ? title.trim() : doc.title, category || doc.category, docId, req.user.id);

    logActivity(req.user.id, 'DOCUMENT_UPDATED', `Updated document details for: ${title || doc.title}`, req.ip);

    res.json({ message: 'Document details updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  renameDocument,
};
