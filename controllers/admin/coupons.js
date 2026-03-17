// controllers/couponController.js
const Coupon = require('../../models/coupon');

// Add a new coupon
exports.addCoupon = async (req, res) => {
    try {
        const { couponName, couponCode, discount, minAmount, validity } = req.body;
        
        // Validate that discount does not exceed 25% of minimum amount
        if (discount > (minAmount / 4)) {
            return res.status(400).json({
                success: false,
                message: 'Discount cannot exceed 25% of minimum amount'
            });
        }

        // Check for existing coupon with the same code
        const existingCoupon = await Coupon.findOne({ couponCode });
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        // Create a new coupon
        const newCoupon = new Coupon({
            couponName,
            couponCode: couponCode.toUpperCase(),
            discount,
            minAmount,
            validity,
            status: new Date(validity) > new Date() ? 'Active' : 'Expired'
        });

        await newCoupon.save();
        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            coupon: newCoupon
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating coupon',
            error: error.message
        });
    }
};

// Get a specific coupon by ID
exports.getCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            coupon
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching coupon',
            error: error.message
        });
    }
};

// Get a list of coupons with optional filters
exports.getCoupons = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const filter = req.query.filter || 'all';

        let query = {};
        if (filter === 'active') {
            query.status = 'Active';
        } else if (filter === 'expired') {
            query.status = 'Expired';
        }

        const total = await Coupon.countDocuments(query);
        const coupons = await Coupon.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            coupons,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching coupons',
            error: error.message
        });
    }
};

// Update an existing coupon
exports.updateCoupon = async (req, res) => {
    try {
        const { couponName, couponCode, discount, minAmount, validity } = req.body;

        // Validate that discount does not exceed 25% of minimum amount
        if (discount > (minAmount / 4)) {
            return res.status(400).json({
                success: false,
                message: 'Discount cannot exceed 25% of minimum amount'
            });
        }

        // Check for existing coupon with the same code, excluding the current coupon
        const existingCoupon = await Coupon.findOne({
            couponCode,
            _id: { $ne: req.params.id }
        });

        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        // Update the coupon
        const updatedCoupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            {
                couponName,
                couponCode: couponCode.toUpperCase(),
                discount,
                minAmount,
                validity,
                status: new Date(validity) > new Date() ? 'Active' : 'Expired'
            },
            { new: true }
        );

        if (!updatedCoupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            message: 'Coupon updated successfully',
            coupon: updatedCoupon
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating coupon',
            error: error.message
        });
    }
};

// Delete a coupon by ID
exports.deleteCoupon = async (req, res) => {
    try {
        const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!deletedCoupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting coupon',
            error: error.message
        });
    }
};