const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  productId: {
    type: Number,
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Variant",
    required: true,
  },
  orderDate: { type: Date, default: Date.now },
  paymentMethod: {
    type: String,
    enum: ["cod", "credit", "debit", "upi", "razorpay", "wallet"],
    required: true,
  },
  status: {
    type: String,
    default: "Pending",
    enum: [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Refund Requested",
      "refunded",
      "Returned",
      "Payment Failed",
    ],
  },
  previousStatus: {
    type: String,
    default: "null",
    enum: ["Pending", "Processing", "Shipped", "Delivered", "null"],
  },
  reasonForRefund: {
    type: String,
  },
  address: {
    street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
    },
    country: {
      type: String,
      trim: true,
    },
  },
  couponApplied: {
    type: String,
    default: null,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending",
  },
  paymentDetails: {
    type: Object,
    default: null,
  },
  couponDiscountApplied: { type: Number, default: 0 },
});

module.exports = mongoose.model("Order", orderSchema);
