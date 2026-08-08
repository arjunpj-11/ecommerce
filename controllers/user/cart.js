const Variant = require("../../models/variant");
const Cart = require("../../models/cart");
const Product = require("../../models/product");
const Coupon = require("../../models/coupon");
const mongoose = require("mongoose");
const MainCategory = require("../../models/mainCategory");
const SubCategory = require("../../models/subCategory");
const User = require("../../models/user");
const Order = require("../../models/order");

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { variantId, selectedSize, quantity } = req.body;
    const requestedQuantity = Number(quantity);

    if (!mongoose.isValidObjectId(variantId)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid product option.",
      });
    }

    if (
      !selectedSize ||
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a size and enter a quantity of at least one.",
      });
    }

    // Check stock availability
    const variant = await Variant.findById(variantId);
    if (
      !variant ||
      !Object.prototype.hasOwnProperty.call(
        variant.sizes || {},
        selectedSize,
      ) ||
      Number(variant.sizes[selectedSize]) < requestedQuantity
    ) {
      return res.status(400).json({
        success: false,
        message: `Only ${Number(variant?.sizes?.[selectedSize] || 0)} item(s) are available in size ${selectedSize}.`,
      });
    }

    // Find cart or create a new one if it doesn't exist
    let cart = await Cart.findOne({ user: req.session.userId });

    if (!cart) {
      cart = new Cart({
        user: req.session.userId,
        items: [],
      });
    } else {
      // Check for existing item in cart
      const existingItemIndex = cart.items.findIndex(
        (item) =>
          item.variantId.toString() === variantId && item.size === selectedSize,
      );

      if (existingItemIndex !== -1) {
        return res.status(409).json({
          success: false,
          exists: true,
          message: "This size and colour are already in your cart.",
        });
      }
    }

    // Add new item to cart
    cart.items.push({
      variantId,
      size: selectedSize,
      quantity: requestedQuantity,
    });
    await cart.save();

    res.json({
      success: true,
      message: "Item added to cart successfully",
    });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({
      success: false,
      message: "We could not add this item right now. Please try again.",
    });
  }
};

// Check whether a specific variant and size is already in the current cart.
exports.getItemStatus = async (req, res) => {
  try {
    const { variantId, size } = req.query;
    if (!mongoose.isValidObjectId(variantId) || !size) {
      return res.status(400).json({
        success: false,
        message: "A valid product option and size are required.",
      });
    }

    const cart = await Cart.findOne({ user: req.session.userId }).select(
      "items",
    );
    const item = cart?.items.find(
      (cartItem) =>
        cartItem.variantId.toString() === variantId && cartItem.size === size,
    );

    return res.json({
      success: true,
      exists: Boolean(item),
      quantity: item?.quantity || 0,
    });
  } catch (error) {
    console.error("Error checking cart item status:", error);
    return res.status(500).json({
      success: false,
      message: "We could not check your cart right now.",
    });
  }
};

// Get cart items
exports.getCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await Cart.findOne({ user: userId });

    // Find the user to check their order history for used coupons
    const user = await User.findById(userId);

    // Get all active, non-expired coupons
    const allActiveCoupons = await Coupon.find({
      status: "Active",
      validity: { $gte: new Date() },
    });

    // Get all orders by this user to check which coupons they've used
    const userOrders =
      user && user.userId ? await Order.find({ userId: user.userId }) : [];

    // Extract all coupon codes the user has already used
    const usedCouponCodes = userOrders
      .filter((order) => order.couponApplied)
      .map((order) => order.couponApplied);

    // Filter out coupons that the user has already used
    const availableCoupons = allActiveCoupons.filter(
      (coupon) => !usedCouponCodes.includes(coupon.couponCode),
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

    if (!cart) {
      return res.render("../views/pages/user/cart", {
        items: [],
        coupons: availableCoupons,
        appliedCoupon: null,
        categoriesWithSubs,
      });
    }

    const resolvedItems = await Promise.all(
      cart.items.map(async (item) => {
        const variant = await Variant.findById(item.variantId);
        if (!variant) return null;
        const product = await Product.findById(variant.productId);
        if (!product) return null;

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
    const cartItems = resolvedItems.filter(Boolean);

    // Get applied coupon details if exists
    let appliedCouponDetails = null;
    if (cart.couponApplied) {
      appliedCouponDetails = await Coupon.findOne({
        couponCode: cart.couponApplied,
      });
    }

    res.render("../views/pages/user/cart", {
      items: cartItems,
      totalAmount: calculateTotal(cartItems),
      coupons: availableCoupons,
      appliedCoupon: appliedCouponDetails,
      categoriesWithSubs,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).send("Error fetching cart");
  }
};

// Update item quantity in cart
exports.updateQuantity = async (req, res) => {
  try {
    const { variantId, quantity, size2 } = req.body;
    const requestedQuantity = Number(quantity);

    if (
      !mongoose.isValidObjectId(variantId) ||
      !size2 ||
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        error: "Quantity must be a whole number greater than zero.",
      });
    }

    // Check stock availability for the specific size
    const variant = await Variant.findById(variantId);
    const availableStock = Number(variant?.sizes?.[size2] || 0);
    if (!variant || availableStock < requestedQuantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${availableStock} item(s) are available in size ${size2}.`,
      });
    }

    const cart = await Cart.findOne({ user: req.session.userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.variantId.toString() === variantId && item.size === size2,
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = requestedQuantity;
      const couponCleared = Boolean(cart.couponApplied);
      cart.couponApplied = null;
      await cart.save();
      res.json({ success: true, quantity: requestedQuantity, couponCleared });
    } else {
      res.status(404).json({ error: "Item not found in cart" });
    }
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Remove item from cart
exports.removeItem = async (req, res) => {
  try {
    const { variantId, size } = req.body;
    if (!mongoose.isValidObjectId(variantId) || !size) {
      return res.status(400).json({
        success: false,
        error: "A valid cart item is required.",
      });
    }
    const cart = await Cart.findOne({ user: req.session.userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const originalLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) =>
        !(item.variantId.toString() === variantId && item.size === size),
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    const couponCleared = Boolean(cart.couponApplied);
    cart.couponApplied = null;
    await cart.save();
    res.json({
      success: true,
      couponCleared,
      message: "Item removed from your cart.",
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Apply coupon to cart
exports.applyCoupon = async (req, res) => {
  try {
    const rawCode = req.body.code || req.body.couponCode;
    if (!rawCode) {
      return res.status(400).json({ error: "Coupon code is required" });
    }
    const code = rawCode.trim().toUpperCase();

    // Find active coupon
    const coupon = await Coupon.findOne({
      couponCode: code,
      status: "Active",
      validity: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(400).json({ error: "Invalid or expired coupon" });
    }

    // Get cart and calculate total
    const cart = await Cart.findOne({ user: req.session.userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Check if another coupon is already applied
    if (cart.couponApplied) {
      return res.status(400).json({
        error: "Another coupon is already applied. Please clear it first.",
      });
    }

    const cartItems = await Promise.all(
      cart.items.map(async (item) => {
        const variant = await Variant.findById(item.variantId);
        const product = await Product.findById(variant.productId);
        return {
          quantity: item.quantity,
          price: product.discountPrice || product.price,
        };
      }),
    );

    const subtotal = calculateTotal(cartItems);

    // Validate minimum purchase amount
    if (subtotal < coupon.minAmount) {
      return res.status(400).json({
        error: `Minimum purchase amount of ₹${coupon.minAmount} required`,
      });
    }

    // Save coupon to cart
    cart.couponApplied = code.toUpperCase();
    await cart.save();

    res.json({
      success: true,
      discount: coupon.discount,
      total: subtotal - coupon.discount + 20,
      message: "Coupon applied successfully",
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ error: "Server error while applying coupon" });
  }
};

// Clear coupon from cart
exports.clearCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.userId });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    if (!cart.couponApplied) {
      return res.status(400).json({ error: "No coupon currently applied" });
    }

    // Remove coupon from cart
    cart.couponApplied = null;
    await cart.save();

    // Recalculate totals
    const cartItems = await Promise.all(
      cart.items.map(async (item) => {
        const variant = await Variant.findById(item.variantId);
        const product = await Product.findById(variant.productId);
        return {
          quantity: item.quantity,
          price: product.discountPrice || product.price,
        };
      }),
    );

    const subtotal = calculateTotal(cartItems);

    res.json({
      success: true,
      total: subtotal + 20,
      message: "Coupon removed successfully",
    });
  } catch (error) {
    console.error("Error clearing coupon:", error);
    res.status(500).json({ error: "Server error while clearing coupon" });
  }
};

// Calculate total price of items in cart
function calculateTotal(items) {
  return items.reduce(
    (total, item) => total + (item.discountPrice || item.price) * item.quantity,
    0,
  );
}
