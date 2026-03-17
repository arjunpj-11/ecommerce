
const Variant = require('../../models/variant');
const Cart = require('../../models/cart');
const Product = require('../../models/product');
const Coupon = require('../../models/coupon');
const Address = require('../../models/address');
const Order = require('../../models/order');
const User = require('../../models/user');
const Wallet = require('../../models/wallet');
const MainCategory = require('../../models/mainCategory');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET 
});

// Wallet Related Functions
exports.getWalletBalance = async (req, res) => {
    try {
        const userId = req.session.userId;

        // Input validation
        if (!userId) {
            return res.status(401).json({ error: 'User  not authenticated' });
        }

        // Find or create wallet
        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            wallet = await Wallet.create({
                user: userId,
                balance: 0,
                transactions: [] // Initialize with empty array
            });
        }

        return res.json({ balance: wallet.balance });

    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.processWalletPayment = async (req, res) => {
    try {
        const { amount, shippingAddressId } = req.body;
        const userId = req.session.userId;

        // Input validation
        if (!amount || !shippingAddressId) {
            throw new Error('Missing required payment details');
        }

        // Find user's wallet
        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        // Validate balance
        if (wallet.balance < amount) {
            throw new Error('Insufficient wallet balance');
        }

        // Verify cart and stock
        const cart = await Cart.findOne({ user: userId });
        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Check stock availability
        for (const item of cart.items) {
            const variant = await Variant.findById(item.variantId);
            if (!variant || variant.sizes[item.size] < item.quantity) {
                throw new Error(`Item ${item.variantId} is out of stock`);
            }
        }

        // Deduct amount from wallet
        wallet.balance -= amount;
        wallet.transactions.push({
            type: 'debited',
            amount,
            reason: 'Purchase payment',
            timestamp: new Date()
        });

        // Save wallet changes
        await wallet.save();

        // Create order
        const order = await exports.placeOrder({
            body: {
                paymentMethod: 'wallet',
                shippingAddressId,
                paymentDetails: 'success'
            },
            session: req.session 
        }, res);

        // Extract only necessary order data
        const orderData = {
            orderId: order._id,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
        };

        // Return success response with simplified order data
        return res.json({
            success: true,
            message: 'Payment processed successfully',
            order: orderData
        });

    } catch (error) {
        if (!res.headersSent) {
            console.error('Wallet Payment Error:', error);
            return res.status(400).json({
                error: error.message || 'Payment processing failed'
            });
        }
    }
};

// Razorpay Related Functions
exports.createRazorpayOrder = async (req, res) => {
    try {
        const { shippingAddressId } = req.body;
        const userId = req.session.userId;

        const cart = await Cart.findOne({ user: userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Calculate total amount
        const items = await Promise.all(cart.items.map(async (item) => {
            const variant = await Variant.findById(item.variantId);
            const product = await Product.findById(variant.productId);
            return {
                price: product.discountPrice || product.price,
                quantity: item.quantity
            };
        }));

        const amount = items.reduce((total, item) => 
            total + (item.price * item.quantity), 0);

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: Math.round((amount + 20 - req.session.discount) * 100), // Adding shipping fee
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        });

        // Get user info for prefill
        const user = await User.findOne({ _id: userId });
        req.session.discount = 0; // Reset discount session variable
        res.json({
            order,
            userInfo: {
                name: user.name,
                email: user.email,
            }
        });

    } catch (error) {
        console.error('Razorpay Order Creation Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            shippingAddressId
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        // Check if signature is missing or invalid
        if (!razorpay_signature || expectedSignature !== razorpay_signature) {
            const orderResult = await exports.placeOrder({
                body: {
                    paymentMethod: 'razorpay',
                    shippingAddressId,
                    paymentStatus: 'Failed',
                    paymentDetails: {
                        orderId: razorpay_order_id,
                        paymentId: razorpay_payment_id,
                        signature: razorpay_signature
                    }
                },
                session: req.session 
            }, res, session); // Pass the session to placeOrder
            return res.status(400).json({ paymentStatus: 'failed', error: 'Invalid signature or missing payment details' });
        }

        // Process the order
        const orderResult = await exports.placeOrder({
            body: {
                paymentMethod: 'razorpay',
                shippingAddressId,
                paymentDetails: {
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id,
                    signature: razorpay_signature
                }
            },
            session: req.session 
        }, res, session); // Pass the session to placeOrder

        await session.commitTransaction();
        return res.json(orderResult); // Ensure only one response is sent

    } catch (error) {
        await session.abortTransaction();
        console.error('Payment Verification Error:', error);

        // Check if headers have already been sent
        if (!res.headersSent) {
            return res.status(500).json({ error: error.message });
        }
    } finally {
        session.endSession();
    }
};

// Checkout Page and Cart Functions
exports.getCheckoutPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const cart = await Cart.findOne({ user: userId });
        const wallet = await Wallet.findOne({ user: userId });
        req.session.discount = req.query.discount || 0; // Get discount from query
        
        if (!cart) {
            return res.render('../views/pages/user/checkout', { 
                items: [],
                walletBalance: wallet ? wallet.balance : 0
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
        
        res.render('../views/pages/user/checkout', { 
            items: cartItems,
            totalAmount: calculateTotal(cartItems),
            discount: req.session.discount,
            walletBalance: wallet ? wallet.balance : 0,
            categoriesWithSubs 
        });
    } catch (error) {
        console.error('Error loading checkout page:', error);
        res.status(500).send('Error loading checkout page');
    }
};

// Address Management Functions
exports.createAddress = async (req, res) => {
    try {
        const { street, city, state, postalCode, country, phone, name } = req.body;
        const userId = req.session.userId;

        const addressCount = await Address.countDocuments({ userId });
        const isPrimary = addressCount === 0; // Set first address as primary

        const address = await Address.create({
            userId,
            name,
            street,
            city,
            state,
            postalCode,
            country,
            phone,
            isPrimary
        });

        res.status(201).json(address);
    } catch (error) {
        console.error('Error creating address:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.editAddress = async (req, res) => {
    try {
        const { street, city, state, postalCode, country, phone, name } = req.body;
        const addressId = req.params.id;
        const userId = req.session.userId;

        const address = await Address.findOneAndUpdate(
            { _id: addressId, userId },
            { street, city, state, postalCode, country, phone, name },
            { new: true, runValidators: true }
        );

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.json(address);
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const userId = req.session.userId;

        const address = await Address.findOneAndDelete({ _id: addressId, userId });
        
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // If deleted address was primary, make oldest address primary
        if (address.isPrimary) {
            const oldestAddress = await Address.findOne({ userId }).sort({ createdAt: 1 });
            if (oldestAddress) {
                oldestAddress.isPrimary = true;
                await oldestAddress.save();
            }
        }

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.getAllAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ userId: req.session.userId })
            .sort({ isPrimary: -1, createdAt: -1 });

        res.json(addresses);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.placeOrder = async (req, res) => {
    try {
        const { paymentMethod, shippingAddressId, paymentStatus, paymentDetails } = req.body;
        const userId = req.session.userId;

        if (!['cod', 'razorpay', 'wallet'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        const user = await User.findOne({ _id: userId });
        const cart = await Cart.findOne({ user: userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const shippingAddress = await Address.findById(shippingAddressId);
        if (!shippingAddress) {
            return res.status(400).json({ error: 'Invalid shipping address' });
        }

        // Calculate coupon discount if applied
        let couponDiscount = 0;
        if (cart.couponApplied) {
            const coupon = await Coupon.findOne({ couponCode: cart.couponApplied, status: 'Active' });
            if (coupon && new Date(coupon.validity) > new Date()) {
                const cartTotal = await calculateCartTotal(cart.items);
                if (cartTotal >= coupon.minAmount) {
                    couponDiscount = coupon.discount;
                }
            }
        }

        const numberOfUniqueProducts = cart.items.length;
        const discountPerProductType = numberOfUniqueProducts > 0 ? (couponDiscount / numberOfUniqueProducts) : 0;
        
        const orders = [];
        
        for (const cartItem of cart.items) {
            const variant = await Variant.findById(cartItem.variantId);
            if (!variant) {
                return res.status(400).json({ error: `Variant not found: ${cartItem.variantId}` });
            }

            if (!variant.sizes[cartItem.size] || variant.sizes[cartItem.size] < cartItem.quantity) {
                return res.status(400).json({
                    stock: "out",
                    error: 'Some items in your cart are out of stock'
                });
            }

            const product = await Product.findById(variant.productId);
            if (!product) {
                throw new Error(`Product not found for variant: ${cartItem.variantId}`);
            }

            const orderId = await Order.generateOrderId();

            const updateQuery = {};
            updateQuery[`sizes.${cartItem.size}`] = -cartItem.quantity;
            
            const updatedVariant = await Variant.findByIdAndUpdate(
                cartItem.variantId,
                { $inc: updateQuery },
                { new: true, runValidators: true }
            );

            const variantImage = variant.images?.[0] || product.image;
            const originalPrice = product.discountPrice || product.price;
            const discountPerUnit = discountPerProductType / cartItem.quantity;
            const priceAfterCoupon = Math.max(0, originalPrice - discountPerUnit);

            const orderData = {
                orderId: orderId,
                userId: user.userId,
                name: product.name,
                image: variantImage,
                price: priceAfterCoupon,
                originalPrice: originalPrice,
                couponDiscountApplied: discountPerProductType,
                productId: product.productId,
                quantity: cartItem.quantity,
                size: cartItem.size,
                variant: cartItem.variantId,
                paymentMethod: paymentMethod,
                status: paymentStatus === 'Failed' ? 'Payment Failed' : 'Pending',
                address: {
                    street: shippingAddress.street,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    postalCode: shippingAddress.postalCode,
                    country: shippingAddress.country
                },
                paymentStatus: paymentMethod === 'razorpay' || paymentMethod === 'wallet' ? 'Paid' : 'Pending',
                couponApplied: cart.couponApplied || null
            };

            if (paymentDetails) {
                orderData.paymentDetails = paymentDetails;
            }

            const order = await Order.create(orderData);
            orders.push(order._id);
        }

        // Clear cart after successful order creation
        await Cart.findOneAndUpdate(
            { user: userId },
            { items: [], couponApplied: null }
        );

        if (paymentStatus === 'Failed') {
            return res.status(500).json({ 
                error: 'Order creation failed',
                message: 'Payment process failed' 
            });    
        }

        res.status(200).json({
            success: true,
            message: 'Orders placed successfully',
            orders: orders
        });

    } catch (error) {
        console.error('Order creation failed:', error);
        res.status(500).json({ 
            error: 'Order creation failed',
            message: error.message 
        });
    }
};

// Helper function to calculate cart total
async function calculateCartTotal(items) {
    let total = 0;
    
    for (const item of items) {
        const variant = await Variant.findById(item.variantId);
        if (!variant) continue;
        
        const product = await Product.findById(variant.productId);
        if (!product) continue;
        
        const price = product.discountPrice || product.price;
        total += price * item.quantity;
    }
    
    return total;
}

function calculateTotal(items) {
    return items.reduce((total, item) => 
        total + (item.discountPrice || item.price) * item.quantity, 0
    );
}

// Set primary address
exports.setPrimaryAddress = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const addressId = req.params.id;
        const userId = req.session.userId;

        // Remove primary status from all addresses
        await Address.updateMany(
            { userId },
            { isPrimary: false },
            { session }
        );

        // Set new primary address
        const address = await Address.findOneAndUpdate(
            { _id: addressId, userId },
            { isPrimary: true },
            { new: true, session }
        );

        if (!address) {
            throw new Error('Address not found');
        }

        await session.commitTransaction();
        res.json(address);

    } catch (error) {
        await session.abortTransaction();
        console.error('Error setting primary address:', error);
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

// Get primary address
exports.getPrimaryAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const address = await Address.findOne({ userId, isPrimary: true });
        
        if (!address) {
            return res.status(404).json({ error: 'No primary address found' });
        }

        res.json(address);
    } catch (error) {
        console.error('Error fetching primary address:', error);
        res.status(400).json({ error: error.message });
    }
};