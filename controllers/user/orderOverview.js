const Order = require('../../models/order');
const Wallet = require('../../models/wallet');
const User = require('../../models/user');
const Refund = require('../../models/refund');
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const MainCategory = require('../../models/mainCategory');
const SubCategory = require('../../models/subCategory');
const Variant = require('../../models/variant');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Generate invoice for a specific order
exports.generateInvoice = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.orderId });
        if (!order) return res.status(404).send('Order not found');

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);
        
        doc.pipe(res);
        doc.fontSize(25).text('ARNI', { align: 'center' });
        doc.moveDown();
        doc.fontSize(20).text('Invoice', { align: 'center' });
        doc.moveDown();
        
        // Order details
        doc.fontSize(12);
        doc.text(`Order ID: ${order.orderId}`);
        doc.text(`Date: ${order.orderDate.toLocaleDateString()}`);
        doc.moveDown();
        
        // Product details
        doc.text(`Product: ${order.name}`);
        doc.text(`Size: ${order.size}`);
        doc.text(`Quantity: ${order.quantity}`);
        doc.text(`Price per item: $${order.price.toFixed(2)}`);
        doc.text(`Shipping: $20.00`);
        doc.moveDown();
        
        // Total amount
        doc.fontSize(14);
        doc.text(`Total Amount: $${(order.price * order.quantity + 20).toFixed(2)}`, { bold: true });
        
        doc.end();
    } catch (error) {
        res.status(500).send('Error generating invoice');
    }
};

// Retry payment for a specific order
exports.retryPayment = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.orderId });
        if (!order) return res.status(404).json({ success: false });

        const amount = (order.price * order.quantity + 20) * 100; // Amount in paise
        const razorpayOrder = await razorpay.orders.create({
            amount,
            currency: 'INR',
            receipt: order.orderId,
            payment_capture: 1
        });

        res.json({
            success: true,
            order: razorpayOrder,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

// Verify the retry payment
exports.verifyRetryPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, orderId } = req.body;
        
        const order = await Order.findOne({ _id: orderId });
        if (!order) return res.status(404).json({ success: false });

        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        if (payment.status === 'captured') {
            order.status = 'Pending';
            order.paymentStatus = 'Paid';
            await order.save();
            
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

// Get details of a specific order
exports.getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.orderId }).populate('variant');
        const existence = await Refund.findOne({ order: req.params.orderId });
        const isThere = existence ? true : false;

        if (!order) {
            return res.status(404).render('error', {
                message: 'Order not found'
            });
        }

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

        res.render('../views/pages/user/orderOverview', { order, categoriesWithSubs, isThere });
    } catch (error) {
        res.status(500).render('error', {
            message: 'Error fetching order details'
        });
    }
};

// Create a refund request for a specific order
exports.createRefundRequest = async (req, res) => {
    try {
        const session = req.session.userId;
        const order = await Order.findOne({ _id: req.params.orderId });
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        const existingRequest = await Refund.findOne({ order: order._id });
        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'A refund request already exists for this order'
            });
        }

        const refundRequest = new Refund({
            order: order._id,
            user: session,
            amount: order.price * order.quantity,
            reason: req.body.reason,
            status: 'pending'
        });

        await refundRequest.save();
 
        order.previousStatus = order.status;
        order.reasonForRefund = req.body.reason;
        order.status = 'Refund Requested';
        await order.save();

        res.json({ 
            success: true, 
            message: 'Refund request submitted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting refund request'
        });
    }
};

// Cancel a specific order
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.orderId });
        if (!order) {
            return res.status(404).json({ success: false });
        }

        // Restore inventory quantity
        const updateQuery = {};
        updateQuery[`sizes.${order.size}`] = order.quantity;

        const updatedVariant = await Variant.findByIdAndUpdate(
            order.variant,
            { $inc: updateQuery },
            { new: true, runValidators: true }
        );

        if (!updatedVariant) {
            return res.status(400).json({ 
                success: false,
                message: 'Failed to restore inventory'
            });
        }

        order.status = 'Cancelled';
        order.cancellationReason = req.body.reason;
        await order.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};