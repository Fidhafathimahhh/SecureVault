const { db } = require('../database/db');

async function getDashboardStats(req, res, next) {
  try {
    const totalFiles = db.prepare('SELECT COUNT(*) as count FROM files WHERE user_id = ?').get(req.user.id).count;
    const totalPasswords = db.prepare('SELECT COUNT(*) as count FROM passwords WHERE user_id = ?').get(req.user.id).count;
    const totalNotes = db.prepare('SELECT COUNT(*) as count FROM notes WHERE user_id = ?').get(req.user.id).count;
    const totalDocuments = db.prepare('SELECT COUNT(*) as count FROM documents WHERE user_id = ?').get(req.user.id).count;

    const fileStorage = db.prepare('SELECT SUM(file_size) as size FROM files WHERE user_id = ?').get(req.user.id).size || 0;
    const docStorage = db.prepare('SELECT SUM(file_size) as size FROM documents WHERE user_id = ?').get(req.user.id).size || 0;
    const totalStorageBytes = fileStorage + docStorage;

    const recentActivity = db.prepare(`
      SELECT id, event_type, details, created_at 
      FROM activity_logs 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 6
    `).all(req.user.id);

    res.json({
      stats: {
        filesCount: totalFiles,
        passwordsCount: totalPasswords,
        notesCount: totalNotes,
        documentsCount: totalDocuments,
        totalStorageBytes,
      },
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats,
};
