const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', noteController.getNotes);
router.post('/', noteController.createNote);
router.get('/:id', noteController.getNoteById);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);
router.post('/:id/favorite', noteController.toggleFavorite);

module.exports = router;
