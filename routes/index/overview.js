// routes/variantRoutes.js
const express = require('express');
const router = express.Router();
const {
    getVariantWithProductDetails,
    getVariantData
} = require('../../controllers/index/overview');

// Route for fetching variant with product details
router.get('/:variantId', getVariantWithProductDetails);

// API endpoint for fetching variant data
router.get('/variants/:variantId', getVariantData);

module.exports = router;