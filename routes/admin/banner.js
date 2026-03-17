const express = require('express');
const router = express.Router();
const bannerController = require('../../controllers/admin/banner');
const authMiddleware = require('../../middlewares/adminLoginCheck');

router.get('/', authMiddleware, bannerController.getBannerManager);
router.get('/banners', authMiddleware, bannerController.getBanners);
router.post('/banners', authMiddleware, bannerController.createBanner);
router.put('/banners/:id', authMiddleware, bannerController.updateBanner);
router.delete('/banners/:id', authMiddleware, bannerController.deleteBanner);
router.put('/banners/order', authMiddleware, bannerController.updateOrder);
router.patch('/banners/:id/toggle', authMiddleware, bannerController.toggleBannerStatus);

module.exports = router;
