const express = require('express');
const router = express.Router();
const couponController = require('../../controllers/admin/coupons');
const authMiddleware = require('../../middlewares/adminLoginCheck');

// Render the admin coupons page
router.get('/', authMiddleware, (req, res) => {
    res.render('../views/pages/admin/coupons');
});

// GET all coupons with pagination
router.get('/get', authMiddleware, couponController.getCoupons);

// GET a single coupon by ID
router.get('/:id', authMiddleware, couponController.getCoupon);

// POST create a new coupon
router.post('/add', authMiddleware, couponController.addCoupon);

// PATCH update an existing coupon
router.patch('/:id', authMiddleware, couponController.updateCoupon);

// DELETE a coupon
router.delete('/:id', authMiddleware, couponController.deleteCoupon);

module.exports = router;
