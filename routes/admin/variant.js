const express = require('express');
const router = express.Router();
const variantController = require('../../controllers/admin/variant');
const authMiddleware = require('../../middlewares/adminLoginCheck');

/* Get all variants */
router.get('/', authMiddleware, variantController.getVariant);

/* Get specific variant details */
router.get('/variants', authMiddleware, variantController.getVariants);

/* Create a new variant */
router.post('/', authMiddleware, variantController.createVariant);

/* Update a variant */
router.patch('/:id', authMiddleware, variantController.updateVariant);

/* Delete a variant */
router.delete('/:id', authMiddleware, variantController.deleteVariant);

/* Global error handling */
router.use((err, req, res, next) => {
    console.error('Variant route error:', err);
    res.status(500).json({ 
        error: 'An unexpected error occurred',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = router;
