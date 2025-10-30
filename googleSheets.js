const { google } = require("googleapis");
const path = require("path");
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "admin.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const spreadsheetId = "10wDKwHfS5ytpOxSPIr89PG0J1hRoKQ7S_3Qvjk-Pqlk";

let cachedDbMap = null;
let lastCacheTime = 0;
let fetchInProgress = false;
let refreshInProgress = false;
let autoRefreshScheduled = false;

const CACHE_DURATION_MS = 4 * 60 * 60 * 1000;

async function fetchDatabaseFromGoogle() {
  const startTime = Date.now();
  console.log(`[Google Sheets] Fetching database numbers...`);

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Medicare!A2:B",
      majorDimension: "ROWS",
    });

    const rows = res.data.values || [];
    const dbMap = new Map();
    let validCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const [number, status] = rows[i];
      if (!number) continue;

      try {
        const cleanNumber = number
          .toString()
          .replace(/\D/g, "")
          .replace(/^1/, "")
          .slice(-10);

        if (cleanNumber && cleanNumber.length === 10) {
          dbMap.set(cleanNumber, status);
          validCount++;
        }
      } catch (err) {
        console.warn(`[Google Sheets] Error processing row ${i + 2}:`, err.message);
      }
    }

    console.log(
      `[Google Sheets] Loaded ${validCount} valid numbers in ${Date.now() - startTime}ms`
    );
    return dbMap;
  } catch (error) {
    console.error("[Google Sheets] Fetch failed:", error.message);
    throw error;
  }
}

async function getDatabaseNumbers(forceRefresh = false) {
  const now = Date.now();
  const cacheExpired = now - lastCacheTime > CACHE_DURATION_MS;

  if (fetchInProgress) {
    console.log(`[Cache] Fetch already in progress, waiting...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return cachedDbMap || new Map();
  }

  if (!cachedDbMap || forceRefresh) {
    try {
      fetchInProgress = true;
      cachedDbMap = await fetchDatabaseFromGoogle();
      lastCacheTime = now;

      if (!autoRefreshScheduled) {
        scheduleAutoRefresh();
        autoRefreshScheduled = true;
      }
    } finally {
      fetchInProgress = false;
    }
    return cachedDbMap;
  }
  if (cacheExpired && !refreshInProgress) {
    refreshInProgress = true;
    fetchDatabaseFromGoogle()
      .then((newMap) => {
        cachedDbMap = newMap;
        lastCacheTime = Date.now();
        console.log(`[Cache] Auto-refreshed in background (${cachedDbMap.size} numbers)`);
      })
      .catch((err) => console.error("[Cache] Background refresh failed:", err.message))
      .finally(() => (refreshInProgress = false));
  }
  return cachedDbMap;
}

function scheduleAutoRefresh() {
  console.log(`[Cache] Scheduling automatic refresh every 4 hours...`);
  setInterval(async () => {
    if (refreshInProgress) return;
    console.log(`[Cache] Scheduled 4-hour refresh triggered...`);

    try {
      refreshInProgress = true;
      const newMap = await fetchDatabaseFromGoogle();
      cachedDbMap = newMap;
      lastCacheTime = Date.now();
      console.log(`[Cache] Auto-refreshed ${cachedDbMap.size} phone numbers (scheduled)`);
    } catch (err) {
      console.error("[Cache] Scheduled refresh failed:", err.message);
    } finally {
      refreshInProgress = false;
    }
  }, CACHE_DURATION_MS);
}
module.exports = {
  getDatabaseNumbers,
};
