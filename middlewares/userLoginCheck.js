// Authentication Middleware
function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated !== true) {
    const expectsJson =
      req.xhr ||
      req.is("application/json") ||
      req.headers.accept?.includes("application/json");
    if (expectsJson) {
      return res.status(401).json({
        success: false,
        code: "AUTHENTICATION_REQUIRED",
        message: "Please sign in to continue.",
      });
    }
    return res.redirect("/auth/login");
  }
  next();
}

module.exports = isAuthenticated;
