const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/user/personalInformation');
const isAuthenticated = require('../../middlewares/userLoginCheck');

// Get profile page
router.get('/', isAuthenticated, profileController.getProfile);

// Update profile
router.post('/update', isAuthenticated, profileController.updateProfile);

// Uncomment and implement the upload photo route if needed
// router.post('/upload-photo', isAuthenticated, profileController.uploadProfilePhoto);

module.exports = router;
