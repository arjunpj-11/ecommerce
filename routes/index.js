var express = require('express');
var router = express.Router();
const homeController = require('../controllers/index/home');


const productsRouter = require('./index/products')
const shopRouter = require('./index/shop')
const searchRouter = require('./index/search')
const overviewRouter = require('./index/overview')
const subcategoriesRouter = require('./index/subcategories')




router.get('/', homeController.getHomePage);
router.use('/products',productsRouter);
router.use('/shop',shopRouter);
router.use('/search',searchRouter);
router.use('/overview',overviewRouter);
router.use('/subcategories', subcategoriesRouter);

module.exports = router;
