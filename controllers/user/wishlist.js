const Wishlist = require('../../models/wishlist');
const Product = require('../../models/product');
const Variant = require('../../models/variant');
const MainCategory = require('../../models/mainCategory');
const mongoose = require('mongoose');

// GET user's wishlist
exports.getWishlist = async (req, res) => {
    try {
        // Get all active categories with their subcategories for the hover menu
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

        // Find wishlist and populate variant and product details
        const wishlist = await Wishlist.findOne({ user: req.session.userId })
            .populate({
                path: 'items.variantId',
                model: 'Variant',
                populate: {
                    path: 'productId',
                    model: 'Product',
                    select: 'name price brand description' // Select specific fields
                }
            });

        if (!wishlist) {
            return res.render('pages/user/wishlist', {
                wishlistItems: [],
                message: 'No items in wishlist',
                categoriesWithSubs
            });
        }

        // Transform wishlist items for the view
        const wishlistItems = wishlist.items.map(item => ({
            variantId: item.variantId,
            size: item.size,
            productId: item.variantId.productId._id,
            product: {
                name: item.variantId.productId.name,
                price: item.variantId.productId.price,
                brand: item.variantId.productId.brand,
                description: item.variantId.productId.description
            }
        }));

        res.render('pages/user/wishlist', {
            wishlistItems,
            message: wishlistItems.length ? '' : 'Your wishlist is empty',
            categoriesWithSubs
        });

    } catch (error) {
        console.error('Error in getWishlist:', error);
        res.status(500).render('pages/user/wishlist', {
            wishlistItems: [],
            message: 'Error loading wishlist'
        });
    }
};

// Add item to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const { variantId, size } = req.body;
        const userId = req.session.userId;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid variant ID'
            });
        }

        // Check if variant exists
        const variant = await Variant.findById(variantId);
        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found'
            });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, items: [] });
        }

        // Check if item already exists
        const existingItem = wishlist.items.find(
            item => item.variantId.toString() === variantId && item.size === size
        );

        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: 'Item already in wishlist'
            });
        }

        // Add new item
        wishlist.items.push({ variantId, size });
        await wishlist.save();

        res.json({
            success: true,
            message: 'Item added to wishlist',
            wishlistCount: wishlist.items.length
        });

    } catch (error) {
        console.error('Error in addToWishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding item to wishlist'
        });
    }
};

// Remove item from wishlist
exports.removeWishlistItem = async (req, res) => {
    try {
        const { variantId } = req.params;
        const userId = req.session.userId;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid variant ID'
            });
        }

        // Find wishlist
        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        // Remove item
        const initialLength = wishlist.items.length;
        wishlist.items = wishlist.items.filter(item => 
            item.variantId.toString() !== variantId );

        if (wishlist.items.length === initialLength) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in wishlist'
            });
        }

        await wishlist.save();

        res.json({
            success: true,
            message: 'Item removed from wishlist',
            wishlistCount: wishlist.items.length
        });

    } catch (error) {
        console.error('Error in removeWishlistItem:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing item from wishlist'
        });
    }
};

// Toggle item in wishlist
exports.toggleWishlistItem = async (req, res) => {
    try {
        const { variantId, size, action } = req.body;
        const userId = req.session.userId;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid variant ID'
            });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, items: [] });
        }

        const itemIndex = wishlist.items.findIndex(
            item => item.variantId.toString() === variantId && item.size === size
        );

        if (action === 'add' && itemIndex === -1) {
            wishlist.items.push({ variantId, size });
        } else if (action === 'remove' && itemIndex > -1) {
            wishlist.items.splice(itemIndex, 1);
        }

        await wishlist.save();

        res.json({
            success: true,
            message: action === 'add' ? 'Item added to wishlist' : 'Item removed from wishlist',
            wishlistCount: wishlist.items.length
        });

    } catch (error) {
        console.error('Error in toggleWishlistItem:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating wishlist'
        });
    }
};

// Check if item is in wishlist
exports.checkWishlistItem = async (req, res) => {
    try {
        const { variantId } = req.params;
        const userId = req.session.userId;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid variant ID'
            });
        }

        const wishlist = await Wishlist.findOne({ user: userId });
        const isInWishlist = wishlist?.items.some(
            item => item.variantId.toString() === variantId
        );

        res.json({
            success: true,
            isInWishlist,
            wishlistCount: wishlist ? wishlist.items.length : 0
        });

    } catch (error) {
        console.error('Error in checkWishlistItem:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking wishlist status'
        });
    }
};

// Get product details by variant ID
exports.getProductDetails = async (req, res) => {
    try {
        const { variantId } = req.params;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid variant ID'
            });
        }

        // Find variant and populate product details
        const variant = await Variant.findById(variantId)
            .populate('productId', 'name price brand description');

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Product variant not found'
            });
        }

        res.json({
            success: true,
            productId: variant.productId._id,
            productDetails: {
                name: variant.productId.name,
                price: variant.productId.price,
                brand: variant.productId.brand,
                description: variant.productId.description
            }
        });

    } catch (error) {
        console.error('Error in getProductDetails:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting product details'
        });
    }
};

// Get the count of items in the user's wishlist
module.exports.getWishlistCount = async (userId) => {
    try {
        const wishlist = await Wishlist.findOne({ user: userId });
        return wishlist ? wishlist.items.length : 0;
    } catch (error) {
        console.error('Error in getWishlistCount:', error);
        return 0;
    }
};