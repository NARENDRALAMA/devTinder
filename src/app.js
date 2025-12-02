require("dotenv").config();
const express = require("express");
const User = require("./models/user");
const connectDB = require("./config/database");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { userAuth } = require("./middlewares/auth");
const webhookRouter = require("./routes/webhook");

require("./utils/cornjob");

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://dev-tinder.org", "https://www.dev-tinder.org"]
    : [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
      ];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// IMPORTANT: Webhook route MUST come BEFORE express.json()
app.use("/webhook", express.raw({ type: "application/json" }), webhookRouter);

// Now add JSON parser for other routes
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/userRouter");
const payment = require("./routes/payment");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/api", payment);

connectDB()
  .then(() => {
    console.log("Database connection established...");
    app.listen(process.env.PORT, () => {
      console.log(
        `Server is successfully listening on port ${process.env.PORT}...`
      );
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
    console.log(err);
  });
