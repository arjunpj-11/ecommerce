var express = require("express");
var router = express.Router();

const dashboardRouter = require("./admin/dashboard");
const productsRouter = require("./admin/products");
const variantRouter = require("./admin/variant");
const mainCategoryRouter = require("./admin/mainCategory");
const subcategoryRouter = require("./admin/subCategory");
const ordersRouter = require("./admin/orders");
const couponRouter = require("./admin/coupons");
const userRouter = require("./admin/users");
const salesRouter = require("./admin/sales");
const bannerRouter = require("./admin/banner");

const authMiddleware = require("../middlewares/adminLoginCheck");

router.use("/dashboard", authMiddleware, dashboardRouter);
router.use("/products", authMiddleware, productsRouter);
router.use("/variant", authMiddleware, variantRouter);
router.use("/maincategories", authMiddleware, mainCategoryRouter);
router.use("/subcategories", authMiddleware, subcategoryRouter);
router.use("/orders", authMiddleware, ordersRouter);
router.use("/coupons", authMiddleware, couponRouter);
router.use("/users", authMiddleware, userRouter);
router.use("/sales", authMiddleware, salesRouter);
router.use("/banner", authMiddleware, bannerRouter);

router.post("/logout", async (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "We could not log you out." });
    }

    res.clearCookie("arni.sid");
    return res.status(200).json({
      success: true,
      redirect: "/auth/login",
    });
  });
});

module.exports = router;
