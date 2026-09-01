# Binaire Multi-User Queue System (`Binaire_Freznel_Assessment`)

A robust, production-ready full-stack web application implementing a **multi-user CSV processing and priority-based server queueing system** built with Node.js, TypeScript, Express, Socket.IO, worker threads, and React.

---

## 1. Project Overview

The Binaire Queue System allows multiple concurrent users to upload CSV files containing integer and floating-point numeric values. Uploaded files are assigned either **HIGH** or **LOW** priority and submitted to a Node.js server queue.

The server manages execution using a dedicated priority queue, dispatches jobs to a pool of background CPU worker threads (`worker_threads`), tracks real-time processing progress, guarantees starvation prevention for low-priority jobs through deterministic aging, prevents deadlocks with strict timeout and resource controls, and broadcasts live visual updates to all connected dashboards via WebSockets.

---

## 2. Architecture

```text
Client (React + TS)
   │ (HTTP POST /api/upload & WebSocket updates)
   ▼
Express Server / Controller
   │
   ▼
QueueService (Orchestrator)
   │
   ├───────────────► QueueManager (High & Low Priority Queues)
   │                     ▲
   │                     │ (Priority + Aging Selection)
   │                     ▼
   ├───────────────► Scheduler
   │                     │
   ▼                     ▼
WorkerManager (Worker Pool Control)
   │
   ├─► Worker Thread 1 (csvWorker.ts) ──► CsvProcessor (Stream Sum)
   ├─► Worker Thread 2 (csvWorker.ts) ──► CsvProcessor (Stream Sum)
   └─► Worker Thread N (csvWorker.ts) ──► CsvProcessor (Stream Sum)
   │
   ▼
Result Returned ──► Socket.IO Broadcast ──► Real-Time Dashboard Updates
```

---

## 3. Queue Algorithm & Priority Scheduling

The system employs a two-tier priority queue structure (`HIGH` and `LOW`).

1. **Queue Organization**:
   - `HIGH` priority queue: Handled with strict FIFO precedence under normal conditions.
   - `LOW` priority queue: Serviced when `HIGH` priority queue is empty or when starvation prevention triggers.

2. **Selection Logic**:
   - When a worker becomes available, the `Scheduler` queries the queues.
   - All waiting low-priority jobs increment their `age` counter by 1 per scheduling cycle.
   - High-priority jobs are processed ahead of low-priority jobs unless any low-priority job exceeds the **Starvation Threshold** (`MAX_AGE_THRESHOLD = 5`).

---

## 4. Starvation Prevention Strategy

To protect low-priority jobs from indefinite waiting (starvation) when a continuous stream of high-priority jobs arrives:

- **Aging Mechanism**: Every scheduling cycle, all waiting jobs in the low-priority queue increment an internal `age` metric.
- **Deterministic Promotion**: If any low-priority job reaches `age >= 5`, the `Scheduler` temporarily promotes that specific job and dispatches it immediately, regardless of how many high-priority jobs are currently queued.
- **Reset**: Once dispatched, the job's age is reset to 0.

*Result*: A low-priority job is guaranteed to be serviced within at most 5 high-priority processing cycles.

---

## 5. Worker Architecture & Pool Lifecycle

To ensure CPU-intensive CSV calculation (parsing & numerical summation) does not block Node.js's main single-threaded event loop:

- **Worker Threads (`node:worker_threads`)**: Each calculation runs in an isolated OS worker thread.
- **Worker Pool Control (`WorkerManager`)**:
  - The maximum concurrent worker thread pool size is capped (`MAX_WORKERS = 4`, configurable based on host CPU core count).
  - When all worker threads are busy, newly arrived jobs wait in the queue without blocking HTTP or WebSocket handling.
  - Workers stream CSV files line-by-line using Node streams and post periodic progress messages (`PROGRESS`, 0–100%) back to the parent thread.
- **Error & Resource Isolation**: If a worker encounters invalid data or crashes, the error is isolated to that specific job. The worker slot is freed, and other queued jobs continue executing smoothly.

---

## 6. Deadlock Analysis & Prevention

### Possible Deadlocks
1. **Worker Thread Hanging / Infinite Loop**: A corrupt or malformed file causes a worker thread to lock or hang indefinitely, consuming worker pool slots until no free workers remain.
2. **Circular File Resource Locks**: A job waiting for an open file descriptor held by a worker that is itself waiting for the job state.
3. **Queue Mutex Contention**: Concurrent API requests causing race conditions in queue array mutations.

### Productivity Impact
Without deadlock prevention:
- **Queue Throughput**: Drops to 0 as worker pool slots become exhausted.
- **User Waiting Time**: Tends to infinity for all subsequent submissions.
- **Server Resources**: Memory leaks and unreleased file descriptors degrade system stability.

### Prevention Mechanisms
1. **Watchdog Worker Timeouts**: `WorkerManager` attaches a 60-second watchdog timer to every active worker. If processing exceeds 60 seconds, the worker thread is forcibly terminated (`worker.terminate()`), the job is marked `FAILED`, and the worker slot is released immediately.
2. **Non-Blocking Async Event Loop**: Node.js naturally serializes queue state mutations on the main event loop, eliminating traditional multi-threaded OS mutex deadlocks.
3. **Stream Handle Cleanup**: All file reading streams are wrapped in strict `try...finally` blocks to guarantee file handles close upon completion, error, or worker exit.

---

## 7. API & Real-Time Events Documentation

### REST Endpoints

#### `POST /api/upload`
Upload a CSV file and submit a processing job.
- **Body (`multipart/form-data`)**:
  - `file`: CSV File (required)
  - `priority`: `'HIGH'` | `'LOW'` (default: `'LOW'`)
  - `clientId`: User session ID string
- **Response `201 Created`**:
```json
{
  "message": "File submitted successfully",
  "job": {
    "jobId": "JOB-1001",
    "clientId": "USER-x89f2a",
    "fileName": "sales-data.csv",
    "fileSize": 12048,
    "priority": "HIGH",
    "status": "QUEUED",
    "queuePosition": 1,
    "workerId": null,
    "progress": 0,
    "createdAt": "2026-09-01T14:00:00.000Z",
    "result": null,
    "error": null
  }
}
```

#### `GET /api/queue`
Fetch full queue state and statistics.

#### `GET /api/job/:jobId`
Fetch details for a specific job ID.

#### `GET /api/stats`
Fetch system statistics (`totalJobs`, `processing`, `waiting`, `completed`, `failed`, `activeWorkers`, `maxWorkers`).

### WebSocket Events (Socket.IO)
- `queue:update` — Emitted whenever any job enters, changes position, or finishes in the queue.
- `job:progress` — Emitted live as worker threads report chunk processing percentage.
- `job:completed` — Emitted when a job finishes calculation.
- `job:failed` — Emitted if a job fails validation or calculation.

---

## 8. Running Locally

### Prerequisites
- Node.js 18+ and `npm`

### Installation & Execution

```bash
# 1. Clone repository
git clone https://github.com/imravirajj/Binaire_Freznel_Assessment.git
cd Binaire_Freznel_Assessment

# 2. Install all dependencies (root, server, client)
npm run install:all

# 3. Start development server (runs backend on :3001 and frontend on :3000)
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 9. Testing

### Sample Data Provided
Sample files are available in the `samples/` directory:
- `samples/small_integers.csv` — Basic 3x3 matrix (Sum = 21)
- `samples/floats_and_ints.csv` — Floating point numbers and negative numbers
- `samples/invalid_data.csv` — Non-numeric data (for error handling testing)

### Verification Scenarios
1. **Single User / Single File**: Upload `small_integers.csv` with `HIGH` priority. Verify sum result is `21`.
2. **Multiple Users**: Open 2 or 3 separate browser windows/tabs (each gets a distinct `User ID`). Upload files simultaneously and observe real-time sync across all windows.
3. **Priority Ordering**: Upload a `LOW` priority file first, then quickly upload a `HIGH` priority file. Observe `HIGH` priority jump ahead in position.
4. **Starvation Prevention**: Submit 1 `LOW` priority job followed by 6 `HIGH` priority jobs. Observe the `LOW` priority job promoted after 5 cycles.
5. **Error Handling**: Upload `invalid_data.csv`. Verify that the job is cleanly flagged as `FAILED` with an descriptive error message without crashing the server.

---

## 10. Deployment

The application is structured for easy deployment to cloud platforms like Vercel, Railway, Render, or Heroku.

### Single Container Deployment (e.g. Railway / Render / DigitalOcean App Platform)
1. Build command: `npm run build`
2. Start command: `npm start` (Runs Node server which also serves the compiled React app from `client/dist`).

---

## 11. Design Decisions & Technical Trade-Offs

1. **Streaming CSV Reader vs. In-Memory Array**:
   - *Decision*: Line-by-line `readline` streams with Node.js `fs.createReadStream`.
   - *Trade-off*: Slightly higher overhead for micro-files, but prevents heap out-of-memory crashes on multi-gigabyte CSV files.
2. **Aging-Based Starvation Prevention vs. Weighted Round Robin**:
   - *Decision*: Deterministic aging counter.
   - *Trade-off*: Simpler to reason about and test, with a hard bound on low-priority wait times.
3. **Socket.IO over Plain WebSockets**:
   - *Decision*: Socket.IO for real-time communication.
   - *Trade-off*: Requires Socket.IO client library overhead, but provides automatic reconnection, room support, and fallback transports.
