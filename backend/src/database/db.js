const fs = require('fs');
const path = require('path');

const dbFilePath = path.join(__dirname, '../../vault_db.json');

// Default initial state
const initialState = {
  users: [],
  sessions: [],
  folders: [],
  files: [],
  passwords: [],
  notes: [],
  documents: [],
  activity_logs: [],
  counters: {
    users: 0,
    folders: 0,
    files: 0,
    passwords: 0,
    notes: 0,
    documents: 0,
    activity_logs: 0,
  }
};

let memoryDb = null;

function loadDb() {
  if (memoryDb) return memoryDb;
  if (fs.existsSync(dbFilePath)) {
    try {
      const data = fs.readFileSync(dbFilePath, 'utf8');
      memoryDb = JSON.parse(data);
      // Ensure all collections exist
      Object.keys(initialState).forEach((key) => {
        if (!memoryDb[key]) memoryDb[key] = initialState[key];
      });
      return memoryDb;
    } catch (e) {
      console.error('Failed to parse database file, resetting to initial state:', e);
    }
  }
  memoryDb = JSON.parse(JSON.stringify(initialState));
  saveDb();
  return memoryDb;
}

function saveDb() {
  if (!memoryDb) return;
  const tempPath = `${dbFilePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(memoryDb, null, 2), 'utf8');
  fs.renameSync(tempPath, dbFilePath);
}

// Database helper engine mimicking SQLite prepare/get/all/run API
class PreparedStatement {
  constructor(sql) {
    this.sql = sql.trim();
  }

  run(...params) {
    const dbData = loadDb();
    const sql = this.sql;

    // USERS INSERT
    if (sql.includes('INSERT INTO users')) {
      const [email, password_hash, master_salt, auto_lock_minutes] = params;
      dbData.counters.users += 1;
      const newUser = {
        id: dbData.counters.users,
        email,
        password_hash,
        master_salt,
        auto_lock_minutes: auto_lock_minutes || 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      dbData.users.push(newUser);
      saveDb();
      return { lastInsertRowid: newUser.id, changes: 1 };
    }

    // USERS UPDATE
    if (sql.includes('UPDATE users')) {
      if (sql.includes('password_hash =')) {
        const [hash, userId] = params;
        const u = dbData.users.find(x => x.id === userId);
        if (u) {
          u.password_hash = hash;
          u.updated_at = new Date().toISOString();
          saveDb();
          return { changes: 1 };
        }
      }
      if (sql.includes('auto_lock_minutes =')) {
        const [minutes, userId] = params;
        const u = dbData.users.find(x => x.id === userId);
        if (u) {
          u.auto_lock_minutes = minutes;
          saveDb();
          return { changes: 1 };
        }
      }
    }

    // USERS DELETE
    if (sql.includes('DELETE FROM users')) {
      const [userId] = params;
      dbData.users = dbData.users.filter(x => x.id !== userId);
      dbData.sessions = dbData.sessions.filter(x => x.user_id !== userId);
      dbData.files = dbData.files.filter(x => x.user_id !== userId);
      dbData.folders = dbData.folders.filter(x => x.user_id !== userId);
      dbData.passwords = dbData.passwords.filter(x => x.user_id !== userId);
      dbData.notes = dbData.notes.filter(x => x.user_id !== userId);
      dbData.documents = dbData.documents.filter(x => x.user_id !== userId);
      dbData.activity_logs = dbData.activity_logs.filter(x => x.user_id !== userId);
      saveDb();
      return { changes: 1 };
    }

    // SESSIONS INSERT
    if (sql.includes('INSERT INTO sessions')) {
      const [id, user_id, token, ip_address, user_agent, expires_at] = params;
      const sess = {
        id,
        user_id,
        token,
        ip_address,
        user_agent,
        expires_at,
        created_at: new Date().toISOString(),
      };
      dbData.sessions.push(sess);
      saveDb();
      return { lastInsertRowid: id, changes: 1 };
    }

    // SESSIONS DELETE
    if (sql.includes('DELETE FROM sessions')) {
      if (sql.includes('WHERE id = ? AND user_id = ?')) {
        const [id, userId] = params;
        const initialCount = dbData.sessions.length;
        dbData.sessions = dbData.sessions.filter(x => !(x.id === id && x.user_id === userId));
        saveDb();
        return { changes: initialCount - dbData.sessions.length };
      }
      if (sql.includes('WHERE id = ?')) {
        const [id] = params;
        dbData.sessions = dbData.sessions.filter(x => x.id !== id);
        saveDb();
        return { changes: 1 };
      }
      if (sql.includes('WHERE user_id = ? AND id != ?')) {
        const [userId, currentSessionId] = params;
        dbData.sessions = dbData.sessions.filter(x => !(x.user_id === userId && x.id !== currentSessionId));
        saveDb();
        return { changes: 1 };
      }
      if (sql.includes('WHERE user_id = ?')) {
        const [userId] = params;
        dbData.sessions = dbData.sessions.filter(x => x.user_id !== userId);
        saveDb();
        return { changes: 1 };
      }
    }

    // FOLDERS INSERT
    if (sql.includes('INSERT INTO folders')) {
      const [user_id, name, parent_id] = params;
      dbData.counters.folders += 1;
      const folder = {
        id: dbData.counters.folders,
        user_id,
        name,
        parent_id: parent_id || null,
        created_at: new Date().toISOString(),
      };
      dbData.folders.push(folder);
      saveDb();
      return { lastInsertRowid: folder.id, changes: 1 };
    }

    // FOLDERS DELETE
    if (sql.includes('DELETE FROM folders')) {
      const [folderId, userId] = params;
      dbData.folders = dbData.folders.filter(x => !(x.id === folderId && x.user_id === userId));
      saveDb();
      return { changes: 1 };
    }

    // FILES INSERT
    if (sql.includes('INSERT INTO files')) {
      const [user_id, folder_id, original_name, stored_filename, file_size, mime_type, category, iv_hex, auth_tag_hex] = params;
      dbData.counters.files += 1;
      const file = {
        id: dbData.counters.files,
        user_id,
        folder_id: folder_id || null,
        original_name,
        stored_filename,
        file_size,
        mime_type,
        category: category || 'General',
        iv_hex,
        auth_tag_hex,
        encryption_status: 'AES-256-GCM Encrypted',
        created_at: new Date().toISOString(),
      };
      dbData.files.push(file);
      saveDb();
      return { lastInsertRowid: file.id, changes: 1 };
    }

    // FILES UPDATE
    if (sql.includes('UPDATE files SET original_name')) {
      const [name, fileId, userId] = params;
      const f = dbData.files.find(x => x.id === fileId && x.user_id === userId);
      if (f) {
        f.original_name = name;
        saveDb();
        return { changes: 1 };
      }
    }

    // FILES DELETE
    if (sql.includes('DELETE FROM files')) {
      const [fileId, userId] = params;
      dbData.files = dbData.files.filter(x => !(x.id === fileId && x.user_id === userId));
      saveDb();
      return { changes: 1 };
    }

    // PASSWORDS INSERT
    if (sql.includes('INSERT INTO passwords')) {
      const [user_id, title, username, encrypted_password, url, category, encrypted_notes] = params;
      dbData.counters.passwords += 1;
      const p = {
        id: dbData.counters.passwords,
        user_id,
        title,
        username: username || '',
        encrypted_password,
        url: url || '',
        category: category || 'General',
        encrypted_notes: encrypted_notes || '',
        is_favorite: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      dbData.passwords.push(p);
      saveDb();
      return { lastInsertRowid: p.id, changes: 1 };
    }

    // PASSWORDS UPDATE
    if (sql.includes('UPDATE passwords')) {
      if (sql.includes('is_favorite = ?')) {
        const [fav, id, userId] = params;
        const p = dbData.passwords.find(x => x.id === id && x.user_id === userId);
        if (p) {
          p.is_favorite = fav;
          saveDb();
          return { changes: 1 };
        }
      } else {
        const [title, username, encrypted_password, url, category, encrypted_notes, id, userId] = params;
        const p = dbData.passwords.find(x => x.id === id && x.user_id === userId);
        if (p) {
          p.title = title;
          p.username = username;
          p.encrypted_password = encrypted_password;
          p.url = url;
          p.category = category;
          p.encrypted_notes = encrypted_notes;
          p.updated_at = new Date().toISOString();
          saveDb();
          return { changes: 1 };
        }
      }
    }

    // PASSWORDS DELETE
    if (sql.includes('DELETE FROM passwords')) {
      const [id, userId] = params;
      dbData.passwords = dbData.passwords.filter(x => !(x.id === id && x.user_id === userId));
      saveDb();
      return { changes: 1 };
    }

    // NOTES INSERT
    if (sql.includes('INSERT INTO notes')) {
      const [user_id, title, encrypted_content, tags] = params;
      dbData.counters.notes += 1;
      const n = {
        id: dbData.counters.notes,
        user_id,
        title,
        encrypted_content,
        tags: tags || '',
        is_favorite: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      dbData.notes.push(n);
      saveDb();
      return { lastInsertRowid: n.id, changes: 1 };
    }

    // NOTES UPDATE
    if (sql.includes('UPDATE notes')) {
      if (sql.includes('is_favorite = ?')) {
        const [fav, id, userId] = params;
        const n = dbData.notes.find(x => x.id === id && x.user_id === userId);
        if (n) {
          n.is_favorite = fav;
          saveDb();
          return { changes: 1 };
        }
      } else {
        const [title, encrypted_content, tags, id, userId] = params;
        const n = dbData.notes.find(x => x.id === id && x.user_id === userId);
        if (n) {
          n.title = title;
          n.encrypted_content = encrypted_content;
          n.tags = tags;
          n.updated_at = new Date().toISOString();
          saveDb();
          return { changes: 1 };
        }
      }
    }

    // NOTES DELETE
    if (sql.includes('DELETE FROM notes')) {
      const [id, userId] = params;
      dbData.notes = dbData.notes.filter(x => !(x.id === id && x.user_id === userId));
      saveDb();
      return { changes: 1 };
    }

    // DOCUMENTS INSERT
    if (sql.includes('INSERT INTO documents')) {
      const [user_id, title, category, original_name, stored_filename, file_size, mime_type, iv_hex, auth_tag_hex] = params;
      dbData.counters.documents += 1;
      const doc = {
        id: dbData.counters.documents,
        user_id,
        title,
        category: category || 'Identity',
        original_name,
        stored_filename,
        file_size,
        mime_type,
        iv_hex,
        auth_tag_hex,
        encryption_status: 'AES-256-GCM Encrypted',
        created_at: new Date().toISOString(),
      };
      dbData.documents.push(doc);
      saveDb();
      return { lastInsertRowid: doc.id, changes: 1 };
    }

    // DOCUMENTS UPDATE
    if (sql.includes('UPDATE documents')) {
      const [title, category, docId, userId] = params;
      const doc = dbData.documents.find(x => x.id === docId && x.user_id === userId);
      if (doc) {
        doc.title = title;
        doc.category = category;
        saveDb();
        return { changes: 1 };
      }
    }

    // DOCUMENTS DELETE
    if (sql.includes('DELETE FROM documents')) {
      const [docId, userId] = params;
      dbData.documents = dbData.documents.filter(x => !(x.id === docId && x.user_id === userId));
      saveDb();
      return { changes: 1 };
    }

    // ACTIVITY LOGS INSERT
    if (sql.includes('INSERT INTO activity_logs')) {
      const [user_id, event_type, details, ip_address] = params;
      dbData.counters.activity_logs += 1;
      const log = {
        id: dbData.counters.activity_logs,
        user_id,
        event_type,
        details,
        ip_address: ip_address || '127.0.0.1',
        created_at: new Date().toISOString(),
      };
      dbData.activity_logs.push(log);
      saveDb();
      return { lastInsertRowid: log.id, changes: 1 };
    }

    return { changes: 0 };
  }

  get(...params) {
    const results = this.all(...params);
    return results.length > 0 ? results[0] : undefined;
  }

  all(...params) {
    const dbData = loadDb();
    const sql = this.sql;

    // USERS SELECT
    if (sql.includes('FROM users')) {
      if (sql.includes('WHERE email = ?')) {
        const [email] = params;
        return dbData.users.filter(x => x.email.toLowerCase() === (email || '').toLowerCase());
      }
      if (sql.includes('WHERE id = ?')) {
        const [id] = params;
        return dbData.users.filter(x => x.id === id);
      }
    }

    // SESSIONS SELECT
    if (sql.includes('FROM sessions')) {
      if (sql.includes('WHERE id = ? AND user_id = ?')) {
        const [id, userId] = params;
        return dbData.sessions.filter(x => x.id === id && x.user_id === userId && new Date(x.expires_at) > new Date());
      }
      if (sql.includes('WHERE user_id = ? AND expires_at > datetime("now")')) {
        const [userId] = params;
        return dbData.sessions.filter(x => x.user_id === userId && new Date(x.expires_at) > new Date());
      }
      if (sql.includes('COUNT(*)')) {
        const [userId] = params;
        const count = dbData.sessions.filter(x => x.user_id === userId && new Date(x.expires_at) > new Date()).length;
        return [{ count }];
      }
    }

    // FOLDERS SELECT
    if (sql.includes('FROM folders')) {
      const [userId] = params;
      let res = dbData.folders.filter(x => x.user_id === userId);
      if (params.length > 1) {
        const parentId = params[1];
        res = res.filter(x => x.parent_id === parentId);
      }
      return res;
    }

    // FILES SELECT
    if (sql.includes('FROM files')) {
      if (sql.includes('COUNT(*)')) {
        const [userId] = params;
        const count = dbData.files.filter(x => x.user_id === userId).length;
        return [{ count }];
      }
      if (sql.includes('SUM(file_size)')) {
        const [userId] = params;
        const size = dbData.files.filter(x => x.user_id === userId).reduce((acc, f) => acc + (f.file_size || 0), 0);
        return [{ size }];
      }
      if (sql.includes('WHERE id = ? AND user_id = ?')) {
        const [id, userId] = params;
        return dbData.files.filter(x => x.id === id && x.user_id === userId);
      }
      if (sql.includes('WHERE stored_filename = ?') || sql.includes('SELECT stored_filename FROM files')) {
        const [userId] = params;
        return dbData.files.filter(x => x.user_id === userId);
      }

      let res = dbData.files.filter(x => x.user_id === params[0]);
      // Folder, category, search filter processing
      if (sql.includes('folder_id = ?')) {
        const folderId = params[1];
        res = res.filter(x => x.folder_id === folderId);
      }
      if (sql.includes('category = ?')) {
        const cat = params[sql.includes('folder_id = ?') ? 2 : 1];
        res = res.filter(x => x.category === cat);
      }
      if (sql.includes('original_name LIKE ?')) {
        const searchTerm = params[params.length - 1].replace(/%/g, '').toLowerCase();
        res = res.filter(x => x.original_name.toLowerCase().includes(searchTerm));
      }

      return res;
    }

    // PASSWORDS SELECT
    if (sql.includes('FROM passwords')) {
      if (sql.includes('COUNT(*)')) {
        const [userId] = params;
        const count = dbData.passwords.filter(x => x.user_id === userId).length;
        return [{ count }];
      }
      if (sql.includes('WHERE id = ? AND user_id = ?')) {
        const [id, userId] = params;
        return dbData.passwords.filter(x => x.id === id && x.user_id === userId);
      }

      let res = dbData.passwords.filter(x => x.user_id === params[0]);
      if (sql.includes('category = ?')) {
        const cat = params[1];
        res = res.filter(x => x.category === cat);
      }
      if (sql.includes('is_favorite = 1')) {
        res = res.filter(x => x.is_favorite === 1);
      }
      if (sql.includes('LIKE ?')) {
        const searchTerm = params[params.length - 1].replace(/%/g, '').toLowerCase();
        res = res.filter(x =>
          x.title.toLowerCase().includes(searchTerm) ||
          (x.username && x.username.toLowerCase().includes(searchTerm)) ||
          (x.url && x.url.toLowerCase().includes(searchTerm))
        );
      }
      return res;
    }

    // NOTES SELECT
    if (sql.includes('FROM notes')) {
      if (sql.includes('COUNT(*)')) {
        const [userId] = params;
        const count = dbData.notes.filter(x => x.user_id === userId).length;
        return [{ count }];
      }
      if (sql.includes('WHERE id = ? AND user_id = ?')) {
        const [id, userId] = params;
        return dbData.notes.filter(x => x.id === id && x.user_id === userId);
      }

      let res = dbData.notes.filter(x => x.user_id === params[0]);
      if (sql.includes('is_favorite = 1')) {
        res = res.filter(x => x.is_favorite === 1);
      }
      if (sql.includes('tags LIKE ?')) {
        const tagTerm = params[1].replace(/%/g, '').toLowerCase();
        res = res.filter(x => x.tags && x.tags.toLowerCase().includes(tagTerm));
      }
      if (sql.includes('title LIKE ?')) {
        const searchTerm = params[params.length - 1].replace(/%/g, '').toLowerCase();
        res = res.filter(x => x.title.toLowerCase().includes(searchTerm) || (x.tags && x.tags.toLowerCase().includes(searchTerm)));
      }
      return res;
    }

    // DOCUMENTS SELECT
    if (sql.includes('FROM documents')) {
      if (sql.includes('COUNT(*)')) {
        const [userId] = params;
        const count = dbData.documents.filter(x => x.user_id === userId).length;
        return [{ count }];
      }
      if (sql.includes('SUM(file_size)')) {
        const [userId] = params;
        const size = dbData.documents.filter(x => x.user_id === userId).reduce((acc, d) => acc + (d.file_size || 0), 0);
        return [{ size }];
      }
      if (sql.includes('WHERE stored_filename = ?') || sql.includes('SELECT stored_filename FROM documents')) {
        const [userId] = params;
        return dbData.documents.filter(x => x.user_id === userId);
      }
      if (sql.includes('WHERE id = ? AND user_id = ?')) {
        const [id, userId] = params;
        return dbData.documents.filter(x => x.id === id && x.user_id === userId);
      }

      let res = dbData.documents.filter(x => x.user_id === params[0]);
      if (sql.includes('category = ?')) {
        const cat = params[1];
        res = res.filter(x => x.category === cat);
      }
      if (sql.includes('LIKE ?')) {
        const searchTerm = params[params.length - 1].replace(/%/g, '').toLowerCase();
        res = res.filter(x => x.title.toLowerCase().includes(searchTerm) || x.original_name.toLowerCase().includes(searchTerm));
      }
      return res;
    }

    // ACTIVITY LOGS SELECT
    if (sql.includes('FROM activity_logs')) {
      if (sql.includes('COUNT(*)')) {
        const [userId] = params;
        const count = dbData.activity_logs.filter(x => x.user_id === userId).length;
        return [{ count }];
      }
      let res = dbData.activity_logs.filter(x => x.user_id === params[0]);
      if (sql.includes('event_type = "USER_LOGIN"')) {
        res = res.filter(x => x.event_type === 'USER_LOGIN');
      }
      res.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      if (sql.includes('LIMIT 1')) return res.slice(0, 1);
      if (sql.includes('LIMIT 6')) return res.slice(0, 6);
      if (sql.includes('LIMIT 100')) return res.slice(0, 100);
      return res;
    }

    return [];
  }
}

const db = {
  prepare(sql) {
    return new PreparedStatement(sql);
  },
  exec(sql) {
    // No-op for init schema since json state initializes automatically
    loadDb();
  },
  pragma(sql) {
    // No-op for pragma commands
  }
};

function logActivity(userId, eventType, details, ipAddress = '127.0.0.1') {
  try {
    const stmt = db.prepare('INSERT INTO activity_logs (user_id, event_type, details, ip_address) VALUES (?, ?, ?, ?)');
    stmt.run(userId, eventType, details, ipAddress);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

loadDb();

module.exports = {
  db,
  logActivity,
};
