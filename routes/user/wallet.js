const express = require('express');
const router = express.Router();
const walletController = require('../../controllers/user/wallet');
const isAuthenticated = require('../../middlewares/userLoginCheck');

// Wallet routes
router.get('/', isAuthenticated, walletController.getWallet);
router.get('/balance', isAuthenticated, walletController.getBalance);

module.exports = router;
