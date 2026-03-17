const express = require('express');
const passport = require('passport');
const User = require('../../models/user');
const Cart = require('../../models/cart');


const router = express.Router();


// Function to generate a unique userId
async function generateUniqueUserId() {
    let uniqueId;
    let isUnique = false;
  
    while (!isUnique) {
      const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit number
      uniqueId = `Arni/${randomNum}`;
  
      // Check if the generated userId already exists
      const existingUser = await User.findOne({ userId: uniqueId });
      if (!existingUser) {
        isUnique = true;
      }
    }
  
    return uniqueId;
  }

// Google Authentication Route
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Authentication Callback
router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/signin' }), 
    async (req, res) => {
        console.log("letssssss")
        try {
            if (!req.user) {
                req.session.error = 'Authentication failed. Please try again.';
                return res.redirect('/signin');
            }

            req.session.username = req.user.displayName;
            req.session.email = req.user.emails?.[0]?.value;

            if (!req.session.email) {
                req.session.error = 'No email found from Google authentication.';
                return res.redirect('/signin');
            }

            const user = await User.findOne({ email: req.session.email });

            if (user) {
                const isBlocked = await User.findOne({ email: req.session.email, status: 'Suspended' });

                if (isBlocked) {
                    req.session.isAuthenticated = false;
                    return res.redirect('/auth/blocked');
                }

                req.session.userId = user._id;

                req.session.isAuthenticated = true;
                delete req.session.username;
                delete req.session.phone;
                return res.redirect('/');
            }

            const userId = await generateUniqueUserId();

            // Register new user
            const newUser = await User.create({
                userId,
                username: req.session.username,
                phone: req.session.phone || '', // Ensure phone doesn't remain undefined
                email: req.session.email
            });

            req.session.userId = newUser._id;

            delete req.session.username;
            req.session.isAuthenticated = true;
            return res.redirect('/');

        } catch (err) {
            console.error('Error in Google authentication:', err);
            req.session.error = 'An unexpected error occurred. Please try again.';
            return res.redirect('/error'); // Redirect to an error page
        }
    }
);

module.exports = router;
