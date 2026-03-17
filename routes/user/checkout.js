const express = require('express');
const router = express.Router();
const checkoutController = require('../../controllers/user/checkout');
const isAuthenticated = require('../../middlewares/userLoginCheck');

router.get('/', isAuthenticated, checkoutController.getCheckoutPage);
router.post('/addresses', isAuthenticated, checkoutController.createAddress);
router.patch('/addresses/:id', isAuthenticated, checkoutController.editAddress);
router.delete('/addresses/:id', isAuthenticated, checkoutController.deleteAddress);
router.get('/addresses', isAuthenticated, checkoutController.getAllAddresses);
router.patch('/addresses/:id/primary', isAuthenticated, checkoutController.setPrimaryAddress);
router.get('/addresses/primary', isAuthenticated, checkoutController.getPrimaryAddress);
router.post('/place-order', isAuthenticated, checkoutController.placeOrder);
router.post('/create-razorpay-order', isAuthenticated, checkoutController.createRazorpayOrder);
router.post('/verify-payment', isAuthenticated, checkoutController.verifyPayment);
router.get('/wallet/balance', isAuthenticated, checkoutController.getWalletBalance);
router.post('/wallet/pay', isAuthenticated, checkoutController.processWalletPayment);

module.exports = router;
