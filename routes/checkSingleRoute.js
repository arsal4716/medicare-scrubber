const express = require("express");
const router = express.Router();
const { getDatabaseNumbers } = require("../googleSheets");

router.post("/", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    let cleaned = phone.replace(/\D/g, "");

    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      cleaned = cleaned.slice(1);
    }    if (cleaned.length !== 10) {
      return res.status(400).json({
        error:
          "Invalid phone number format. Must be 10 digits or 11 digits starting with 1.",
      });
    }
    const dbMap = await getDatabaseNumbers();
    const isDuplicate = dbMap.has(cleaned);

    return res.json({
      original: phone,
      normalized: cleaned,
      duplicate: isDuplicate,
      status: isDuplicate ? "Duplicate (Database)" : "Not Duplicate",
    });
  } catch (error) {
    console.error("Error checking phone:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

module.exports = router;
