const mongoose = require('mongoose');

// Define the Coupon schema
const couponSchema = new mongoose.Schema({
    couponName: {
        type: String,
        required: true,
        trim: true
    },
    couponCode: {
        type: String,
        required: true,
        unique: true, // Ensure coupon codes are unique
        trim: true
    },
    discount: {
        type: Number,
        required: true,
        min: 0 // Discount should be a positive number
    },
    minAmount: {
        type: Number,
        required: true,
        min: 0 // Minimum amount should be a positive number
    },
    validity: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Expired'], // Only allow these two values
        default: 'Active' // Default status is Active
    },
    created: {
        type: Date,
        default: Date.now // Automatically set the creation date
    }
});

// Create the Coupon model
const Coupon = mongoose.model('Coupon', couponSchema);

// Export the model
module.exports = Coupon;