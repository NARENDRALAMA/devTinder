const express = require("express");

const app = express();

app.use(
  "/user",
  (req, res, next) => {
    // res.send("Route Handler 1");
    console.log("Hello this is first route handler");
    next();
    res.send("This is the first response");
  },
  (req, res) => {
    console.log("This is the second route handler");
    res.send("This is the second response");
  }
);

app.listen(7777, () => {
  console.log("Server is sucessfully listening on port 7777...");
});
