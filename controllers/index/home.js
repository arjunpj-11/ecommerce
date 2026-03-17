const Banner = require('../../models/banner');
const MainCategory = require('../../models/mainCategory');
const SubCategory = require('../../models/subCategory');
const Product = require('../../models/product');
const Variant = require('../../models/variant');

const homeController = {
    // GET: Render the home page
    getHomePage: async (req, res) => {
        try {
            // Fetch active banners
            const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
            
            // Detect device type from user agent
            const userAgent = req.headers['user-agent'];
            const isMobile = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent);
            const isTablet = /ipad|android 3.0|xoom|sch-i800|playbook|tablet|kindle/i.test(userAgent);
            
            // Set limits for categories and products based on device type
            const categoryLimit = isMobile ? 2 : isTablet ? 3 : 4;
            const productLimit = isMobile ? 4 : isTablet ? 6 : 8;
            
            // Fetch main categories
            const topCategories = await MainCategory.find({ status: 'active' }).limit(categoryLimit);
            
            // Fetch top sold items with responsive count
            const topSoldItems = await Product.aggregate([
                { $match: { status: 'active' } },
                { $lookup: {
                    from: 'variants',
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'variants'
                }},
                { $addFields: {
                    displayImage: {
                        $cond: {
                            if: { $ne: ['$image', '/default-image.png'] },
                            then: '$image',
                            else: {
                                $let: {
                                    vars: { firstVariant: { $arrayElemAt: ['$variants', 0] } },
                                    in: { $ifNull: [{ $arrayElemAt: ['$$firstVariant.images', 0] }, '/default-image.png'] }
                                }
                            }
                        }
                    },
                    variantId: { $ifNull: [{ $arrayElemAt: ['$variants._id', 0] }, null] }
                }},
                { $sort: { orderCount: -1 } },
                { $limit: productLimit },
                { $project: {
                    _id: 1, name: 1, price: 1, discountPrice: 1, displayImage: 1, variantId: 1
                }}
            ]);
            
            // Get all categories with their active subcategories for hover menu
            const categoriesWithSubs = await MainCategory.aggregate([
                { $match: { status: 'active' } },
                { $lookup: {
                    from: 'subcategories',
                    localField: '_id',
                    foreignField: 'mainCategory',
                    pipeline: [{ $match: { status: 'active' } }],
                    as: 'subcategories'
                }}
            ]);
            
            // Render the home page with the fetched data
            res.render('../views/pages/index/home.ejs', {
                authentication: req.session.isAuthenticated || false,
                banners,
                topCategories,
                topSoldItems,
                categoriesWithSubs,
                isMobile,
                isTablet
            });
        } catch (error) {
            console.error('Home page error:', error);
            res.status(500).render('error', { message: 'Error loading home page' }); // Handle errors
        }
    }
};

module.exports = homeController;