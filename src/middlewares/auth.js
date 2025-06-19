const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  //Read the cookie from the req.cookies
  try {
    const { token } = req.cookies;

    if (!token) {
      throw new Error("Token is not Valid");
    }

    const decodedObj = await jwt.verify(token, "DEV@Tinder$790");
    const { _id } = decodedObj;

    const user = await User.findById(_id);

    if (!user) {
      throw new Error("User not found");
    }

    next();
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
};

module.exports = {
  adminAuth,
  userAuth,
};

const URL =
  "mongodb+srv://narendralamatech:Qt7dS0cWxKuL7gBi@cluster0.ppfx2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
