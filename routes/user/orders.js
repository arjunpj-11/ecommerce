const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/user/orders');
const isAuthenticated = require('../../middlewares/userLoginCheck');

// Get all orders for the logged-in user
router.get('/', isAuthenticated, orderController.getAllOrders);

// Get order details
router.get('/:orderId', isAuthenticated, orderController.getOrderDetails);

// Cancel order
router.put('/:orderId/cancel', isAuthenticated, orderController.cancelOrder);

module.exports = router;
