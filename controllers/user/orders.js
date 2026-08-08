const mongoose = require("mongoose");
const Order = require("../../models/order");
const User = require("../../models/user");
const MainCategory = require("../../models/mainCategory");
const orderOverviewController = require("./orderOverview");

exports.getAllOrders = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect("/auth/login");

    const requestedPage = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 5;
    const totalOrders = await Order.countDocuments({ userId: user.userId });
    const totalPages = Math.max(1, Math.ceil(totalOrders / limit));
    const page = Math.min(requestedPage, totalPages);

    const [orders, categoriesWithSubs] = await Promise.all([
      Order.find({ userId: user.userId })
        .populate("variant")
        .sort({ orderDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      MainCategory.aggregate([
        { $match: { status: "active" } },
        {
          $lookup: {
            from: "subcategories",
            localField: "_id",
            foreignField: "mainCategory",
            pipeline: [{ $match: { status: "active" } }],
            as: "subcategories",
          },
        },
      ]),
    ]);

    res.render("../views/pages/user/orders", {
      user,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalOrders,
        itemsPerPage: limit,
      },
      categoriesWithSubs,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Error loading orders");
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.orderId)) {
      return res.status(404).json({ message: "Order not found" });
    }
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: user.userId,
    }).populate("variant");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Error loading order" });
  }
};

exports.cancelOrder = orderOverviewController.cancelOrder;
