var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
require("dotenv").config();
var mongoose = require("mongoose");
var User = require("./models/user");
const errorHandler = require("./middlewares/errorHandling");
const checkAuthenticationAndBlockStatus = require("./middlewares/blockStatus");

var indexRouter = require("./routes/index");
var userRouter = require("./routes/user");
var adminRouter = require("./routes/admin");
var authenticationRouter = require("./routes/auth");
var apiRouter = require("./routes/api");

var app = express();

const mongoURI = process.env.MongoDB_url;

mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 15,
    },
  }),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

const isProduction = process.env.NODE_ENV === "production";
const googleCallback = isProduction
  ? process.env.GOOGLE_CALLBACK_URL ||
    "https://arni-w5qe.onrender.com/api/google/auth/google/callback"
  : "/api/google/auth/google/callback";

const facebookCallback = isProduction
  ? process.env.FACEBOOK_CALLBACK_URL ||
    "https://arni-w5qe.onrender.com/api/facebook/auth/facebook/callback"
  : "/api/facebook/auth/facebook/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
      callbackURL: googleCallback,
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    },
  ),
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || "dummy",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "dummy",
      callbackURL: facebookCallback,
      profileFields: ["id", "displayName", "email", "picture.type(large)"],
      scope: ["email"],
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    },
  ),
);

app.use(passport.initialize());
app.use(passport.session());

// Apply middleware globally but it will only check specific routes
app.use(checkAuthenticationAndBlockStatus);

// Route handlers
app.use("/", indexRouter);
app.use("/users", userRouter);
app.use("/admin", adminRouter);
app.use("/auth", authenticationRouter);
app.use("/api", apiRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

// Error handling middleware (placed after routes)
app.use(errorHandler);

module.exports = app;
