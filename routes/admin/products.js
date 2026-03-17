const express = require('express');
const router = express.Router();
const productController = require('../../controllers/admin/products');
const authMiddleware = require('../../middlewares/adminLoginCheck');

// Main routes
router.get('/', authMiddleware, productController.getHomePage);
router.post('/table', authMiddleware, productController.getProductsTable);

// Product management routes
router.get('/addProduct', authMiddleware, productController.getAddProductPage);
router.post('/addProduct', authMiddleware, productController.addProduct);

router.post('/edit', authMiddleware, productController.editProduct);

// Delete route
router.delete('/delete', authMiddleware, productController.deleteProduct);

// Status management routes
router.patch('/inactivate', authMiddleware, productController.inactivateProduct);
router.patch('/activate', authMiddleware, productController.activateProduct);

module.exports = router;
