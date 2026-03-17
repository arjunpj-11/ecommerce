const express = require('express');
const router = express.Router();
const searchController = require('../../controllers/index/search');

// GET search page
router.get('/', searchController.getHomePage);

// GET search recommendations
router.get('/suggestions', searchController.getSearchRecommendations);

// GET products
router.get('/products', searchController.getProducts);

module.exports = router;