const express = require('express');
const router = express.Router();
const shopController = require('../../controllers/index/shop');

// GET shop page
router.get('/', shopController.getShopPage);

// GET products
router.get('/products', shopController.getProducts);

module.exports = router;