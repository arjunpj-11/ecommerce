var express = require('express');
var router = express.Router();

const mainCategory = require('../../models/mainCategory');
const SubCategory = require('../../models/subCategory');

// Register the routes
router.use('/',async (req, res) => {
    try {

        let main = req.query.main
        let maincategory = await mainCategory.findOne({_id:main})
        let  mainCategoryName = maincategory.mainCategoryName
        const subcategories = await SubCategory.find({ mainCategory:main,status:'active'})
            .populate('mainCategory')
            .sort({ 'subCategoryName': 1 }); // Sort alphabetically

            const categoriesWithSubs = await mainCategory.aggregate([
                {
                    $match: { status: 'active' }
                },
                {
                    $lookup: {
                        from: 'subcategories',
                        localField: '_id',
                        foreignField: 'mainCategory',
                        pipeline: [{ $match: { status: 'active' } }],
                        as: 'subcategories'
                    }
                }
            ]);

        res.render('../views/pages/index/subcategories', {
            title: mainCategoryName,
            subcategories: subcategories,
            authentication: req.session.isAuthenticated || false,
            categoriesWithSubs
        });
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).render('error', {
            message: 'Unable to load subcategories',
            error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
        });
    }
});


module.exports = router;