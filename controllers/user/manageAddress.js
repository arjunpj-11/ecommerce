const Address = require("../../models/address");
const MainCategory = require("../../models/mainCategory");
const User = require("../../models/user");

function pickAddressFields(body) {
  return {
    street: body.street,
    city: body.city,
    state: body.state,
    postalCode: body.postalCode,
    country: body.country,
    isPrimary: body.isPrimary === true || body.isPrimary === "on",
  };
}

// GET all addresses for the user
exports.getAllAddresses = async (req, res) => {
  try {
    // Get all active categories with their subcategories for the hover menu
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

    const [addresses, user] = await Promise.all([
      Address.find({ userId: req.session.userId }),
      User.findById(req.session.userId).select("-password"),
    ]);
    res.render("../views/pages/user/manageAddress", {
      user,
      addresses,
      categoriesWithSubs,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).send("Server error"); // Handle server error
  }
};

// Create a new address
exports.createAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const fields = pickAddressFields(req.body);
    const addressCount = await Address.countDocuments({ userId });
    fields.isPrimary = fields.isPrimary || addressCount === 0;

    if (fields.isPrimary) {
      await Address.updateMany({ userId }, { isPrimary: false });
    }

    const address = await Address.create({ ...fields, userId });
    res.status(201).json({ success: true, address });
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(400).json({ success: false, error: error.message }); // Handle validation error
  }
};

// Update an existing address
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const fields = pickAddressFields(req.body);

    if (fields.isPrimary) {
      await Address.updateMany({ userId }, { isPrimary: false });
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId },
      fields,
      { new: true, runValidators: true },
    );
    if (!address) {
      return res
        .status(404)
        .json({ success: false, error: "Address not found" }); // Handle not found error
    }
    res.status(200).json({ success: true, address }); // Return updated address
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(400).json({ success: false, error: error.message }); // Handle validation error
  }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      userId,
    });
    if (!address) {
      return res
        .status(404)
        .json({ success: false, error: "Address not found" }); // Handle not found error
    }
    if (address.isPrimary) {
      const replacement = await Address.findOne({ userId }).sort({
        createdAt: 1,
      });
      if (replacement) {
        replacement.isPrimary = true;
        await replacement.save();
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(400).json({ success: false, error: error.message }); // Handle validation error
  }
};

// Set an address as primary
exports.setPrimaryAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const target = await Address.findOne({ _id: req.params.id, userId });
    if (!target) {
      return res
        .status(404)
        .json({ success: false, error: "Address not found" });
    }

    await Address.updateMany({ userId }, { isPrimary: false });
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isPrimary: true },
      { new: true },
    );
    res.status(200).json({ success: true, address });
  } catch (error) {
    console.error("Error setting primary address:", error);
    res.status(400).json({ success: false, error: error.message }); // Handle validation error
  }
};
