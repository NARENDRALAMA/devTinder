const express = require("express");

const authRouter = express.Router();

const { userAuth } = require("../middlewares/auth");

const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");

authRouter.post("/signup", async (req, res) => {
  try {
    //Validation of data
    validateSignUpData(req);

    const { firstName, lastName, emailId, password } = req.body;

    //Encrypt the password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(passwordHash);

    // Creating a new instance of the User model

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    await user.save();
    res.send("User Added sucessfully!");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });

    if (!user) {
      throw new Error("EmailId id not present in DB");
    }

    // const isPasswordValid = await bcrypt.compare(password, user.password);

    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      //Create a JWT Token

      const token = await user.getJWT();

      //Add the token to cookie and send the response back to the user
      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 3600000), // cookie will be removed after 8 hours
      });
      res.send("Login Sucessful!!!");
    } else {
      throw new Error("Password is not correct");
    }
  } catch (err) {
    res.status(400).send("ERROR Fuck this shit: " + err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send();
});

module.exports = authRouter;
