const { db, logActivity } = require('../database/db');

async function getSecurityStatus(req, res, next) {
  try {
    const user = db.prepare('SELECT auto_lock_minutes, created_at FROM users WHERE id = ?').get(req.user.id);
    const activeSessionsCount = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE user_id = ? AND expires_at > datetime("now")')
      .get(req.user.id).count;

    const lastLoginLog = db.prepare('SELECT created_at FROM activity_logs WHERE user_id = ? AND event_type = "USER_LOGIN" ORDER BY created_at DESC LIMIT 1')
      .get(req.user.id);

    const totalLogs = db.prepare('SELECT COUNT(*) as count FROM activity_logs WHERE user_id = ?').get(req.user.id).count;

    res.json({
      status: 'Vault Secure',
      vaultSecure: true,
      lastLogin: lastLoginLog ? lastLoginLog.created_at : user.created_at,
      activeSessionsCount,
      totalActivityEvents: totalLogs,
      autoLockMinutes: user.auto_lock_minutes,
      accountCreatedAt: user.created_at,
    });
  } catch (err) {
    next(err);
  }
}

async function getSessions(req, res, next) {
  try {
    const sessions = db.prepare(`
      SELECT id, ip_address, user_agent, created_at, expires_at 
      FROM sessions 
      WHERE user_id = ? AND expires_at > datetime("now")
      ORDER BY created_at DESC
    `).all(req.user.id);

    const formatted = sessions.map((s) => ({
      id: s.id,
      ip_address: s.ip_address || '127.0.0.1',
      user_agent: s.user_agent || 'Unknown Browser',
      created_at: s.created_at,
      is_current: s.id === req.sessionId,
    }));

    res.json({ sessions: formatted });
  } catch (err) {
    next(err);
  }
}

async function revokeSession(req, res, next) {
  try {
    const sessionId = req.params.id;

    if (sessionId === req.sessionId) {
      return res.status(400).json({ error: 'To terminate your current session, use the Logout button.' });
    }

    const result = db.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?').run(sessionId, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Session not found or already ended.' });
    }

    logActivity(req.user.id, 'SESSION_REVOKED', 'Terminated remote active session', req.ip);

    res.json({ message: 'Session terminated successfully.' });
  } catch (err) {
    next(err);
  }
}

async function getActivityLogs(req, res, next) {
  try {
    const logs = db.prepare(`
      SELECT id, event_type, details, ip_address, created_at
      FROM activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).all(req.user.id);

    res.json({ logs });
  } catch (err) {
    next(err);
  }
}

async function updateAutoLock(req, res, next) {
  try {
    const { minutes } = req.body;

    const parsedMinutes = parseInt(minutes, 10);
    if (isNaN(parsedMinutes) || parsedMinutes < 0) {
      return res.status(400).json({ error: 'Invalid auto-lock duration.' });
    }

    db.prepare('UPDATE users SET auto_lock_minutes = ? WHERE id = ?').run(parsedMinutes, req.user.id);

    logActivity(req.user.id, 'SECURITY_SETTINGS_UPDATED', `Updated auto-lock timeout to ${parsedMinutes} minutes`, req.ip);

    res.json({ message: 'Auto-lock duration updated successfully.', auto_lock_minutes: parsedMinutes });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSecurityStatus,
  getSessions,
  revokeSession,
  getActivityLogs,
  updateAutoLock,
};
