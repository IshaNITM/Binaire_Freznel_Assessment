import { parentPort, workerData } from "worker_threads";
import { CsvProcessor } from "./CsvProcessor.js";

if (!parentPort) {
  throw new Error("csvWorker must be run as a Worker thread");
}

const taskData = workerData;

async function executeTask() {
  try {
    const result = await CsvProcessor.processCsvFile(
      taskData.filePath,
      (progress) => {
        const progressMsg = { type: "PROGRESS", progress };
        parentPort.postMessage(progressMsg);
      },
    );

    // Generate output file
    const fs = await import("fs");
    const path = await import("path");
    
    const outputDir = path.join(process.cwd(), "outputs");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFilename = `result-${taskData.jobId}.csv`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, `Result\n${result}`);

    const successMsg = { type: "SUCCESS", result, outputFile: outputFilename };
    parentPort.postMessage(successMsg);
  } catch (err) {
    const errorMsg = {
      type: "ERROR",
      error: err.message || "CSV processing failed",
    };
    parentPort.postMessage(errorMsg);
  }
}

executeTask();
