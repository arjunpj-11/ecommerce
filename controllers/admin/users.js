const User = require('../../models/user');
const BlockUser  = require('../../models/blockUser');

exports.getUsersPage = (req, res) => {
    req.session.condition = req.query.condition || "All"; // Set the condition for user status
    res.render('../views/pages/admin/users'); // Render the users page
};

exports.getUsersTable = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get the current page number
        const limit = 10; // Set the number of users per page
        const skip = (page - 1) * limit; // Calculate the number of users to skip
        const searchQuery = req.query.search || ''; // Get the search query

        // Build the query to fetch users
        let query = { role: "User" };
        
        // Add status condition if not "All"
        if (req.session.condition !== "All") {
            query.status = req.session.condition;
        }

        // Add search conditions if search term exists
        if (searchQuery) {
            query.$or = [
                { email: { $regex: searchQuery, $options: 'i' } },
                { userId: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        // Execute queries in parallel
        const [users, total] = await Promise.all([
            User.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            User.countDocuments(query)
        ]);

        res.json({
            users,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit) // Calculate total pages
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.blockUser  = async (req, res) => {
    try {
        const { id, blockReason } = req.body; // Get user ID and block reason
        
        await Promise.all([
            BlockUser .create({ user: id, blockReason }), // Create a block entry
            User.findByIdAndUpdate(id, { status: "Suspended" }) // Update user status to Suspended
        ]);

        res.json({ success: true, message: 'User  blocked successfully' });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.unblockUser  = async (req, res) => {
    try {
        const { id } = req.body; // Get user ID
        
        await Promise.all([
            BlockUser .deleteOne({ user: id }), // Remove block entry
            User.findByIdAndUpdate(id, { status: "Inactive" }) // Update user status to Inactive
        ]);

        res.json({ success: true, message: 'User  unblocked successfully' });
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};