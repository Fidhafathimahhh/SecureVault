const { db, logActivity } = require('../database/db');
const { encryptBuffer, decryptBuffer } = require('../security/encryption');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

function getStorageDir() {
  const base = process.env.STORAGE_DIR || path.join(__dirname, '../../storage');
  const dir = path.join(base, 'vault_files');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function getFiles(req, res, next) {
  try {
    const { folderId, search, category } = req.query;

    let fileQuery = 'SELECT * FROM files WHERE user_id = ?';
    const params = [req.user.id];

    if (folderId !== undefined && folderId !== '' && folderId !== 'null') {
      fileQuery += ' AND folder_id = ?';
      params.push(folderId === 'root' ? null : parseInt(folderId, 10));
    }

    if (category) {
      fileQuery += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      fileQuery += ' AND original_name LIKE ?';
      params.push(`%${search}%`);
    }

    fileQuery += ' ORDER BY created_at DESC';

    const files = db.prepare(fileQuery).all(...params);

    // Fetch folders if in root or parent
    let folderQuery = 'SELECT * FROM folders WHERE user_id = ?';
    const folderParams = [req.user.id];
    if (folderId !== undefined && folderId !== '' && folderId !== 'null') {
      folderQuery += ' AND parent_id IS ?';
      folderParams.push(folderId === 'root' ? null : parseInt(folderId, 10));
    }
    folderQuery += ' ORDER BY name ASC';
    const folders = db.prepare(folderQuery).all(...folderParams);

    res.json({ files, folders });
  } catch (err) {
    next(err);
  }
}

async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { folderId, category } = req.body;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype || 'application/octet-stream';
    const fileSize = req.file.size;

    // Encrypt file buffer with AES-256-GCM
    const { encryptedBuffer, ivHex, authTagHex } = encryptBuffer(req.file.buffer, req.user.master_salt);

    const storedFilename = `${uuidv4()}.enc`;
    const targetPath = path.join(getStorageDir(), storedFilename);

    fs.writeFileSync(targetPath, encryptedBuffer);

    const parsedFolderId = folderId && folderId !== 'null' && folderId !== 'root' ? parseInt(folderId, 10) : null;

    const stmt = db.prepare(`
      INSERT INTO files (user_id, folder_id, original_name, stored_filename, file_size, mime_type, category, iv_hex, auth_tag_hex, encryption_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AES-256-GCM Encrypted')
    `);

    const result = stmt.run(
      req.user.id,
      parsedFolderId,
      originalName,
      storedFilename,
      fileSize,
      mimeType,
      category || 'General',
      ivHex,
      authTagHex
    );

    logActivity(req.user.id, 'FILE_UPLOADED', `Uploaded file: ${originalName} (${fileSize} bytes)`, req.ip);

    const newFile = db.prepare('SELECT * FROM files WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'File uploaded & encrypted successfully.', file: newFile });
  } catch (err) {
    next(err);
  }
}

async function downloadFile(req, res, next) {
  try {
    const fileId = parseInt(req.params.id, 10);
    const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(fileId, req.user.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found or access denied.' });
    }

    const filePath = path.join(getStorageDir(), file.stored_filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Physical storage file missing.' });
    }

    const encryptedBuffer = fs.readFileSync(filePath);
    const decryptedBuffer = decryptBuffer(encryptedBuffer, file.iv_hex, file.auth_tag_hex, req.user.master_salt);

    logActivity(req.user.id, 'FILE_DOWNLOADED', `Downloaded file: ${file.original_name}`, req.ip);

    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(decryptedBuffer);
  } catch (err) {
    next(err);
  }
}

async function deleteFile(req, res, next) {
  try {
    const fileId = parseInt(req.params.id, 10);
    const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(fileId, req.user.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found or access denied.' });
    }

    const filePath = path.join(getStorageDir(), file.stored_filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM files WHERE id = ? AND user_id = ?').run(fileId, req.user.id);

    logActivity(req.user.id, 'FILE_DELETED', `Deleted file: ${file.original_name}`, req.ip);

    res.json({ message: 'File deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function renameFile(req, res, next) {
  try {
    const fileId = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'File name cannot be empty.' });
    }

    const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(fileId, req.user.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found or access denied.' });
    }

    db.prepare('UPDATE files SET original_name = ? WHERE id = ? AND user_id = ?')
      .run(name.trim(), fileId, req.user.id);

    logActivity(req.user.id, 'FILE_RENAMED', `Renamed file to: ${name.trim()}`, req.ip);

    res.json({ message: 'File renamed successfully.' });
  } catch (err) {
    next(err);
  }
}

async function createFolder(req, res, next) {
  try {
    const { name, parentId } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required.' });
    }

    const parsedParentId = parentId && parentId !== 'null' ? parseInt(parentId, 10) : null;

    const stmt = db.prepare('INSERT INTO folders (user_id, name, parent_id) VALUES (?, ?, ?)');
    const result = stmt.run(req.user.id, name.trim(), parsedParentId);

    logActivity(req.user.id, 'FOLDER_CREATED', `Created folder: ${name.trim()}`, req.ip);

    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ folder });
  } catch (err) {
    next(err);
  }
}

async function deleteFolder(req, res, next) {
  try {
    const folderId = parseInt(req.params.id, 10);
    const folder = db.prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?').get(folderId, req.user.id);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found or access denied.' });
    }

    db.prepare('DELETE FROM folders WHERE id = ? AND user_id = ?').run(folderId, req.user.id);
    logActivity(req.user.id, 'FOLDER_DELETED', `Deleted folder: ${folder.name}`, req.ip);

    res.json({ message: 'Folder deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFiles,
  uploadFile,
  downloadFile,
  deleteFile,
  renameFile,
  createFolder,
  deleteFolder,
};
