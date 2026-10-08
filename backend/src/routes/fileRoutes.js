const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authMiddleware);

router.get('/', fileController.getFiles);
router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/:id/download', fileController.downloadFile);
router.delete('/:id', fileController.deleteFile);
router.put('/:id/rename', fileController.renameFile);

router.post('/folders', fileController.createFolder);
router.delete('/folders/:id', fileController.deleteFolder);

module.exports = router;
