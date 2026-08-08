// errorHandler.js
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message =
    status >= 500
      ? "Something went wrong on our side. Please try again shortly."
      : err.message || "We could not complete that request.";

  if (status >= 500) {
    console.error("Unhandled Error:", err);
  }

  // Check if request expects JSON or is an AJAX/API request
  const isJson =
    req.xhr ||
    req.headers.accept?.includes("application/json") ||
    req.originalUrl.startsWith("/api") ||
    req.originalUrl.includes("/update-") ||
    req.originalUrl.includes("/remove-") ||
    req.originalUrl.includes("/apply-");

  if (isJson) {
    return res.status(status).json({
      success: false,
      message: message,
      error:
        process.env.NODE_ENV === "development" && status < 500
          ? err.stack
          : undefined,
    });
  }

  // Render HTML error page
  res.status(status).render("error", {
    message: message,
    error: {
      status: status,
      stack: process.env.NODE_ENV === "development" ? err.stack : "",
    },
  });
};

module.exports = errorHandler;
