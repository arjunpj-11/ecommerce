const Variant = require("../../models/variant");
const Product = require("../../models/product");
const MainCategory = require("../../models/mainCategory");
const SubCategory = require("../../models/subCategory");
const mongoose = require("mongoose");

// GET variant with product details
const getVariantWithProductDetails = async (req, res) => {
  try {
    // Fetch the variant by ID and join with product details
    const variantData = await Variant.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.variantId),
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
    ]);

    if (!variantData || variantData.length === 0) {
      return res.status(404).send("Variant not found"); // Handle case where variant is not found
    }

    const currentVariant = variantData[0];
    const currentProduct = currentVariant.productDetails[0];

    // Get all variants for the same product
    const allVariants = await Variant.aggregate([
      {
        $match: {
          productId: currentVariant.productId,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
    ]);

    // Recommend one representative variant per other product.
    const relatedProducts = await Variant.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" }, // Flatten the productDetails array
      {
        $match: {
          productId: { $ne: currentVariant.productId },
          "productDetails.subCategory": currentProduct.subCategory,
          "productDetails.status": "active",
        },
      },
      { $sort: { "productDetails.review": -1, _id: 1 } },
      {
        $group: {
          _id: "$productId",
          variant: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$variant" } },
      {
        $project: {
          _id: 1,
          productId: 1,
          color: 1,
          images: { $arrayElemAt: ["$images", 0] },
          sizes: 1,
          tags: 1,
          productDetails: 1,
        },
      },
      { $limit: 6 },
    ]);

    const authentication = req.session.isAuthenticated;

    // Get all categories with subcategories for hover menu
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

    // Send response with data
    res.render("../views/pages/index/overview", {
      variant: currentVariant,
      product: currentProduct,
      allVariants: allVariants,
      relatedProducts: relatedProducts,
      authentication,
      categoriesWithSubs,
    });
  } catch (error) {
    console.error("Error fetching variant with product details:", error);
    res.status(500).send("Server error"); // Handle server error
  }
};

// GET variant data
const getVariantData = async (req, res) => {
  try {
    // Fetch the variant by ID and join with product details
    const variantData = await Variant.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.variantId),
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
    ]);

    if (!variantData || variantData.length === 0) {
      return res.status(404).json({ error: "Variant not found" }); // Handle case where variant is not found
    }

    res.json(variantData[0]); // Return the variant data as JSON
  } catch (error) {
    res.status(500).json({ error: "Server error" }); // Handle server error
  }
};

module.exports = {
  getVariantWithProductDetails,
  getVariantData,
};
