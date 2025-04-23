const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://narendralamatech:Qt7dS0cWxKuL7gBi@cluster0.ppfx2.mongodb.net/devTinder?retryWrites=true&w=majority&appName=Cluster0"
  );
};

module.exports = connectDB;
