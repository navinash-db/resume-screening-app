const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === ".txt") {
      return fs.readFileSync(filePath, "utf-8");
    }

    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || "";
    }

    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || "";
    }

    return "";
  } catch (error) {
    console.error("Error extracting text from file:", error.message);
    return "";
  }
}

module.exports = {
  extractTextFromFile,
};