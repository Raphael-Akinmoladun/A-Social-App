const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Strictly requires login
exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Token expired or invalid" });
  }
};

// Optional auth for public routes (detects if user is viewing, but doesn't block them)
exports.optionalAuth = async (req, res, next) => {
    let token = req.cookies.jwt || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (user) {
                req.user = user;
                // Make the entire user object available to EJS templates as "loggedInUser"
                res.locals.loggedInUser = user; 
            } else {
                req.user = null;
                res.locals.loggedInUser = null;
            }
        } catch (err) { 
            req.user = null; 
            res.locals.loggedInUser = null;
        }
    } else {
        req.user = null;
        res.locals.loggedInUser = null;
    }
    next();
};
