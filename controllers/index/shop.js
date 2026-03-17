const Product = require('../../models/product');
const Variant = require('../../models/variant');
const MainCategory = require('../../models/mainCategory');
const SubCategory = require('../../models/subCategory');
const mongoose = require('mongoose');

// GET shop page
exports.getShopPage = async (req, res, next) => {
    try {
        const authentication = req.session.isAuthenticated; // Check authentication status

        // Get all categories with subcategories for hover menu
        const categoriesWithSubs = await MainCategory.aggregate([
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

        // Render the shop page with the fetched data
        res.render('../views/pages/index/shop', { authentication, categoriesWithSubs });
    } catch (err) {
        console.error("Error rendering shop page:", err);
        res.status(500).send("Error loading the shop page."); // Handle server error
    }
};

// GET products based on filters
exports.getProducts = async (req, res, next) => {
    try {
        const {
            sort = 'popularity',
            categories = [],
            minPrice,
            maxPrice,
            sizes = []
        } = req.query;

        const categoriesArray = Array.isArray(categories) ? categories : [categories].filter(Boolean); // Ensure categories is an array

        let aggregationPipeline = [
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "productDetails.subCategory",
                    foreignField: "_id",
                    as: "subcategoryDetails"
                }
            },
            { $unwind: "$subcategoryDetails" },
            {
                $match: {
                    "productDetails.status": "active" // Filter for active products
                }
            }
        ];

        // Add category filter
        if (categoriesArray.length > 0) {
            const categoryIds = categoriesArray.map(cat => new mongoose.Types.ObjectId(cat));
            aggregationPipeline.push({
                $match: {
                    "subcategoryDetails.mainCategory": { $in: categoryIds }
                }
            });
        }

        // Add price filters
        if (minPrice || maxPrice) {
            const priceMatch = {};
            if (minPrice) priceMatch.$gte = parseFloat(minPrice);
            if (maxPrice) priceMatch.$lte = parseFloat(maxPrice);
            
            aggregationPipeline.push({
                $match: {
                    "productDetails.discountPrice": priceMatch
                }
            });
        }

        // Add size filters
        if (sizes.length > 0) {
            const sizeConditions = sizes.map(size => ({
                [`sizes.${size}`]: { $gt: 0 }
            }));
            
            aggregationPipeline.push({
                $match: {
                    $or: sizeConditions
                }
            });
        }

        // Add calculated fields for sorting
        aggregationPipeline.push({
            $addFields: {
                popularityScore: {
                    $multiply: [
                        { $ifNull: ["$productDetails.review", 0] },
                        {
                            $reduce: {
                                input: { $objectToArray: "$sizes" },
                                initialValue: 0,
                                in: { $add: ["$$value", "$$this.v"] }
                            }
                        }
                    ]
                }
            }
        });

        // Apply sort
        let sortStage = {};
        switch (sort) {
            case 'price-low-high':
                sortStage = { "productDetails.discountPrice": 1 };
                break;
            case 'price-high-low':
                sortStage = { "productDetails.discountPrice": -1 };
                break;
            case 'rating':
                sortStage = { "productDetails.review": -1 };
                break;
            case 'az':
                sortStage = { "productDetails.name": 1 };
                break;
            case 'za':
                sortStage = { "productDetails.name": -1 };
                break;
            case 'popularity':
            default:
                sortStage = { popularityScore: -1 };
        }

        // Add sort stage
        aggregationPipeline.push({ $sort: sortStage });

        // Final projection
        aggregationPipeline.push({
            $project: {
                _id: 1,
                productId: 1,
                color: 1,
                images: { $arrayElemAt: ["$images", 0] },
                sizes: 1,
                productDetails: 1,
                mainCategory: "$subcategoryDetails.mainCategory",
                subCategory: "$subcategoryDetails._id"
            }
        });

        const products = await Variant.aggregate(aggregationPipeline); // Execute the aggregation pipeline
        res.json(products); // Return the products as JSON

    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: "Error fetching products.", details: err.message }); // Handle server error
    }
};