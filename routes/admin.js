var express = require('express');
var router = express.Router();

const dashboardRouter = require('./admin/dashboard');
const productsRouter = require('./admin/products');
const variantRouter = require('./admin/variant');
const mainCategoryRouter = require('./admin/mainCategory');
const subcategoryRouter = require('./admin/subCategory');
const ordersRouter = require('./admin/orders');
const couponRouter = require('./admin/coupons');
const userRouter = require('./admin/users');
const salesRouter = require('./admin/sales');
const bannerRouter = require('./admin/banner');


const authMiddleware = require('../middlewares/adminLoginCheck');


 router.use('/dashboard', authMiddleware, dashboardRouter);
 router.use('/products', authMiddleware, productsRouter);
 router.use('/variant', authMiddleware, variantRouter);
 router.use('/maincategories', authMiddleware, mainCategoryRouter);
 router.use('/subcategories', authMiddleware, subcategoryRouter);
 router.use('/orders', authMiddleware, ordersRouter);
 router.use('/coupons', authMiddleware, couponRouter);
 router.use('/users', authMiddleware, userRouter);
 router.use('/sales', authMiddleware, salesRouter);
 router.use('/banner', authMiddleware, bannerRouter);
 

router.post('/logout', async (req, res) => {
    try {
        // Only clear admin-specific session data
        req.session.isChecked = false;  // Clear admin authentication
        
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Internal server error during logout' });
    }
});

module.exports = router;
