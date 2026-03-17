// Middleware to check session
const authMiddleware = (req, res, next) => {
    if (req.session && req.session.isChecked) {
        next(); // Allow access
    } else {
        res.redirect('/auth/login'); // Redirect to login page if not authenticated
    }
};

module.exports = authMiddleware;