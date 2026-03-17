const User = require('../../models/user');

// GET home page
exports.getLoginPage = (req, res) => {
    let detail = {
        emailOrPhone: req.session.value,
    };
    let error = req.session.error || null; // Retrieve error message from session, if any
    req.session.error = null; // Clear error after use
    let emailError = req.session.emailError || null; // Retrieve email error message from session, if any
    req.session.emailError = null; // Clear error after use
    res.render('../views/pages/authentication/login', { detail, error, emailError }); // Render the login page
};

// POST login authentication
exports.loginAuth = async (req, res) => {
    req.session.value = req.body.emailOrPhone; // Store email or phone in session
    req.session.password = req.body.password; // Store password in session

    try {
        let user;
        const isBlocked = await User.findOne({ email: req.session.value, status: 'Suspended' });
        if (isBlocked) {
            req.session.isAuthenticated = false; // Set authentication status to false
            return res.redirect('/auth/blocked'); // Redirect to blocked page
        }

        // Check if the input is an email or phone number
        if (isNaN(req.session.value)) {
            user = await User.findOne({ email: req.session.value }); // Find user by email
        } else {
            user = await User.findOne({ phone: req.session.value }); // Find user by phone
        }

        if (!user) {
            console.log("User  not found");
            req.session.emailError = "User  not found"; // Set error message if user is not found
            return res.send("new"); // Indicate user not found
        }

        const isMatch = await user.comparePassword(req.session.password); // Compare password
        console.log("Password Match:", isMatch);

        console.log("Role:", user.role);

        // Check user role and authentication
        if (user.role === "Admin" && isMatch) {
            clearSession(req); // Clear session data
            req.session.isChecked = true; // Set session checked status
            return res.send("admin"); // Indicate admin login
        }

        if (isMatch) {
            console.log("Authentication Successful!");
            clearSession(req); // Clear session data
            req.session.isAuthenticated = true; // Set authentication status to true
            req.session.userId = user._id; // Store user ID in session
            return res.send("done"); // Indicate successful login
        } else {
            req.session.error = "Invalid credentials"; // Set error message for invalid credentials
            return res.send("undone"); // Indicate failed login
        }
    } catch (err) {
        console.error("Error during login:", err);
        req.session.error = err.message || "Internal Server Error"; // Set error message
        return res.status(500).send("Internal Server Error"); // Return server error
    }
};

// Helper function to clear session data
function clearSession(req) {
    delete req.session.username; // Clear username from session
    delete req.session.phone; // Clear phone from session
    delete req.session.password; // Clear password from session
    delete req.session.value; // Clear email or phone from session
}