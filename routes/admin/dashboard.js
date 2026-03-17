const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/dashboard');
const authMiddleware = require('../../middlewares/adminLoginCheck');

// Apply authMiddleware to protect admin routes
router.get('/', authMiddleware, dashboardController.getDashboard);
router.get('/stats', authMiddleware, dashboardController.getDashboardStats);
router.get('/sales-chart', authMiddleware, dashboardController.getSalesChartData);
router.get('/top-categories', authMiddleware, dashboardController.getTopCategories);
router.post('/logout', authMiddleware, dashboardController.logout);

module.exports = router;
