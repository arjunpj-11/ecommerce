const User = require("../../models/user");
const MainCategory = require("../../models/mainCategory");

// Allowed pre-created avatars
const ALLOWED_AVATARS = [
  "/images/avatars/avatar-1.svg",
  "/images/avatars/avatar-2.svg",
  "/images/avatars/avatar-3.svg",
  "/images/avatars/avatar-4.svg",
  "/images/avatars/avatar-5.svg",
  "/images/avatars/avatar-6.svg",
  "/images/avatars/avatar-7.svg",
  "/images/avatars/avatar-8.svg",
];

// GET user profile
exports.getProfile = async (req, res) => {
  try {
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

    const user = await User.findOne({ _id: req.session.userId }).select(
      "-password",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.render("../views/pages/user/personalInformation", {
      user,
      categoriesWithSubs,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);

    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        error: "Username is required",
      });
    }

    const cleanUsername = username.trim();

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        success: false,
        error: "Username must be between 3 and 30 characters",
      });
    }

    if (!/^[a-zA-Z0-9_ ]+$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        error:
          "Username can only contain letters, numbers, spaces, and underscores",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId,
      { username: cleanUsername },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Update user avatar
exports.updateAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        error: "Avatar is required",
      });
    }

    if (!ALLOWED_AVATARS.includes(avatarUrl)) {
      return res.status(400).json({
        success: false,
        error: "Invalid avatar selected",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId,
      {
        profileImage: avatarUrl,
      },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Avatar updated successfully",
      avatarUrl,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating avatar:", error);

    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
