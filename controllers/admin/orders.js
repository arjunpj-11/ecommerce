const Order = require('../../models/order');
const Wallet = require('../../models/wallet');
const RefundRequest = require('../../models/refund');
const User = require('../../models/user');
const email = require('../../utilities/sendEmail');
const Variant = require('../../models/variant');

exports.updateOrderStatus = async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const user = await User.findOne({ userId: order.userId });
        email(status, user.email, order.orderId);
        res.json({ success: true, order });
    } catch (error) {
        console.error('Error updating order status:', error);
        next(error);
    }
};

exports.getAllOrders = async (req, res, next) => {
    const { status, page = 1, limit = 10 } = req.query;
    try {
        let matchStage = {};
        if (status && status !== 'All') {
            matchStage.status = status;
        }

        const totalOrders = await Order.countDocuments(matchStage);
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await Order.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "variants",
                    localField: "variant",
                    foreignField: "_id",
                    as: "variantDetails"
                }
            },
            { $unwind: "$variantDetails" },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    name: 1,
                    image: 1,
                    price: 1,
                    quantity: 1,
                    size: 1,
                    variant: {
                        _id: "$variantDetails._id",
                        images: "$variantDetails.images"
                    },
                    paymentMethod: 1,
                    status: 1,
                    orderDate: 1,
                    address: 1,
                    reasonForRefund: 1,
                    orderId: 1
                }
            },
            { $sort: { orderDate: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: parseInt(limit) }
        ]);

        res.json({
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalOrders,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
        });
    } catch (error) {
        console.error('Error in getAllOrders:', error);
        next(error);
    }
};

exports.approveRefund = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const refundAmount = order.price * order.quantity;

        if (order.previousStatus === 'Delivered') {
            order.status = 'Returned';
        } else {
            const updateQuery = {};
            updateQuery[`sizes.${order.size}`] = order.quantity;

            const updatedVariant = await Variant.findByIdAndUpdate(
                order.variant,
                { $inc: updateQuery },
                { new: true, runValidators: true }
            );

            if (!updatedVariant) {
                return res.status(400).json({ success: false, message: 'Failed to restore inventory' });
            }
            order.status = 'Cancelled';
        }

        order.paymentStatus = 'Refunded';
        await order.save();

        const userId = await User.findOne({ userId: order.userId });
        const user = userId._id;

        let wallet = await Wallet.findOne({ user: user });
        if (!wallet) {
            wallet = new Wallet({
                user: order.userId,
                balance: refundAmount,
                transactions: [{
                    type: 'credited',
                    amount: refundAmount,
                    reason: `Refund for order ${order.orderId}`
                }]
            });
        } else {
            wallet.balance += refundAmount;
            wallet.transactions.push({
                type: 'credited',
                amount: refundAmount,
                reason: `Refund for order ${order.orderId}: ${req.body.reason}`
            });
        }

        await wallet.save();
        res.json({ success: true, message: 'Refund processed successfully' });
    } catch (error) {
        console.error('Refund Error:', error);
        res.status(500).json({ success: false, message: 'Error processing refund' });
    }
};

exports.rejectRefund = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = order.previousStatus;
        await order.save();

        res.json({ success: true, message: 'Refund rejected successfully' });
    } catch (error) {
        console.error('Refund Error:', error);
        res.status(500).json({ success: false, message: 'Error processing refund' });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findOne({ _id: orderId });
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        res.json({ success: true, order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching order details' });
    }
};