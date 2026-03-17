var express = require('express');
var router = express.Router();
const subcategoryController = require('../../controllers/admin/subCategory');
const authMiddleware = require('../../middlewares/adminLoginCheck');

router.get('/', authMiddleware, subcategoryController.getHomePage);
router.post('/table', authMiddleware, subcategoryController.getTableData);
router.patch('/offer', authMiddleware, subcategoryController.updateOffer);
router.get('/search', authMiddleware, subcategoryController.searchSubCategories);
router.post('/create', authMiddleware, subcategoryController.createSubCategory);
router.put('/edit', authMiddleware, subcategoryController.editSubCategory);
router.patch('/inactivate', authMiddleware, subcategoryController.inactivateSubCategory);
router.patch('/activate', authMiddleware, subcategoryController.activateSubCategory);
router.delete('/delete', authMiddleware, subcategoryController.deleteSubCategory);

// Global error handler
router.use((err, req, res, next) => {
    console.error('Subcategory route error:', err);
    res.status(500).json({ 
        error: 'An unexpected error occurred',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = router;
