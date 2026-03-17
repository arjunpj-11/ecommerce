const Razorpay = require('razorpay');

const crypto = require('crypto');

const express = require('express');
var router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET 
});


// Endpoint to create Razorpay order
router.post('/create-razorpay-order', async (req, res) => {
    const {  currency, receipt } = req.body;
         amount = 60;
    try {
        const order = await razorpay.orders.create({
            amount: amount * 100, 
            currency,
            receipt
        });

        res.json({ order });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to create Razorpay order' });
    }
});

// Endpoint to verify payment
router.post('/verify-payment', async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (generatedSignature === razorpay_signature) {
        res.json({ success: true, redirect: '/users/order' });
    } else {
        res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }
});

module.exports = router;
