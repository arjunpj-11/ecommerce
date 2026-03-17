// Authentication Middleware
function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated!== true) {
        return res.redirect('/auth/login');
    }
    next();
}

module.exports = isAuthenticated;
