const express = require('express');
const router = express.Router();
const wishlistController = require('../../controllers/user/wishlist');
const isAuthenticated = require('../../middlewares/userLoginCheck');

router.get('/', isAuthenticated, wishlistController.getWishlist);
router.post('/toggle', isAuthenticated, wishlistController.toggleWishlistItem);
router.get('/check/:variantId', isAuthenticated, wishlistController.checkWishlistItem);
router.delete('/item/:variantId', isAuthenticated, wishlistController.removeWishlistItem);

module.exports = router;
