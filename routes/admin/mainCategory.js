var express = require('express');
var router = express.Router();
const adminCategoryController = require('../../controllers/admin/mainCategory');
const authMiddleware = require('../../middlewares/adminLoginCheck');

/* GET home page. */
router.get('/', authMiddleware, adminCategoryController.getAdminCategory);

router.post('/table', authMiddleware, adminCategoryController.postAdminCategoryTable);

router.patch('/Offer', authMiddleware, adminCategoryController.patchMainCategoryOffer);

router.get('/search', authMiddleware, adminCategoryController.getAdminCategorySearch);

router.post('/create', authMiddleware, adminCategoryController.postAdminCategoryCreate);

router.post('/edit', authMiddleware, adminCategoryController.postAdminCategoryEdit);

router.patch('/inactivate', authMiddleware, adminCategoryController.patchInactivate);

router.patch('/activate', authMiddleware, adminCategoryController.patchActivate);

router.delete('/delete', authMiddleware, adminCategoryController.deleteCategory);

module.exports = router;
