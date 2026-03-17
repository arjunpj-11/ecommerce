const User = require('../../models/user');
const MainCategory = require('../../models/mainCategory');
const SubCategory = require('../../models/subCategory');

// GET user profile
exports.getProfile = async (req, res) => {
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

        // Fetch user details excluding the password
        const user = await User.findOne({ _id: req.session.userId }).select('-password');
        console.log(user);
        console.log("User  ID:", req.session.userId);

        // Render the profile page with user information and categories
        res.render('../views/pages/user/personalInformation', { 
            user,
            categoriesWithSubs
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Server error' }); // Handle server error
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { username } = req.body; // Get username from request body
        const updatedUser  = await User.updateOne({ _id: req.session.userId }, { username: username });

        // Return success response with updated user information
        res.json({ success: true, user: updatedUser  });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(400).json({ error: error.message }); // Handle validation error
    }
};