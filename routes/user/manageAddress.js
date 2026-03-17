const express = require('express');
const router = express.Router();
const addressController = require('../../controllers/user/manageAddress');
const isAuthenticated = require('../../middlewares/userLoginCheck');

// Get all addresses for a user
router.get('/', isAuthenticated, addressController.getAllAddresses);

// Create Address
router.post('/addresses', isAuthenticated, addressController.createAddress);

// Update Address
router.put('/addresses/:id', isAuthenticated, addressController.updateAddress);

// Delete Address
router.delete('/addresses/:id', isAuthenticated, addressController.deleteAddress);

// Set Primary Address
router.patch('/addresses/:id/primary', isAuthenticated, addressController.setPrimaryAddress);

module.exports = router;
