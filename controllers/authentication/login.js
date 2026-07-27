const User = require("../../models/user");

// GET home page
exports.getLoginPage = (req, res) => {
  let detail = {
    emailOrPhone: req.session.value,
  };
  let error = req.session.error || null; // Retrieve error message from session, if any
  req.session.error = null; // Clear error after use
  let emailError = req.session.emailError || null; // Retrieve email error message from session, if any
  req.session.emailError = null; // Clear error after use
  res.render("../views/pages/authentication/login", {
    detail,
    error,
    emailError,
  }); // Render the login page
};

// POST login authentication
exports.loginAuth = async (req, res) => {
  const inputVal = req.body.emailOrPhone;
  const plainPassword = req.body.password;
  req.session.value = inputVal;

  try {
    if (!inputVal || !plainPassword) {
      req.session.error = "Email/Phone and Password are required";
      return res.send("undone");
    }

    let user;
    const isBlocked = await User.findOne({
      $or: [{ email: inputVal }, { phone: inputVal }],
      status: "Suspended",
    });

    if (isBlocked) {
      req.session.isAuthenticated = false;
      return res.send("blocked");
    }

    if (isNaN(inputVal)) {
      user = await User.findOne({ email: inputVal });
    } else {
      user = await User.findOne({ phone: inputVal });
    }

    if (!user) {
      console.log("User not found");
      req.session.emailError = "User not found";
      return res.send("new");
    }

    const isMatch = await user.comparePassword(plainPassword);

    if (user.role === "Admin" && isMatch) {
      clearSession(req);
      req.session.isChecked = true;
      return res.send("admin");
    }

    if (isMatch) {
      console.log("Authentication Successful!");
      clearSession(req);
      req.session.isAuthenticated = true;
      req.session.userId = user._id;
      return res.send("done");
    } else {
      req.session.error = "Invalid credentials";
      return res.send("undone");
    }
  } catch (err) {
    console.error("Error during login:", err);
    req.session.error = err.message || "Internal Server Error";
    return res.status(500).send("Internal Server Error");
  }
};

// Helper function to clear session data
function clearSession(req) {
  delete req.session.username; // Clear username from session
  delete req.session.phone; // Clear phone from session
  delete req.session.password; // Clear password from session
  delete req.session.value; // Clear email or phone from session
}
