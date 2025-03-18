const express = require("express");

const app = express();

//This will only handle GET call to /user
app.get("/user", (req, res) => {
  res.send({ firstName: "Narendra", LastName: "Lama" });
});

app.post("/user", (req, res) => {
  //saving data to DB
  res.send("Data sucessfully saved to the database!");
});

app.delete("/user", (req, res) => {
  //saving data to DB
  res.send("Data is Deleted!");
});

//this will match all the HTTP method API calls to/test
app.use("/test", (req, res) => {
  res.send("Hello from the server!");
});

app.listen(7777, () => {
  console.log("Server is sucessfully listening on port 7777...");
});
