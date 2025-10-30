const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
router.get("/files/:type", (req, res) => {
  const { type } = req.params;
  const dirPath = path.join(
    __dirname,
    "..",
    type === "uploads" ? "uploads" : "results"
  );

  fs.readdir(dirPath, (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to read directory" });
    res.json({ files });
  });
});

router.get("/download/:type/:filename", (req, res) => {
  const { type, filename } = req.params;
  const filePath = path.join(
    __dirname,
    "..",
    type === "uploads" ? "uploads" : "results",
    filename
  );

  res.download(filePath, filename, (err) => {
    if (err) return res.status(404).json({ error: "File not found" });
  });
});

router.delete("/delete/:type/:filename", (req, res) => {
  const { type, filename } = req.params;
  const filePath = path.join(
    __dirname,
    "..",
    type === "uploads" ? "uploads" : "results",
    filename
  );

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: "Failed to delete file" });
    res.json({ message: "File deleted successfully" });
  });
});

module.exports = router;
