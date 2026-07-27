const Razorpay = require('razorpay');
const crypto = require('crypto');
const express = require('express');
var router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// Endpoint to create Razorpay order
router.post('/create-razorpay-order', async (req, res) => {
    const { amount, currency = 'INR', receipt } = req.body;
    try {
        const orderAmount = amount || 60;
        const order = await razorpay.orders.create({
            amount: Math.round(orderAmount * 100), 
            currency,
            receipt: receipt || `receipt_${Date.now()}`
        });

        res.json({ order });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({ error: 'Failed to create Razorpay order', details: error.message });
    }
});

// Endpoint to verify payment
router.post('/verify-payment', async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ success: false, error: 'Razorpay secret key not configured' });
    }

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (generatedSignature === razorpay_signature) {
        res.json({ success: true, redirect: '/users/orders' });
    } else {
        res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }
});

module.exports = router;
