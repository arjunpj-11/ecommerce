const Product = require('../../models/product');
const User = require('../../models/user');
const mainCategory = require('../../models/mainCategory');
const subCategory = require('../../models/subCategory');
const Variant = require('../../models/variant');
const mongoose = require('mongoose');

// GET products by main category
const getProductsByMainCategory = async (req, res, next) => {
  try {
    const sub = req.query.sub; // Get subcategory ID from query parameters
    console.log('Subcategory ID:', sub);

    if (!sub) {
      return res.status(400).json({ error: 'Subcategory ID is required' }); // Check if subcategory ID is provided
    }

    // Validate subcategory ID format
    if (!mongoose.Types.ObjectId.isValid(sub)) {
      return res.status(400).json({ error: 'Invalid subcategory ID format' });
    }

    const subcategory = await subCategory.findById(sub); // Fetch subcategory details
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' }); // Handle case where subcategory does not exist
    }
    const subcategoryName = subcategory.subCategoryName; // Get subcategory name

    // Fetch variants and join with product details
    const variants = await Variant.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $match: {
          "productDetails.subCategory": new mongoose.Types.ObjectId(sub), // Match by subcategory ID
          "productDetails.status": "active" // Filter for active products
        }
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          color: 1,
          images: { $arrayElemAt: ["$images", 0] }, // Include only the first image
          sizes: 1,
          tags: 1,
          productDetails: {
            _id: 1,
            name: 1,
            price: 1,
            discountPrice: { 
              $ifNull: ["$productDetails.discountPrice", "$productDetails.price"] // Use discount price if available
            },
            description: 1,
            subCategory: 1,
            status: 1
          }
        }
      },
      {
        $sort: { "productDetails.price": 1 } // Sort by price
      }
    ]);

    console.log('Found variants:', variants.length);

    // Transform the data to ensure all required fields are present
    const processedCards = variants.map(card => ({
      ...card,
      productDetails: {
        ...card.productDetails,
        discountPrice: card.productDetails.discountPrice || card.productDetails.price,
        price: card.productDetails.price || 0
      }
    }));

    // Get all categories with subcategories for hover menu
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

    const authentication = req.session.isAuthenticated; // Check authentication status
    res.render('../views/pages/index/products', { 
      cards: processedCards,
      authentication,
      noProducts: processedCards.length === 0, // Flag for no products
      title: subcategoryName,
      categoriesWithSubs
    });

  } catch (err) {
    console.error('Error in getProductsByMainCategory:', err);
    next(err); // Forward error to the next middleware
  }
};

module.exports = {
  getProductsByMainCategory,
};