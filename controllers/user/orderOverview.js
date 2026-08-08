const Order = require("../../models/order");
const Wallet = require("../../models/wallet");
const User = require("../../models/user");
const Refund = require("../../models/refund");
const PDFDocument = require("pdfkit");
const MainCategory = require("../../models/mainCategory");
const Variant = require("../../models/variant");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function findOwnedOrder(req, orderId) {
  if (!mongoose.isValidObjectId(orderId)) {
    return { user: null, order: null };
  }

  const user = await User.findById(req.session.userId).select(
    "userId username email profileImage",
  );
  if (!user) return { user: null, order: null };

  const order = await Order.findOne({
    _id: orderId,
    userId: user.userId,
  }).populate("variant");
  return { user, order };
}

exports.generateInvoice = async (req, res) => {
  try {
    const { order } = await findOwnedOrder(req, req.params.orderId);
    if (!order) return res.status(404).send("Order not found");
    if (order.status !== "Delivered") {
      return res.status(400).send("Invoice is available after delivery");
    }

    const shippingFee = order.shippingFee ?? 20;

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.orderId}.pdf`,
    );

    doc.pipe(res);
    doc.fontSize(25).text("ARNI", { align: "center" });
    doc.moveDown();
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Order ID: ${order.orderId}`);
    doc.text(`Date: ${order.orderDate.toLocaleDateString()}`);
    doc.moveDown();

    doc.text(`Product: ${order.name}`);
    doc.text(`Size: ${order.size}`);
    doc.text(`Quantity: ${order.quantity}`);
    doc.text(`Price per item: ₹${order.price.toFixed(2)}`);
    doc.text(`Shipping: ₹${shippingFee.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(14);
    doc.text(
      `Total Amount: ₹${(order.price * order.quantity + shippingFee).toFixed(
        2,
      )}`,
      { bold: true },
    );

    doc.end();
  } catch (error) {
    res.status(500).send("Error generating invoice");
  }
};

exports.retryPayment = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res
        .status(503)
        .json({ success: false, message: "Online payments are unavailable." });
    }

    const { order } = await findOwnedOrder(req, req.params.orderId);
    if (!order) return res.status(404).json({ success: false });
    if (order.status !== "Payment Failed") {
      return res.status(400).json({
        success: false,
        message: "Only failed payments can be retried.",
      });
    }

    const amount =
      (order.price * order.quantity + (order.shippingFee ?? 20)) * 100;
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: order.orderId,
      payment_capture: 1,
    });
    order.paymentDetails = {
      ...(order.paymentDetails || {}),
      retryOrderId: razorpayOrder.id,
    };
    await order.save();

    res.json({
      success: true,
      order: razorpayOrder,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.verifyRetryPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, orderId } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !orderId) {
      return res.status(400).json({ success: false });
    }

    const { order } = await findOwnedOrder(req, orderId);
    if (!order) return res.status(404).json({ success: false });
    if (order.status !== "Payment Failed") {
      return res.status(400).json({ success: false });
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const expectedAmount = Math.round(
      (order.price * order.quantity + (order.shippingFee ?? 20)) * 100,
    );
    const retryOrderId = order.paymentDetails?.retryOrderId;

    if (
      retryOrderId &&
      razorpay_order_id === retryOrderId &&
      payment.order_id === retryOrderId &&
      payment.amount === expectedAmount &&
      payment.status === "captured"
    ) {
      order.status = "Pending";
      order.paymentStatus = "Paid";
      await order.save();

      res.json({ success: true });
    } else {
      res.status(400).json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const { user, order } = await findOwnedOrder(req, req.params.orderId);

    if (!order) {
      return res.status(404).render("error", {
        message: "Order not found",
        error: { status: 404, stack: "" },
      });
    }
    const existence = await Refund.findOne({ order: order._id });
    const isThere = Boolean(existence);

    const categoriesWithSubs = await MainCategory.aggregate([
      {
        $match: { status: "active" },
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "_id",
          foreignField: "mainCategory",
          pipeline: [{ $match: { status: "active" } }],
          as: "subcategories",
        },
      },
    ]);

    res.render("../views/pages/user/orderOverview", {
      order,
      user,
      categoriesWithSubs,
      isThere,
    });
  } catch (error) {
    res.status(500).render("error", {
      message: "Error fetching order details",
      error,
    });
  }
};

exports.createRefundRequest = async (req, res) => {
  try {
    const session = req.session.userId;
    const { order } = await findOwnedOrder(req, req.params.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const reason = String(req.body.reason || "").trim();
    if (reason.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Please provide a refund reason of at least 5 characters.",
      });
    }
    if (order.status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "A refund can be requested after the order is delivered.",
      });
    }

    const existingRequest = await Refund.findOne({ order: order._id });
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "A refund request already exists for this order",
      });
    }

    const refundRequest = new Refund({
      order: order._id,
      user: session,
      amount: order.price * order.quantity,
      reason,
      status: "pending",
    });

    await refundRequest.save();

    order.previousStatus = order.status;
    order.reasonForRefund = reason;
    order.status = "Refund Requested";
    await order.save();

    res.json({
      success: true,
      message: "Refund request submitted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error submitting refund request",
    });
  }
};

// Cancel a specific order
exports.cancelOrder = async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  if (reason.length < 5) {
    return res.status(400).json({
      success: false,
      message: "Please provide a cancellation reason of at least 5 characters.",
    });
  }
  if (reason.length > 300) {
    return res.status(400).json({
      success: false,
      message: "Cancellation reason must be 300 characters or fewer.",
    });
  }

  const session = await mongoose.startSession();
  try {
    const userId = req.session.userId;
    const { user, order: ownedOrder } = await findOwnedOrder(
      req,
      req.params.orderId,
    );
    if (!ownedOrder || !user) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (!["Pending", "Processing"].includes(ownedOrder.status)) {
      return res
        .status(400)
        .json({ success: false, message: "Order cannot be cancelled" });
    }

    let message = "Order cancelled successfully";
    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: ownedOrder._id,
        userId: user.userId,
        status: { $in: ["Pending", "Processing"] },
      }).session(session);
      if (!order) throw new Error("ORDER_STATUS_CHANGED");

      if (order.variant && order.size && order.quantity) {
        await Variant.findByIdAndUpdate(
          order.variant,
          { $inc: { [`sizes.${order.size}`]: order.quantity } },
          { session },
        );
      }

      if (order.paymentStatus === "Paid") {
        const refundAmount =
          order.price * order.quantity + (order.shippingFee ?? 20);
        const wallet = await Wallet.findOneAndUpdate(
          { user: userId },
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
          { new: true, upsert: true, setDefaultsOnInsert: true, session },
        );
        if (!wallet) throw new Error("WALLET_REFUND_FAILED");
        order.paymentStatus = "Refunded";
        message = `Order cancelled successfully and ₹${refundAmount.toFixed(2)} refunded to your wallet`;
      }

      order.status = "Cancelled";
      order.cancellationReason = reason;
      await order.save({ session });
    });

    res.json({ success: true, message });
  } catch (error) {
    console.error("Error cancelling order overview:", error);
    if (error.message === "ORDER_STATUS_CHANGED") {
      return res.status(409).json({
        success: false,
        message: "Order status changed. Refresh the page and try again.",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error while cancelling order" });
  } finally {
    await session.endSession();
  }
};
