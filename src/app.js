const express = require("express");
const User = require("./models/user");
const connectDB = require("./config/database");
const app = express();
const cors = require("cors");

const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { userAuth } = require("./middlewares/auth");

require("dotenv").config();

require("./utils/cornjob");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/userRouter");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

//Adding the user to the database

//Get user by email
app.get("/user", async (req, res) => {
  const userEmail = req.body.emailId;

  try {
    const user = await User.findOne({ emailId: userEmail });

    if (!user) {
      res.status(404).send("User not found");
    }

    res.send(user);
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});

//Feed API -GET /feed -get all the users from the database
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});

//Delete a user from the database
app.delete("/user", async (req, res) => {
  const userId = req.body.userId;

  try {
    // const user=await User.findByIdAndDelete({_id:userId});
    const user = await User.findByIdAndDelete(userId);
    res.send("User deleted sucessfully");
  } catch (err) {
    res.status(400).send("Something went wrong hahsdf ");
  }
});

//Update data of the user
app.patch("/user/:userId", async (req, res) => {
  const userId = req.params?.userId;
  const data = req.body;

  try {
    const ALLOWED_UPDATES = [
      "userId",
      "photoUrl",
      "about",
      "gender",
      "age",
      "skills",
    ];

    //  {
    //   "firstName":"Naruto",
    //   "lastName":"Uzumaki",
    //   "emailId":"Uzimake@7",
    //   "password":"I love Sakura chan",
    //   "gender":"male"
    // }

    const isUpdateAllowed = Object.keys(data).every((k) =>
      ALLOWED_UPDATES.includes(k)
    );

    if (!isUpdateAllowed) {
      throw new Error("Update not allowed");
    }

    const user = await User.findByIdAndUpdate({ _id: userId }, data, {
      returnDocument: "before",
      runValidators: true,
    });

    res.send("User updated sucessfully");
  } catch (err) {
    res.status(400).send("Update Failed " + err.message);
  }
});

connectDB()
  .then(() => {
    console.log("Database connection established...");
    app.listen(process.env.PORT, () => {
      console.log("Server is sucessfully listening on port 7777...");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
    console.log(err);
  });
