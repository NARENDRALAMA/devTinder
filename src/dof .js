const express = require("express");
const app = express();

// Middleware to parse incoming JSON data
app.use(express.json());

// Define a simple route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Define an API route
app.get("/user", (req, res) => {
  res.json({ name: "Narendra", age: 23 });
});

// Handling POST requests
app.post("/user", (req, res) => {
  const userData = req.body;
  res.send(`User ${userData.name} has been added!`);
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000...");
});
