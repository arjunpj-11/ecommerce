var express = require('express');
var router = express.Router();
var cartController = require('../../controllers/user/cart');
const isAuthenticated = require('../../middlewares/userLoginCheck');

router.post('/add', isAuthenticated, cartController.addToCart);
router.get('/', isAuthenticated, cartController.getCart);
router.post('/update-quantity', isAuthenticated, cartController.updateQuantity);
router.delete('/remove-item', isAuthenticated, cartController.removeItem);
router.post('/apply-coupon', isAuthenticated, cartController.applyCoupon);
router.post('/clear-coupon', isAuthenticated, cartController.clearCoupon);

module.exports = router;
