var express = require('express');
var router = express.Router();
const { getProductsByMainCategory } = require('../../controllers/index/products');

/* GET home page. */
router.get('/', getProductsByMainCategory);

module.exports = router;