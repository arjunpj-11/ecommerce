const Order = require('../../models/order');
const mongoose = require('mongoose');
const User = require('../../models/user');
const MainCategory = require('../../models/mainCategory');

// GET all orders for the user
exports.getAllOrders = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findOne({ _id: userId });
        const _id_ = user.userId;

        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalOrders = await Order.countDocuments({ userId: _id_ });
        const totalPages = Math.ceil(totalOrders / limit);

        // Fetch paginated orders
        const orders = await Order.find({ userId: _id_ })
            .populate('variant')
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit);

        // Get categories with subcategories for the hover menu
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

        // Render the orders page with the fetched data
        res.render('../views/pages/user/orders', {
            user: userId,
            orders: orders,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalOrders,
                itemsPerPage: limit
            },
            categoriesWithSubs
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Server error'); // Handle server error
    }
};

// GET order details
exports.getOrderDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findOne({ _id: userId });
        const _id_ = user.userId;

        const order = await Order.findOne({
            _id: req.params.orderId,
            userId: _id_
        }).populate('variant');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' }); // Handle not found error
        }

        res.json(order); // Return order details as JSON
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Server error'); // Handle server error
    }
};

// Cancel an order
exports.cancelOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findOne({ _id: userId });
        const _id_ = user.userId;

        const order = await Order.findOne({
            _id: req.params.orderId,
            userId: _id_
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' }); // Handle not found error
        }

        if (order.status === 'Delivered' || order.status === 'Cancelled') {
            return res.status(400).json({ message: 'Order cannot be cancelled' }); // Handle cancellation error
        }

        order.status = 'Cancelled'; // Update order status
        await order.save();

        res.json({ message: 'Order cancelled successfully' }); // Return success response
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).send('Server error'); // Handle server error
    }
};