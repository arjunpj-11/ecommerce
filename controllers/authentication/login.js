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
  const rawInput = String(req.body.emailOrPhone || "").trim();
  const inputVal = rawInput.includes("@") ? rawInput.toLowerCase() : rawInput;
  const plainPassword = String(req.body.password || "");
  req.session.value = inputVal;

  try {
    if (!inputVal || !plainPassword) {
      req.session.error = "Email or phone number and password are required.";
      return res.send("undone");
    }

    const user = await User.findOne(
      inputVal.includes("@") ? { email: inputVal } : { phone: inputVal },
    );

    if (!user) {
      req.session.emailError = "No account matches those details.";
      return res.send("new");
    }

    if (user.status === "Suspended") {
      req.session.isAuthenticated = false;
      return res.send("blocked");
    }

    if (!user.password) {
      req.session.error =
        "This account uses social login. Continue with Google or Facebook.";
      return res.send("undone");
    }

    const isMatch = await user.comparePassword(plainPassword);

    if (user.role === "Admin" && isMatch) {
      await establishSession(req, {
        isChecked: true,
      });
      return res.send("admin");
    }

    if (isMatch) {
      await establishSession(req, {
        isAuthenticated: true,
        userId: user._id,
      });
      return res.send("done");
    } else {
      req.session.error = "The password you entered is incorrect.";
      return res.send("undone");
    }
  } catch (err) {
    console.error("Error during login:", err);
    req.session.error = "We could not log you in. Please try again.";
    return res.status(500).send("error");
  }
};

function establishSession(req, values) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      Object.assign(req.session, values);
      req.session.save((saveError) =>
        saveError ? reject(saveError) : resolve(),
      );
    });
  });
}
