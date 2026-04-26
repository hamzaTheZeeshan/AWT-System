// Admin middleware - checks if user has admin role
export const admin = (req, res, next) => {
  // req.user comes from the protect middleware (authMiddleware)
  if (req.user && req.user.role === "admin") {
    next(); // User is admin, proceed to the next function
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
};
