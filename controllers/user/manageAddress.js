const Address = require('../../models/address');
const MainCategory = require('../../models/mainCategory');
const SubCategory = require('../../models/subCategory');

// GET all addresses for the user
exports.getAllAddresses = async (req, res) => {
    try {
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

        // Fetch addresses for the logged-in user
        const addresses = await Address.find({ userId: req.session.userId });
        res.render('../views/pages/user/manageAddress', { addresses, categoriesWithSubs });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).send('Server error'); // Handle server error
    }
};

// Create a new address
exports.createAddress = async (req, res) => {
    try {
        const address = new Address({ ...req.body, userId: req.session.userId });
        await address.save(); // Save the new address
        res.status(201).json({ success: true, address }); // Return success response
    } catch (error) {
        console.error('Error creating address:', error);
        res.status(400).json({ success: false, error: error.message }); // Handle validation error
    }
};

// Update an existing address
exports.updateAddress = async (req, res) => {
    try {
        const address = await Address.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!address) {
            return res.status(404).json({ success: false, error: 'Address not found' }); // Handle not found error
        }
        res.status(200).json({ success: true, address }); // Return updated address
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(400).json({ success: false, error: error.message }); // Handle validation error
    }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findByIdAndDelete(req.params.id);
        if (!address) {
            return res.status(404).json({ success: false, error: 'Address not found' }); // Handle not found error
        }
        res.status(200).json({ success: true }); // Return success response
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(400).json({ success: false, error: error.message }); // Handle validation error
    }
};

// Set an address as primary
exports.setPrimaryAddress = async (req, res) => {
    try {
        // Remove primary status from all addresses
        await Address.updateMany({ userId: req.session.userId }, { isPrimary: false });
        
        // Set the specified address as primary
        const address = await Address.findByIdAndUpdate(req.params.id, { isPrimary: true }, { new: true });
        if (!address) {
            return res.status(404).json({ success: false, error: 'Address not found' }); // Handle not found error
        }
        res.status(200).json({ success: true, address }); // Return updated address
    } catch (error) {
        console.error('Error setting primary address:', error);
        res.status(400).json({ success: false, error: error.message }); // Handle validation error
    }
};