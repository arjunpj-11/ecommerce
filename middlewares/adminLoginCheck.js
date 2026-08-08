// Middleware to check session
const authMiddleware = (req, res, next) => {
  if (req.session && req.session.isChecked) {
    next(); // Allow access
  } else {
    const expectsJson =
      req.xhr ||
      req.is("application/json") ||
      req.headers.accept?.includes("application/json");
    if (expectsJson) {
      return res.status(401).json({
        success: false,
        code: "ADMIN_AUTHENTICATION_REQUIRED",
        message: "Your admin session has expired. Please sign in again.",
      });
    }
    res.redirect("/auth/login"); // Redirect to login page if not authenticated
  }
};

module.exports = authMiddleware;
