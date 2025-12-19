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
const { chatRouter } = require("./routes/chat");
const initializeSocket = require("./utils/socket");
const http = require("http");

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

app.use("/webhook", express.raw({ type: "application/json" }), webhookRouter);

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
app.use("/", chatRouter);
app.use("/api", payment);

const server = http.createServer(app);
initializeSocket(server);

connectDB()
  .then(() => {
    console.log(" Database connected");
    server.listen(process.env.PORT, () => {
      console.log(` Server running on port ${process.env.PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
    });
  })
  .catch((err) => {
    console.error(" Database connection failed:", err.message);
    process.exit(1);
  });
