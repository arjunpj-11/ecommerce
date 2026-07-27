const express = require("express");
const router = express.Router();

const profileController = require("../../controllers/user/personalInformation");
const isAuthenticated = require("../../middlewares/userLoginCheck");

// Get profile page
router.get("/", isAuthenticated, profileController.getProfile);

// Update profile
router.post("/update", isAuthenticated, profileController.updateProfile);

// Update profile avatar
router.post("/update-avatar", isAuthenticated, profileController.updateAvatar);

module.exports = router;
