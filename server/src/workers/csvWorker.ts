import { parentPort, workerData } from 'worker_threads';
import { CsvProcessor } from './CsvProcessor.js';
import { WorkerTaskData, WorkerMessage } from '../models/types.js';

if (!parentPort) {
  throw new Error('csvWorker must be run as a Worker thread');
}

const taskData = workerData as WorkerTaskData;

async function executeTask() {
  try {
    const result = await CsvProcessor.processCsvFile(taskData.filePath, (progress) => {
      const progressMsg: WorkerMessage = { type: 'PROGRESS', progress };
      parentPort!.postMessage(progressMsg);
    });

    const successMsg: WorkerMessage = { type: 'SUCCESS', result };
    parentPort!.postMessage(successMsg);
  } catch (err: any) {
    const errorMsg: WorkerMessage = { type: 'ERROR', error: err.message || 'CSV processing failed' };
    parentPort!.postMessage(errorMsg);
  }
}

executeTask();
