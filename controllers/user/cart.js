const Variant = require('../../models/variant');
const Cart = require('../../models/cart');
const Product = require('../../models/product');
const Coupon = require('../../models/coupon');
const mongoose = require('mongoose');
const MainCategory = require('../../models/mainCategory');
const SubCategory = require('../../models/subCategory');
const User = require('../../models/user');
const Order = require('../../models/order');

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const { variantId, selectedSize, quantity } = req.body;

        // Check stock availability
        const variant = await Variant.findById(variantId);
        if (!variant || !variant.sizes[selectedSize] || variant.sizes[selectedSize] < quantity) {
            return res.status(400).json({ 
                message: `Not enough stock available for size ${selectedSize}`
            });
        }

        // Find cart or create a new one if it doesn't exist
        let cart = await Cart.findOne({ user: req.session.userId });
        
        if (!cart) {
            cart = new Cart({
                user: req.session.userId,
                items: []
            });
        } else {
            // Check for existing item in cart
            const existingItemIndex = cart.items.findIndex(item => 
                item.variantId.toString() === variantId && 
                item.size === selectedSize
            );

            if (existingItemIndex !== -1) {
                return res.status(400).json({ 
                    exists: true,
                    message: 'This item already exists in your cart'
                });
            }
        }

        // Add new item to cart
        cart.items.push({ variantId, size: selectedSize, quantity });
        await cart.save();

        res.json({ 
            success: true,
            message: 'Item added to cart successfully'
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false,
            message: 'Error adding item to cart',
            error: error.message 
        });
    }
};

// Get cart items
exports.getCart = async (req, res) => {
    try {
        const userId = req.session.userId;
        const cart = await Cart.findOne({ user: userId });
        
        // Find the user to check their order history for used coupons
        const user = await User.findById(userId);
        
        // Get all active, non-expired coupons
        const allActiveCoupons = await Coupon.find({
            status: 'Active',
            validity: { $gte: new Date() }
        });
        
        // Get all orders by this user to check which coupons they've used
        const userOrders = await Order.find({ userId: user.userId });
        
        // Extract all coupon codes the user has already used
        const usedCouponCodes = userOrders
            .filter(order => order.couponApplied)
            .map(order => order.couponApplied);
        
        // Filter out coupons that the user has already used
        const availableCoupons = allActiveCoupons.filter(coupon => 
            !usedCouponCodes.includes(coupon.couponCode)
        );

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
        
        if (!cart) {
            return res.render('../views/pages/user/cart', { 
                items: [],
                coupons: availableCoupons,
                appliedCoupon: null,
                categoriesWithSubs
            });
        }

        const cartItems = await Promise.all(cart.items.map(async (item) => {
            const variant = await Variant.findById(item.variantId);
            const product = await Product.findById(variant.productId);

            const inStock = variant.sizes[item.size] >= item.quantity;
            const availableStock = variant.sizes[item.size] || 0;
            
            return {
                variantId: item.variantId,
                productId: product._id,
                quantity: item.quantity,
                size: item.size,
                color: variant.color,
                images: variant.images,
                sizes: variant.sizes,
                name: product.name,
                price: product.price,
                discountPrice: product.discountPrice,
                inStock,
                availableStock
            };
        }));

        // Get applied coupon details if exists
        let appliedCouponDetails = null;
        if (cart.couponApplied) {
            appliedCouponDetails = await Coupon.findOne({
                couponCode: cart.couponApplied
            });
        }
      
        res.render('../views/pages/user/cart', { 
            items: cartItems,
            totalAmount: calculateTotal(cartItems),
            coupons: availableCoupons,
            appliedCoupon: appliedCouponDetails,
            categoriesWithSubs
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).send('Error fetching cart');
    }
};

// Update item quantity in cart
exports.updateQuantity = async (req, res) => {
    try {
        const { variantId, quantity, size2 } = req.body;

        // Check stock availability for the specific size
        const variant = await Variant.findById(variantId);
        if (!variant || !variant.sizes[size2] || variant.sizes[size2] < quantity) {
            return res.status(400).json({ 
                error: `Not enough stock available for size ${size2}`
            });
        }

        const cart = await Cart.findOne({ user: req.session.userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => 
            item.variantId.toString() === variantId && item.size === size2
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity; // Update quantity
            await cart.save();
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Item not found in cart' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Remove item from cart
exports.removeItem = async (req, res) => {
    try {
        const { variantId } = req.body;
        const cart = await Cart.findOne({ user: req.session.userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => 
            item.variantId.toString() !== variantId // Remove item from cart
        );
        
        await cart.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Apply coupon to cart
exports.applyCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        
        // Find active coupon
        const coupon = await Coupon.findOne({
            couponCode: code,
            status: 'Active',
            validity: { $gte: new Date() }
        });
        
        if (!coupon) {
            return res.status(400).json({ error: 'Invalid or expired coupon' });
        }

        // Get cart and calculate total
        const cart = await Cart.findOne({ user: req.session.userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Check if another coupon is already applied
        if (cart.couponApplied) {
            return res.status(400).json({ 
                error: 'Another coupon is already applied. Please clear it first.' 
            });
        }

        const cartItems = await Promise.all(cart.items.map(async (item) => {
            const variant = await Variant.findById(item.variantId);
            const product = await Product.findById(variant.productId);
            return {
                quantity: item.quantity,
                price: product.discountPrice || product.price
            };
        }));

        const subtotal = calculateTotal(cartItems);
        
        // Validate minimum purchase amount
        if (subtotal < coupon.minAmount) {
            return res.status(400).json({ 
                error: `Minimum purchase amount of ₹${coupon.minAmount} required` 
            });
        }

        // Save coupon to cart
        cart.couponApplied = code.toUpperCase();
        await cart.save();

        res.json({ 
            success: true, 
            discount: coupon.discount,
            total: subtotal - coupon.discount + 20,
            message: 'Coupon applied successfully'
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ error: 'Server error while applying coupon' });
    }
};

// Clear coupon from cart
exports.clearCoupon = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.session.userId });
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        if (!cart.couponApplied) {
            return res.status(400).json({ error: 'No coupon currently applied' });
        }

        // Remove coupon from cart
        cart.couponApplied = null;
        await cart.save();

        // Recalculate totals
        const cartItems = await Promise.all(cart.items.map(async (item) => {
            const variant = await Variant.findById(item.variantId);
            const product = await Product.findById(variant.productId);
            return {
                quantity: item.quantity,
                price: product.discountPrice || product.price
            };
        }));

        const subtotal = calculateTotal(cartItems);

        res.json({ 
            success: true, 
            total: subtotal + 20,
            message: 'Coupon removed successfully'
        });
    } catch (error) {
        console.error('Error clearing coupon:', error);
        res.status(500).json({ error: 'Server error while clearing coupon' });
    }
};

// Calculate total price of items in cart
function calculateTotal(items) {
    return items.reduce((total, item) => 
        total + (item.discountPrice || item.price) * item.quantity, 0
    );
}