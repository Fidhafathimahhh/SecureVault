const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', passwordController.getPasswords);
router.post('/', passwordController.createPassword);
router.get('/:id/reveal', passwordController.revealPassword);
router.put('/:id', passwordController.updatePassword);
router.delete('/:id', passwordController.deletePassword);
router.post('/:id/favorite', passwordController.toggleFavorite);

module.exports = router;
