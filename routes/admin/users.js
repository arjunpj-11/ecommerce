var express = require('express');
var router = express.Router();
var userController = require('../../controllers/admin/users');
const authMiddleware = require('../../middlewares/adminLoginCheck');

/* GET users page */
router.get('/', authMiddleware, userController.getUsersPage);

/* Fetch users table data */
router.post('/table', authMiddleware, userController.getUsersTable);

/* Block and Unblock users */
router.post('/block', authMiddleware, userController.blockUser);
router.post('/unblock-user', authMiddleware, userController.unblockUser);

/* Global error handling */
router.use((err, req, res, next) => {
    console.error('User route error:', err);
    res.status(500).json({ 
        error: 'An unexpected error occurred',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = router;
