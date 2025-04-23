const express = require("express");
const User = require("./models/user");
connectDB = require("./config/database");
const app = express();

app.post("/signup", async (req, res) => {
  //Creating a new instance of the User model

  const user = new User({
    firstName: "Tanjiro",
    lastName: "Lama",
    emailId: "Tanjiro@lama.com",
    password: "Tanjiro@123",
  });

  try {
    await user.save();
    res.send("User Added sucessfully!");
  } catch (err) {
    res.status(400).send("Error saving the user:" + err.message);
  }
});

connectDB()
  .then(() => {
    console.log("Database connection established...");
    app.listen(7777, () => {
      console.log("Server is sucessfully listening on port 7777...");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
  });
