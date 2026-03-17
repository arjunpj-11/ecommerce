const Wallet = require('../../models/wallet');
const MainCategory = require('../../models/mainCategory');
const SubCategory = require('../../models/subCategory');

const walletController = {
    // GET wallet page with transactions
    getWallet: async (req, res) => {
        try {
            // Find or create a wallet for the user
            let wallet = await Wallet.findOne({ user: req.session.userId });
            if (!wallet) {
                wallet = await Wallet.create({
                    user: req.session.userId,
                    balance: 0,
                    transactions: []
                });
            }

            // Get all active categories with their subcategories for the hover menu
            const categoriesWithSubs = await MainCategory.aggregate([
                {
                    $match: { status: 'active' }
                },
                {
                    $lookup: {
                        from: 'subcategories',
                        localField: '_id',
                        foreignField: 'mainCategory',
                        pipeline: [{ $match: { status: 'active' } }],
                        as: 'subcategories'
                    }
                }
            ]);

            // Only keep the last 10 transactions
            wallet.transactions = wallet.transactions.slice(-10);

            // Render the wallet page with wallet information and categories
            res.render('../views/pages/user/wallet', { wallet, categoriesWithSubs });
        } catch (error) {
            console.error('Error fetching wallet:', error);
            res.status(500).json({ message: 'Internal server error' }); // Handle server error
        }
    },
    
    // GET wallet balance
    getBalance: async (req, res) => {
        try {
            const wallet = await Wallet.findOne({ user: req.session.userId });
            if (!wallet) {
                return res.status(404).json({ message: 'Wallet not found' }); // Handle not found error
            }

            res.json({ balance: wallet.balance }); // Return wallet balance
        } catch (error) {
            console.error('Error fetching balance:', error);
            res.status(500).json({ message: 'Internal server error' }); // Handle server error
        }
    }
};

module.exports = walletController;