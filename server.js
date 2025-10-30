const express = require("express");
const cors = require("cors");
const path = require("path");
const { ensureDirectories } = require("./utils/ensureDirectories");
const limiter = require("./middleware/rateLimiter");
const uploadRoute = require("./routes/uploadRoute");
const adminRoute = require("./routes/adminRoute");
const checkSingleRoute = require("./routes/checkSingleRoute");

const app = express();

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.use(express.static("public"));
app.use("/results", express.static(path.join(__dirname, "results")));

ensureDirectories(["uploads", "results"]);

app.use("/upload", limiter, uploadRoute);
app.use("/check", checkSingleRoute);
app.use("/admin", adminRoute);

app.use(express.static(path.join(__dirname, "frontend/build")));
app.get(/^\/(?!api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
