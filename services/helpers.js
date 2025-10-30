const fs = require("fs");

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), ms)),
  ]);
};

const generateUniqueFileName = (filePath) => {
  let uniqueFilePath = filePath;
  let count = 1;
  while (fs.existsSync(uniqueFilePath)) {
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    uniqueFilePath = path.join(path.dirname(filePath), `${baseName}_${count}${ext}`);
    count++;
  }
  return uniqueFilePath;
};

module.exports = { withTimeout, generateUniqueFileName };
