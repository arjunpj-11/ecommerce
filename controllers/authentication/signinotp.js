const generateRandomOTP = require('../../utilities/generateOtp');
const emailOtp = require('../../utilities/emailOtp');
const User = require('../../models/user'); // Import the User model

// Function to generate a unique userId
async function generateUniqueUserId() {
  let uniqueId;
  let isUnique = false;

  while (!isUnique) {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit number
    uniqueId = `Arni/${randomNum}`;

    // Check if the generated userId already exists
    const existingUser  = await User.findOne({ userId: uniqueId });
    if (!existingUser ) {
      isUnique = true; // Unique ID found
    }
  }

  return uniqueId; // Return the unique userId
}

// GET users listing
exports.getSigninOtp = async (req, res) => {
  try {
    const value = req.session.value; // Get the email or phone from session
    let error = req.session.error || null; // Retrieve error message from session, if any
    req.session.error = null; // Clear error after use

    // Render the signinOtp page with value and error
    res.render('../views/pages/authentication/signinotp', { value, error });
  } catch (error) {
    console.error('Error rendering signinOtp page:', error);
    req.session.error = 'Failed to load the OTP page. Please try again.';
    res.redirect('/auth/otp'); // Redirect to OTP page on error
  }
};

// POST route for OTP verification
exports.verifyOtp = async (req, res) => {
  try {
    // Ensure the OTP and session OTP exist
    if (!req.session.otp) {
      req.session.error = 'Session expired. Please request a new OTP.';
      return res.redirect('/auth/otp'); // Redirect to OTP page if session OTP is missing
    }

    // Extract and combine entered OTP from req.body
    req.session.enteredOtp = Object.values(req.body).join("").trim();

    // Compare entered OTP with session OTP
    if (req.session.enteredOtp === req.session.otp) {
      // Clear OTP-related session data after successful verification
      delete req.session.otp;

      try {
        // Ensure all required registration data exists
        if (!req.session.username || !req.session.password) {
          throw new Error('Missing registration information');
        }

        const userId = await generateUniqueUserId(); // Generate a unique user ID
        const user = await User.create({
          userId,
          username: req.session.username,
          phone: req.session.phone,
          email: req.session.email || null, // Make email optional
          password: req.session.password
        });

        console.log('User  created:', user);
        req.session.userId = user._id; // Store user ID in session
        req.session.isAuthenticated = true; // Set authentication status

        // Clear registration data from session
        delete req.session.username;
        delete req.session.phone;
        delete req.session.email;
        delete req.session.password;
        delete req.session.value;

        return res.redirect('/'); // Redirect to home page
      } catch (err) {
        console.error('Error registering user:', err);
        req.session.error = 'Error registering user. Please try again.';
        return res.redirect('/auth/register'); // Redirect to registration page on error
      }
    } else {
      req.session.error = 'Invalid OTP. Please try again.';
      return res.redirect('/auth/otp'); // Redirect back to OTP page if OTP is invalid
    }
  } catch (error) {
    console.error('Error in OTP verification:', error);
    req.session.error = 'Something went wrong during OTP verification. Please try again.';
    return res.redirect('/auth/otp'); // Redirect back to OTP page on error
  }
};

// POST route for resending OTP
exports.resendOtp = async (req, res) => {
  try {
    req.session.otp = await generateRandomOTP(); // Generate a new OTP
    await emailOtp(req.session.otp, req.session.value); // Send OTP to email or phone number
    console.log(req.session.otp);
    console.log(req.session.value);
    
    // Clear OTP after 10 hours
    setTimeout(() => {
      delete req.session.otp; // Clear OTP from session
      delete req.session.enteredOtp; // Clear entered OTP from session
    }, 1000 * 60 * 60 * 10); // 10 hours expiration
    
    res.status(200).json({ message: 'OTP resent successfully.' }); // Return success message
  } catch (error) {
    console.error('Error resending OTP:', error);
    req.session.error = 'Failed to resend OTP. Please try again later.';
    return res.status(500).json({ message: 'Failed to resend OTP.' }); // Return error message
  }
};