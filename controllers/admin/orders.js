const Order = require("../../models/order");
const Wallet = require("../../models/wallet");
const RefundRequest = require("../../models/refund");
const User = require("../../models/user");
const email = require("../../utilities/sendEmail");
const Variant = require("../../models/variant");
const mongoose = require("mongoose");

const STATUS_TRANSITIONS = {
  Pending: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
};

exports.updateOrderStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (!STATUS_TRANSITIONS[existingOrder.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot move from ${existingOrder.status} to ${status}`,
      });
    }

    let order;
    if (status === "Cancelled") {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          order = await Order.findOne({
            _id: id,
            status: existingOrder.status,
          }).session(session);
          if (!order) throw new Error("ORDER_STATUS_CHANGED");

          await Variant.findByIdAndUpdate(
            order.variant,
            { $inc: { [`sizes.${order.size}`]: order.quantity } },
            { session },
          );

          if (order.paymentStatus === "Paid") {
            const user = await User.findOne({ userId: order.userId }).session(
              session,
            );
            if (!user) throw new Error("ORDER_USER_NOT_FOUND");
            const refundAmount =
              order.price * order.quantity + (order.shippingFee ?? 20);
            await Wallet.findOneAndUpdate(
              { user: user._id },
              {
                $inc: { balance: refundAmount },
                $push: {
                  transactions: {
                    type: "credited",
                    amount: refundAmount,
                    reason: `Refund for cancelled order ${order.orderId}`,
                    timestamp: new Date(),
                  },
                },
              },
              { upsert: true, new: true, setDefaultsOnInsert: true, session },
            );
            order.paymentStatus = "Refunded";
          }

          order.status = "Cancelled";
          order.cancellationReason =
            String(req.body.reason || "").trim() ||
            "Cancelled by administrator";
          await order.save({ session });
        });
      } finally {
        await session.endSession();
      }
    } else {
      const updates = { status };
      if (status === "Delivered" && existingOrder.paymentMethod === "cod") {
        updates.paymentStatus = "Paid";
      }
      order = await Order.findOneAndUpdate(
        { _id: id, status: existingOrder.status },
        updates,
        { new: true, runValidators: true },
      );
      if (!order) throw new Error("ORDER_STATUS_CHANGED");
    }

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const user = await User.findOne({ userId: order.userId });
    if (user && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      void email(status, user.email, order.orderId);
    }
    res.json({ success: true, order });
  } catch (error) {
    console.error("Error updating order status:", error);
    if (error.message === "ORDER_STATUS_CHANGED") {
      return res.status(409).json({
        success: false,
        message: "Order status changed. Refresh and try again.",
      });
    }
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;
  try {
    let matchStage = {};
    if (status && status !== "All") {
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
          as: "variantDetails",
        },
      },
      {
        $unwind: { path: "$variantDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          image: 1,
          price: 1,
          quantity: 1,
          size: 1,
          variant: 1,
          paymentMethod: 1,
          status: 1,
          orderDate: 1,
          address: 1,
          reasonForRefund: 1,
          orderId: 1,
          shippingFee: 1,
        },
      },
      { $sort: { orderDate: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
    ]);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    next(error);
  }
};

exports.approveRefund = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status !== "Refund Requested") {
      return res.status(400).json({
        success: false,
        message: "This order does not have a pending refund request",
      });
    }

    const refundAmount = order.price * order.quantity;

    if (order.previousStatus === "Delivered") {
      order.status = "Returned";
    } else {
      const updateQuery = {};
      updateQuery[`sizes.${order.size}`] = order.quantity;

      const updatedVariant = await Variant.findByIdAndUpdate(
        order.variant,
        { $inc: updateQuery },
        { new: true, runValidators: true },
      );

      if (!updatedVariant) {
        return res
          .status(400)
          .json({ success: false, message: "Failed to restore inventory" });
      }
      order.status = "Cancelled";
    }

    order.paymentStatus = "Refunded";
    await order.save();

    const dbUser = await User.findOne({ userId: order.userId });
    if (!dbUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found for this order" });
    }

    let wallet = await Wallet.findOne({ user: dbUser._id });
    if (!wallet) {
      wallet = new Wallet({
        user: dbUser._id,
        balance: refundAmount,
        transactions: [
          {
            type: "credited",
            amount: refundAmount,
            reason: `Refund for order ${order.orderId}`,
          },
        ],
      });
    } else {
      wallet.balance += refundAmount;
      wallet.transactions.push({
        type: "credited",
        amount: refundAmount,
        reason: `Refund for order ${order.orderId}: ${req.body.reason || "Approved"}`,
      });
    }

    await wallet.save();
    await RefundRequest.findOneAndUpdate(
      { order: order._id, status: "pending" },
      { status: "approved", responseDate: new Date() },
    );
    res.json({ success: true, message: "Refund processed successfully" });
  } catch (error) {
    console.error("Refund Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error processing refund" });
  }
};

exports.rejectRefund = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status !== "Refund Requested") {
      return res.status(400).json({
        success: false,
        message: "This order does not have a pending refund request",
      });
    }

    order.status = order.previousStatus;
    await order.save();
    await RefundRequest.findOneAndUpdate(
      { order: order._id, status: "pending" },
      { status: "rejected", responseDate: new Date() },
    );

    res.json({ success: true, message: "Refund rejected successfully" });
  } catch (error) {
    console.error("Refund Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error processing refund" });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching order details",
    });
  }
};
