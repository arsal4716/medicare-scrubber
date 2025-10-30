const XLSX = require("xlsx");
const { withTimeout } = require("./helpers");

const PHONE_KEYS = ["phonenumber", "phone number", "phone", "number", "callerid", "callerID"];
const getPhoneNumberFromRow = (row) => {
  const key = Object.keys(row).find((k) =>
    PHONE_KEYS.includes(k.toLowerCase().replace(/[^a-z]/gi, ""))
  );
  const rawNumber = row[key]?.toString().replace(/\D/g, "") || "";
  return rawNumber.slice(-10);
};
const processSingleNumber = async ({ phoneNumber, cleaned }, dbMap) => {
  if (!cleaned || !/^\d{10,15}$/.test(cleaned)) {
    return { phoneNumber, ready: "-", status: "Invalid Number" };
  }  if (dbMap.has(cleaned)) {
    return {
      phoneNumber,
      ready: 0,
      status: "Duplicate (Database)",
    };
  }

  return {
    phoneNumber,
    ready: 1,
    status: "Not Duplicate",
  };
};

const processPhoneNumbersInChunks = async (phoneNumbers, maxConcurrency = 100, dbMap = new Map()) => {

  const results = [];
  const chunkSize = Math.ceil(phoneNumbers.length / Math.ceil(phoneNumbers.length / 100));

  for (let i = 0; i < phoneNumbers.length; i += chunkSize) {
    const chunk = phoneNumbers.slice(i, i + chunkSize);
    console.log(`Processing chunk ${i / chunkSize + 1} of ${Math.ceil(phoneNumbers.length / chunkSize)} (${chunk.length} numbers)...`);

    const chunkResults = await Promise.all(
      chunk.map(item => processSingleNumber(item, dbMap))
    );

    results.push(...chunkResults);

    const processed = Math.min(i + chunkSize, phoneNumbers.length);
    console.log(`Progress: ${processed}/${phoneNumbers.length} (${Math.round(processed / phoneNumbers.length * 100)}%)`);
  }

  return results;
};

module.exports = {
  getPhoneNumberFromRow,
  processPhoneNumbersInChunks,
};
