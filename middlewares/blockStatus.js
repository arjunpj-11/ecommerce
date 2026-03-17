const User = require('../models/user');

const checkAuthenticationAndBlockStatus = async (req, res, next) => {
  // Define protected routes that should be checked
  const protectedPaths = ['/', '/users'];
  
  // Check if the current path starts with any of the protected paths
  const shouldCheck = protectedPaths.some(path => 
    req.path === path || req.path.startsWith(`${path}/`)
  );

  if (shouldCheck) {
    console.log('Checking authentication for path:', req.path);
    
    if (req.session.isAuthenticated && req.session.userId) {
      try {
        const user = await User.findOne({ _id: req.session.userId });
        console.log('User status:', user?.status);
        
        if (user && user.status === 'Suspended') {
          return res.redirect('/auth/blocked');
        }
      } catch (error) {
        return next(error);
      }
    }
  }
  
  next();
};

module.exports = checkAuthenticationAndBlockStatus;