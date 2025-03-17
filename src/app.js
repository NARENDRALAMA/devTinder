const express = require("express");

const app = express();

app.use("/", (req, res) => {
  res.send("Hello Bitch!");
});

app.use("/test", (req, res) => {
  res.send("Hello from the server!");
});

app.listen(7777, () => {
  console.log("Server is sucessfully listening on port 7777...");
});
