import fs from "fs";
import readline from "readline";

export class CsvProcessor {
  /**
   * Validates if a CSV file exists, is non-empty, and contains numeric values.
   */
  static async validateCsv(filePath) {
    if (!fs.existsSync(filePath)) {
      return { isValid: false, error: "File does not exist" };
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      return { isValid: false, error: "File is empty (0 bytes)" };
    }

    return new Promise((resolve) => {
      const stream = fs.createReadStream(filePath, { encoding: "utf8" });
      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      let lineCount = 0;
      let hasValidNumber = false;
      let validationError = null;

      rl.on("line", (line) => {
        lineCount++;
        const trimmed = line.trim();
        if (!trimmed) return; // Skip empty lines

        const parts = trimmed.split(",");
        for (const part of parts) {
          const val = part.trim();
          if (val === "") continue;

          const num = Number(val);
          if (isNaN(num)) {
            validationError = `Invalid non-numeric value "${val}" found at line ${lineCount}`;
            rl.close();
            stream.destroy();
            return;
          }
          hasValidNumber = true;
        }
      });

      rl.on("close", () => {
        if (validationError) {
          resolve({ isValid: false, error: validationError });
        } else if (!hasValidNumber) {
          resolve({ isValid: false, error: "File contains no numeric values" });
        } else {
          resolve({ isValid: true });
        }
      });

      rl.on("error", (err) => {
        resolve({ isValid: false, error: `Read error: ${err.message}` });
      });
    });
  }

  /**
   * Processes a CSV file and calculates the sum of all numeric values.
   * Reports progress via the provided callback.
   */
  static async processCsvFile(filePath, onProgress) {
    const stats = fs.statSync(filePath);
    const totalBytes = stats.size;
    let bytesRead = 0;
    let totalSum = 0;

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath, { encoding: "utf8" });
      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      let lastReportedProgress = -1;

      stream.on("data", (chunk) => {
        bytesRead += Buffer.byteLength(chunk);
        if (onProgress && totalBytes > 0) {
          const percent = Math.min(
            99,
            Math.floor((bytesRead / totalBytes) * 100),
          );
          if (percent > lastReportedProgress) {
            lastReportedProgress = percent;
            onProgress(percent);
          }
        }
      });

      rl.on("line", (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const parts = trimmed.split(",");
        for (const part of parts) {
          const val = part.trim();
          if (val === "") continue;

          const num = Number(val);
          if (isNaN(num)) {
            reject(new Error(`Invalid numeric value: "${val}"`));
            rl.close();
            stream.destroy();
            return;
          }
          totalSum += num;
        }
      });

      rl.on("close", () => {
        if (onProgress) {
          onProgress(100);
        }
        // Round to 6 decimal places to prevent float precision artifacts
        const roundedSum = Math.round(totalSum * 1e6) / 1e6;
        resolve(roundedSum);
      });

      rl.on("error", (err) => {
        reject(err);
      });
    });
  }
}
