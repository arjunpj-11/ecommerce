const express = require('express');
const router = express.Router();
const salesController = require('../../controllers/admin/sales');
const authMiddleware = require('../../middlewares/adminLoginCheck');

// Render sales report page
router.get('/', authMiddleware, salesController.renderSalesReport);

// Get sales report data
router.get('/report', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const salesData = await salesController.getProductSales({ startDate, endDate });
        res.json(salesData);
    } catch (error) {
        console.error('Error fetching sales report:', error);
        res.status(500).json({ error: 'Failed to fetch sales data' });
    }
});

// Download sales report
router.get('/download', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate, format } = req.query;
        
        // Check if there are sales in the selected period
        const salesData = await salesController.getProductSales({ startDate, endDate });
        
        // If no sales, return specific status code to trigger alert on frontend
        if (!salesData.products || salesData.products.length === 0 || salesData.stats.totalSales === 0) {
            return res.status(204).json({ message: 'No sales data available for the selected period' });
        }
        
        // If there are sales, proceed with download
        return salesController.downloadReport(req, res);
    } catch (error) {
        console.error('Error preparing download:', error);
        res.status(500).json({ error: 'Failed to download report' });
    }
});

// Get period-specific reports
router.get('/daily', authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const salesData = await salesController.getProductSales({
            startDate: formattedDate,
            endDate: formattedDate
        });
        res.json(salesData);
    } catch (error) {
        console.error('Error fetching daily report:', error);
        res.status(500).json({ error: 'Failed to fetch daily report' });
    }
});

router.get('/monthly', authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        // First day of current month
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        // Last day of current month
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const salesData = await salesController.getProductSales({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
        res.json(salesData);
    } catch (error) {
        console.error('Error fetching monthly report:', error);
        res.status(500).json({ error: 'Failed to fetch monthly report' });
    }
});

router.get('/yearly', authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), 0, 1);
        const endDate = new Date(today.getFullYear(), 11, 31);
        
        const salesData = await salesController.getProductSales({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
        res.json(salesData);
    } catch (error) {
        console.error('Error fetching yearly report:', error);
        res.status(500).json({ error: 'Failed to fetch yearly report' });
    }
});

// Custom period report
router.get('/custom', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const salesData = await salesController.getProductSales({ startDate, endDate });
        res.json(salesData);
    } catch (error) {
        console.error('Error fetching custom period report:', error);
        res.status(500).json({ error: 'Failed to fetch custom period report' });
    }
});

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('Sales routes error:', err);
    res.status(500).json({ 
        error: 'An unexpected error occurred',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = router;
