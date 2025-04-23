const adminAuth = (req, res, next) => {
  console.log("Admin auth is getting checked");
  const token = "xyz";
  const isAdminAuthorized = token === "xyzsdf";
  if (isAdminAuthorized) {
    res.send(401).send("Unauthorized request");
  } else {
    next();
  }
};

const userAuth = (req, res, next) => {
  console.log("Admin auth is getting checked");
  const token = "xyz";
  const isAdminAuthorized = token === "xyzsdf";
  if (isAdminAuthorized) {
    res.send(401).send("Unauthorized request");
  } else {
    next();
  }
};

module.exports = {
  adminAuth,
  userAuth,
};

const URL =
  "mongodb+srv://narendralamatech:Qt7dS0cWxKuL7gBi@cluster0.ppfx2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
