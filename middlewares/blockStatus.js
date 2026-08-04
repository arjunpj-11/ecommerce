const User = require("../models/user");

const checkAuthenticationAndBlockStatus = async (req, res, next) => {
  const protectedPaths = ["/", "/users"];

  const shouldCheck = protectedPaths.some(
    (path) => req.path === path || req.path.startsWith(`${path}/`),
  );

  if (shouldCheck) {
    if (req.session.isAuthenticated && req.session.userId) {
      try {
        const user = await User.findOne({ _id: req.session.userId });

        if (user && user.status === "Suspended") {
          return res.redirect("/auth/blocked");
        }
      } catch (error) {
        return next(error);
      }
    }
  }

  next();
};

module.exports = checkAuthenticationAndBlockStatus;
