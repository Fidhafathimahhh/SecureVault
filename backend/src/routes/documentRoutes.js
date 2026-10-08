const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authMiddleware);

router.get('/', documentController.getDocuments);
router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/:id/download', documentController.downloadDocument);
router.delete('/:id', documentController.deleteDocument);
router.put('/:id/rename', documentController.renameDocument);

module.exports = router;
