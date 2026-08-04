const Variant = require("../../models/variant");
const Cart = require("../../models/cart");
const Product = require("../../models/product");
const Coupon = require("../../models/coupon");
const Address = require("../../models/address");
const Order = require("../../models/order");
const User = require("../../models/user");
const Wallet = require("../../models/wallet");
const MainCategory = require("../../models/mainCategory");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getWalletBalance = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({
        user: userId,
        balance: 0,
        transactions: [],
      });
    }

    return res.json({ balance: wallet.balance });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.processWalletPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { shippingAddressId } = req.body;
    const userId = req.session.userId;

    if (!shippingAddressId) {
      return res.status(400).json({ error: "Select a shipping address." });
    }

    let orderResult;
    await session.withTransaction(async () => {
      const context = await loadOrderContext(
        userId,
        shippingAddressId,
        session,
      );
      const wallet = await Wallet.findOne({ user: userId }).session(session);

      if (!wallet) throw new Error("Wallet not found.");
      if (wallet.balance < context.totalAmount) {
        throw new Error("Insufficient wallet balance.");
      }

      wallet.balance -= context.totalAmount;
      wallet.transactions.push({
        type: "debited",
        amount: context.totalAmount,
        reason: "Purchase payment",
        timestamp: new Date(),
      });
      await wallet.save({ session });

      orderResult = await createOrdersFromContext(
        context,
        "wallet",
        { status: "Paid" },
        session,
      );
    });

    return res.json({
      success: true,
      message: "Wallet payment completed successfully.",
      ...orderResult,
    });
  } catch (error) {
    console.error("Wallet payment error:", error);
    return res.status(400).json({
      error: error.message || "Payment processing failed.",
    });
  } finally {
    await session.endSession();
  }
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { shippingAddressId } = req.body;
    const userId = req.session.userId;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        error: "Online payments are temporarily unavailable.",
      });
    }

    const context = await loadOrderContext(userId, shippingAddressId);

    const order = await razorpay.orders.create({
      amount: Math.round(context.totalAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.json({
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      userInfo: {
        name: context.user.username,
        email: context.user.email,
        phone: context.user.phone,
      },
    });
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingAddressId,
    } = req.body;

    if (
      !process.env.RAZORPAY_KEY_SECRET ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !shippingAddressId
    ) {
      return res.status(400).json({ error: "Incomplete payment details." });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(razorpay_signature, "utf8");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        paymentStatus: "failed",
        error: "Payment verification failed.",
      });
    }

    const orderResult = await executeOrderTransaction({
      userId: req.session.userId,
      shippingAddressId,
      paymentMethod: "razorpay",
      paymentDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      },
      paymentStatus: "Paid",
    });

    return res.json({
      ...orderResult,
      paymentStatus: "paid",
      redirect: "/users/order",
    });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return res.status(500).json({ error: "Payment verification failed." });
  }
};

exports.getCheckoutPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await Cart.findOne({ user: userId });
    const wallet = await Wallet.findOne({ user: userId });

    if (!cart) {
      return res.render("../views/pages/user/checkout", {
        items: [],
        discount: 0,
        walletBalance: wallet ? wallet.balance : 0,
      });
    }

    const cartItems = await Promise.all(
      cart.items.map(async (item) => {
        const variant = await Variant.findById(item.variantId);
        const product = await Product.findById(variant.productId);

        const inStock = variant.sizes[item.size] >= item.quantity;
        const availableStock = variant.sizes[item.size] || 0;

        return {
          variantId: item.variantId,
          productId: product._id,
          quantity: item.quantity,
          size: item.size,
          color: variant.color,
          images: variant.images,
          sizes: variant.sizes,
          name: product.name,
          price: product.price,
          discountPrice: product.discountPrice,
          inStock,
          availableStock,
        };
      }),
    );

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
    const subtotal = calculateTotal(cartItems);
    let discount = 0;

    if (cart.couponApplied) {
      const coupon = await Coupon.findOne({
        couponCode: cart.couponApplied,
        status: "Active",
        validity: { $gte: new Date() },
      });
      if (coupon && subtotal >= coupon.minAmount) {
        discount = Math.min(coupon.discount, subtotal);
      }
    }

    res.render("../views/pages/user/checkout", {
      items: cartItems,
      totalAmount: subtotal,
      discount,
      walletBalance: wallet ? wallet.balance : 0,
      categoriesWithSubs,
    });
  } catch (error) {
    console.error("Error loading checkout page:", error);
    res.status(500).send("Error loading checkout page");
  }
};

exports.createAddress = async (req, res) => {
  try {
    const { street, city, state, postalCode, country, phone, name } = req.body;
    const userId = req.session.userId;

    const addressCount = await Address.countDocuments({ userId });
    const isPrimary = addressCount === 0;

    const address = await Address.create({
      userId,
      name,
      street,
      city,
      state,
      postalCode,
      country,
      phone,
      isPrimary,
    });

    res.status(201).json(address);
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.editAddress = async (req, res) => {
  try {
    const { street, city, state, postalCode, country, phone, name } = req.body;
    const addressId = req.params.id;
    const userId = req.session.userId;

    const address = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      { street, city, state, postalCode, country, phone, name },
      { new: true, runValidators: true },
    );

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.json(address);
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.session.userId;

    const address = await Address.findOneAndDelete({ _id: addressId, userId });

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    // If deleted address was primary, make oldest address primary
    if (address.isPrimary) {
      const oldestAddress = await Address.findOne({ userId }).sort({
        createdAt: 1,
      });
      if (oldestAddress) {
        oldestAddress.isPrimary = true;
        await oldestAddress.save();
      }
    }

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.getAllAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.session.userId }).sort({
      isPrimary: -1,
      createdAt: -1,
    });

    res.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const { paymentMethod, shippingAddressId } = req.body;

    // Paid methods have dedicated, verified endpoints. This route is COD-only.
    if (paymentMethod !== "cod") {
      return res.status(400).json({ error: "Invalid payment method." });
    }

    const orderResult = await executeOrderTransaction({
      userId: req.session.userId,
      shippingAddressId,
      paymentMethod,
      paymentStatus: "Pending",
    });

    return res.status(200).json(orderResult);
  } catch (error) {
    console.error("Order creation failed:", error);
    const isClientError = [
      "Cart is empty.",
      "Invalid shipping address.",
      "Some items in your cart are out of stock.",
      "Cash on Delivery is not available for orders above ₹1,000.",
    ].includes(error.message);
    return res.status(isClientError ? 400 : 500).json({
      stock: error.message.includes("out of stock") ? "out" : undefined,
      error: "Order creation failed.",
      message: error.message,
    });
  }
};

async function executeOrderTransaction({
  userId,
  shippingAddressId,
  paymentMethod,
  paymentStatus,
  paymentDetails,
}) {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const context = await loadOrderContext(
        userId,
        shippingAddressId,
        session,
      );
      if (paymentMethod === "cod" && context.totalAmount > 1000) {
        throw new Error(
          "Cash on Delivery is not available for orders above ₹1,000.",
        );
      }
      result = await createOrdersFromContext(
        context,
        paymentMethod,
        { status: paymentStatus, details: paymentDetails },
        session,
      );
    });
    return result;
  } finally {
    await session.endSession();
  }
}

async function loadOrderContext(userId, shippingAddressId, session = null) {
  const sessionQuery = (query) => (session ? query.session(session) : query);
  const [user, cart, shippingAddress] = await Promise.all([
    sessionQuery(User.findById(userId)),
    sessionQuery(Cart.findOne({ user: userId })),
    sessionQuery(
      Address.findOne({
        _id: shippingAddressId,
        userId,
      }),
    ),
  ]);

  if (!user) throw new Error("User account not found.");
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty.");
  if (!shippingAddress) throw new Error("Invalid shipping address.");

  const items = [];
  for (const cartItem of cart.items) {
    const variant = await sessionQuery(Variant.findById(cartItem.variantId));
    if (
      !variant ||
      !variant.sizes[cartItem.size] ||
      variant.sizes[cartItem.size] < cartItem.quantity
    ) {
      throw new Error("Some items in your cart are out of stock.");
    }

    const product = await sessionQuery(Product.findById(variant.productId));
    if (!product) throw new Error("A product in your cart is unavailable.");

    items.push({ cartItem, variant, product });
  }

  const subtotal = items.reduce(
    (total, { cartItem, product }) =>
      total + (product.discountPrice || product.price) * cartItem.quantity,
    0,
  );

  let couponDiscount = 0;
  if (cart.couponApplied) {
    const coupon = await sessionQuery(
      Coupon.findOne({
        couponCode: cart.couponApplied,
        status: "Active",
        validity: { $gte: new Date() },
      }),
    );
    if (coupon && subtotal >= coupon.minAmount) {
      couponDiscount = Math.min(coupon.discount, subtotal);
    }
  }

  return {
    user,
    cart,
    shippingAddress,
    items,
    subtotal,
    couponDiscount,
    totalAmount: Math.max(0, subtotal + 20 - couponDiscount),
  };
}

async function createOrdersFromContext(
  context,
  paymentMethod,
  payment,
  session,
) {
  const discountPerProduct =
    context.items.length > 0
      ? context.couponDiscount / context.items.length
      : 0;
  const orderIds = [];

  for (const { cartItem, variant, product } of context.items) {
    const stockField = `sizes.${cartItem.size}`;
    const updatedVariant = await Variant.findOneAndUpdate(
      {
        _id: cartItem.variantId,
        [stockField]: { $gte: cartItem.quantity },
      },
      { $inc: { [stockField]: -cartItem.quantity } },
      { new: true, runValidators: true, session },
    );

    if (!updatedVariant) {
      throw new Error("Some items in your cart are out of stock.");
    }

    const originalPrice = product.discountPrice || product.price;
    const discountPerUnit = discountPerProduct / cartItem.quantity;
    const order = new Order({
      orderId: `order/${Date.now()}${crypto.randomInt(100000, 1000000)}`,
      userId: context.user.userId,
      name: product.name,
      image: variant.images?.[0] || product.image,
      price: Math.max(0, originalPrice - discountPerUnit),
      originalPrice,
      couponDiscountApplied: discountPerProduct,
      productId: product.productId,
      quantity: cartItem.quantity,
      size: cartItem.size,
      variant: cartItem.variantId,
      paymentMethod,
      status: "Pending",
      address: {
        street: context.shippingAddress.street,
        city: context.shippingAddress.city,
        state: context.shippingAddress.state,
        postalCode: context.shippingAddress.postalCode,
        country: context.shippingAddress.country,
      },
      paymentStatus: payment.status,
      paymentDetails: payment.details || null,
      couponApplied: context.cart.couponApplied || null,
    });
    await order.save({ session });
    orderIds.push(order._id);
  }

  await Cart.updateOne(
    { _id: context.cart._id },
    { $set: { items: [], couponApplied: null } },
    { session },
  );

  return {
    success: true,
    message: "Order placed successfully.",
    orders: orderIds,
    totalAmount: context.totalAmount,
  };
}

function calculateTotal(items) {
  return items.reduce(
    (total, item) => total + (item.discountPrice || item.price) * item.quantity,
    0,
  );
}

exports.setPrimaryAddress = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const addressId = req.params.id;
    const userId = req.session.userId;

    const targetAddress = await Address.exists({
      _id: addressId,
      userId,
    }).session(session);
    if (!targetAddress) {
      throw new Error("Address not found");
    }

    await Address.updateMany({ userId }, { isPrimary: false }, { session });

    const address = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      { isPrimary: true },
      { new: true, session },
    );

    await session.commitTransaction();
    res.json(address);
  } catch (error) {
    await session.abortTransaction();
    console.error("Error setting primary address:", error);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

exports.getPrimaryAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const address = await Address.findOne({ userId, isPrimary: true });

    if (!address) {
      return res.status(404).json({ error: "No primary address found" });
    }

    res.json(address);
  } catch (error) {
    console.error("Error fetching primary address:", error);
    res.status(400).json({ error: error.message });
  }
};
