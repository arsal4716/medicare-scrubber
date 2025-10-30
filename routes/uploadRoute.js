const express = require("express");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const upload = require("../middleware/uploadMiddleware");
const { getDatabaseNumbers } = require("../googleSheets");
const {
  getPhoneNumberFromRow,
  processPhoneNumbersInChunks,
} = require("../services/fileProcessor");
const { generateUniqueFileName } = require("../services/helpers");

const router = express.Router();

router.post("/", upload.single("file"), async (req, res) => {
  console.time("Total processing time");
  const processingStart = Date.now();
  
  try {    
    const [fileProcessingStart, dbFetchStart] = [Date.now(), Date.now()];
    const [workbook, dbMap] = await Promise.all([
      (async () => {
        console.log("Reading uploaded file...");
        const wb = XLSX.readFile(req.file.path);
        console.log(`File read in ${Date.now() - fileProcessingStart}ms`);
        return wb;
      })(),
      getDatabaseNumbers()
    ]);
    
    console.log(`Database loaded with ${dbMap.size} numbers in ${Date.now() - dbFetchStart}ms`);

    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      raw: false,
      defval: ""
    });

    console.log(`Processing ${sheet.length} rows from uploaded file...`);
    const processingStart = Date.now();
    
    const formattedSheet = sheet
      .map((row) => {
        const phoneNumber = getPhoneNumberFromRow(row);
        if (!phoneNumber) return null;
        
        const cleaned = phoneNumber.replace(/\D/g, "").slice(-10);
        return cleaned ? { original: phoneNumber, cleaned } : null;
      })
      .filter(Boolean);

    console.log(`Found ${formattedSheet.length} valid phone numbers (processed in ${Date.now() - processingStart}ms)`);

    const duplicateCheckStart = Date.now();
    const alreadyDuplicate = [];
    const toCheckViaApi = [];
    
    formattedSheet.forEach((item) => {
      if (dbMap.has(item.cleaned)) {
        alreadyDuplicate.push({
          phoneNumber: item.original,
          ready: 0,
          status: "Duplicate (Database)",
        });
      } else {
        toCheckViaApi.push(item);
      }
    });

    console.log(`Found ${alreadyDuplicate.length} duplicates in database (check took ${Date.now() - duplicateCheckStart}ms)`);
    console.log(`${toCheckViaApi.length} numbers to check via API`);
    const apiProcessingStart = Date.now();
    const apiInput = toCheckViaApi.map((item) => ({
      phoneNumber: item.original,
      cleaned: item.cleaned
    }));

    const apiResults = await processPhoneNumbersInChunks(apiInput, 100, dbMap);
    console.log(`API processing completed in ${Date.now() - apiProcessingStart}ms`);

    const mergedResults = [
      ...alreadyDuplicate,
      ...apiResults.map((result) => ({
        phoneNumber: result.phoneNumber,
        ready: result.ready,
        status: result.status || (
          result.ready === 0 ? "Duplicate (API)" :
          result.ready === 1 ? "Not Duplicate" :
          "API Error or Unknown"
        ),
      })),
    ];

    const outputStart = Date.now();
    const rowsToSave = mergedResults.map(({ phoneNumber, ready, status }) => [
      phoneNumber,
      ready,
      status,
      new Date().toLocaleString(),
    ]);

    const { publisher, campaignDate } = req.body;
    const cleanPublisher = publisher.replace(/[^a-zA-Z0-9-_]/g, "_");
    const dateStr = new Date(campaignDate).toISOString().split("T")[0];

    const estTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      hour12: false,
    });
    const [, estTimeStr] = estTime.split(", ");
    const cleanTime = estTimeStr.replace(/:/g, "-");

    const resultFileName = `${cleanPublisher}_${dateStr}_${cleanTime}.xlsx`;
    let resultFilePath = path.join(__dirname, "../results", resultFileName);
    resultFilePath = generateUniqueFileName(resultFilePath);

    const resultWorkbook = XLSX.utils.book_new();
    const resultSheet = XLSX.utils.aoa_to_sheet([
      ["Phone Number", "Ready", "Status", "Checked At"],
      ...rowsToSave,
    ]);
    XLSX.utils.book_append_sheet(resultWorkbook, resultSheet, "Results");
    XLSX.writeFile(resultWorkbook, resultFilePath);

    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting uploaded file:", err);
    });

    const stats = {
      total: mergedResults.length,
      databaseDuplicates: mergedResults.filter((r) => r.status.includes("Database")).length,
      apiDuplicates: mergedResults.filter((r) => r.status.includes("API)")).length,
      nonDuplicates: mergedResults.filter((r) => r.status === "Not Duplicate").length,
      errors: mergedResults.filter((r) => r.status.includes("Error")).length,
      duplicates: 0 
    };
    stats.duplicates = stats.databaseDuplicates + stats.apiDuplicates;
    console.log(`Processing complete. Results:`);
    console.log(`- Total numbers processed: ${stats.total}`);
    console.log(`- Database duplicates found: ${stats.databaseDuplicates}`);
    console.log(`- API duplicates found: ${stats.apiDuplicates}`);
    console.log(`- Valid numbers: ${stats.nonDuplicates}`);
    console.log(`- Errors: ${stats.errors}`);
    console.timeEnd("Total processing time");

    res.json({
      success: true,
      downloadUrl: `/results/${path.basename(resultFilePath)}`,
      stats,
    });
  } catch (error) {
    console.error("[ERROR] Processing failed:", error);
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ 
      error: "Failed to process file.",
      details: error.message 
    });
  }
});

module.exports = router;