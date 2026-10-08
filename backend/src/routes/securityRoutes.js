const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/status', securityController.getSecurityStatus);
router.get('/sessions', securityController.getSessions);
router.delete('/sessions/:id', securityController.revokeSession);
router.get('/activity', securityController.getActivityLogs);
router.post('/auto-lock', securityController.updateAutoLock);

module.exports = router;
