const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

exports.signup = async (req, res) => {
  try {
    const user = await User.create(req.body);
    const token = generateToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: 3600000 }); // 1 hour cookie
    res.status(201).json({ success: true, token, user });
  } catch (err) {
        if (err.code === 11000) {
            const duplicateField = Object.keys(err.keyValue)[0];
            return res.status(400).json({ 
                success: false, 
                message: `That ${duplicateField} is already taken. Please try another one!` 
            });
        }
        
        // For all other random errors
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (
      !user ||
      !(await require("bcryptjs").compare(password, user.password))
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: 3600000 });
    res.status(200).json({ success: true, token });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
