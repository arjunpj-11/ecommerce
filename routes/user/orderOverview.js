const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/user/orderOverview');
const isAuthenticated = require('../../middlewares/userLoginCheck');

router.get('/:orderId', isAuthenticated, orderController.getOrderDetails);
router.get('/:orderId/invoice', isAuthenticated, orderController.generateInvoice);
router.post('/:orderId/retry-payment', isAuthenticated, orderController.retryPayment);
router.post('/verify-retry-payment', isAuthenticated, orderController.verifyRetryPayment);
router.post('/:orderId/refund', isAuthenticated, orderController.createRefundRequest);
router.post('/:orderId/cancel', isAuthenticated, orderController.cancelOrder);

module.exports = router;
