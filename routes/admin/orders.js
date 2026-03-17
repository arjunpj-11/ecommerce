const express = require('express');
const router = express.Router();
const OrderController = require('../../controllers/admin/orders');
const authMiddleware = require('../../middlewares/adminLoginCheck');

// Render the admin orders page
router.get('/', authMiddleware, function (req, res) {
    res.render('../views/pages/admin/orders');
});

// Get all orders
router.get('/get', authMiddleware, OrderController.getAllOrders);

// Update order status
router.put('/:id/status', authMiddleware, OrderController.updateOrderStatus);

// Approve refund
router.post('/:id/refund-A', authMiddleware, OrderController.approveRefund);

// Reject refund
router.post('/:id/refund-R', authMiddleware, OrderController.rejectRefund);

// Get order details
router.get('/:id/details', authMiddleware, OrderController.getOrderDetails);

module.exports = router;
