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

    const successMsg = { type: "SUCCESS", result };
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
