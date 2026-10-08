const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/search', searchController.searchVault);
router.get('/dashboard/stats', dashboardController.getDashboardStats);

module.exports = router;
