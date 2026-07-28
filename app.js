var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const helmet = require("helmet");
const compression = require("compression");
const { rateLimit } = require("express-rate-limit");
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

const isProduction = process.env.NODE_ENV === "production";
const mongoURI = process.env.MONGO_URI || process.env.MongoDB_url;
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !sessionSecret) {
  throw new Error("SESSION_SECRET must be configured in production.");
}

if (mongoURI) {
  mongoose
    .connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error.message);
    });
} else {
  console.warn("MongoDB is not configured. Database features are unavailable.");
}

app.disable("x-powered-by");
if (isProduction) {
  app.set("trust proxy", 1);
}

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
          "https://checkout.razorpay.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
        ],
        fontSrc: [
          "'self'",
          "data:",
          "https://cdnjs.cloudflare.com",
          "https://fonts.gstatic.com",
        ],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https://api.razorpay.com"],
        frameSrc: ["'self'", "https://api.razorpay.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.get(/^\/images\/avatars\/avatar-([1-8])\.png$/, (req, res) => {
  res.redirect(301, req.path.replace(/\.png$/, ".svg"));
});
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "images", "common", "logo.png"));
});

const sessionOptions = {
  name: "arni.sid",
  secret: sessionSecret || "development-only-session-secret",
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 15,
  },
};

if (mongoURI) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: mongoURI,
    collectionName: "sessions",
    ttl: 15 * 60,
    autoRemove: "native",
  });
}

app.locals.sessionStore = sessionOptions.store;
app.use(session(sessionOptions));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

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

const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "Too many attempts. Please wait a few minutes and try again.",
});

// Route handlers
app.use("/", indexRouter);
app.use("/users", userRouter);
app.use("/admin", adminRouter);
app.use("/auth", authenticationLimiter, authenticationRouter);
app.use("/api", authenticationLimiter, apiRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

// Error handling middleware (placed after routes)
app.use(errorHandler);

module.exports = app;
