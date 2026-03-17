const User = require('../../models/user');
const bcrypt = require('bcryptjs');

// Render the reset password page
exports.getResetPasswordPage = (req, res, next) => {
    res.render('../views/pages/authentication/resetPassword'); // Render the reset password page
};

// Handle password reset confirmation
exports.resetPasswordConfirm = async (req, res) => {
    try {
        const newPassword = req.body.newPassword || req.body.password; // Support both field names
        console.log(newPassword);

        // Hash the password
        const salt = await bcrypt.genSalt(10); // Generate salt
        const hashedPassword = await bcrypt.hash(newPassword, salt); // Hash the new password
        console.log(req.session.value);

        // Determine query based on session value (email or phone)
        const query = isNaN(req.session.value)
            ? { email: req.session.value } // Query by email if value is not a number
            : { phone: req.session.value }; // Query by phone if value is a number
        console.log(query);

        // Update the user's password
        const result = await User.updateOne(query, { $set: { password: hashedPassword } });
        console.log(result);

        res.send("done"); // Indicate successful password reset
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).send("An error occurred while resetting the password"); // Return error message
    }
};