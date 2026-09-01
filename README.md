#  Multi-User Queue System

A full-stack multi-user CSV processing and priority-based server queueing system built with **React, Node.js, Express, Socket.IO, JavaScript, and Worker Threads**.

## 🚀 Live Demo

**Frontend:**
https://multi-user-queue-system-virid.vercel.app/

**Backend:**
https://multiuserqueuesystem.onrender.com

## 📌 Project Overview

The Binaire Multi-User Queue System allows multiple users to upload CSV files containing integer and floating-point values.

Each uploaded file is assigned either **HIGH** or **LOW** priority and added to a server-side processing queue.

The system provides:

* Multi-user file uploads
* HIGH / LOW priority queue
* FIFO ordering within priority
* Starvation prevention using aging
* Node.js Worker Threads for CPU-intensive processing
* Real-time queue updates using Socket.IO
* Processing progress tracking
* Concurrent worker pool
* Job status tracking
* Error handling
* Deadlock prevention using worker timeouts
* Streaming CSV processing

---

## 🏗️ Architecture

```text
React Client
     │
     │ HTTP + Socket.IO
     ▼
Express Server
     │
     ▼
QueueService
     │
     ├── QueueManager
     │      ├── HIGH Queue
     │      └── LOW Queue
     │
     ▼
Scheduler
     │
     ▼
WorkerManager
     │
     ├── Worker Thread 1
     ├── Worker Thread 2
     ├── Worker Thread 3
     └── Worker Thread 4
     │
     ▼
CSV Processor
     │
     ▼
Result + Progress
     │
     ▼
Socket.IO Broadcast
     │
     ▼
All Connected Clients
```

---

## ⚙️ Technology Stack

### Frontend

* React
* JavaScript
* Vite
* Socket.IO Client
* CSS

### Backend

* Node.js
* Express.js
* Socket.IO
* Multer
* Worker Threads
* Node.js Streams

### Processing

* CSV streaming
* Integer and floating-point calculations
* Priority-based scheduling
* Worker thread pool

---

## 🔄 Queue & Priority Scheduling

The system uses two priority levels:

### HIGH Priority

HIGH priority jobs are processed before LOW priority jobs under normal conditions.

### LOW Priority

LOW priority jobs are processed when there are no HIGH priority jobs waiting.

### Starvation Prevention

To prevent LOW priority jobs from waiting indefinitely:

* Waiting jobs maintain an aging counter.
* The age increases during scheduling cycles.
* When a LOW priority job reaches the starvation threshold, it is promoted.
* This guarantees that LOW priority jobs eventually get processed.

---

## 🧵 Worker Thread Architecture

CPU-intensive CSV processing is moved away from the Node.js main event loop.

A worker pool manages multiple processing jobs concurrently.

```text
Incoming Job
     ↓
Queue
     ↓
Scheduler
     ↓
WorkerManager
     ↓
Worker Thread
     ↓
CSV Processing
     ↓
Result
```

The worker pool prevents large CSV calculations from blocking HTTP requests and WebSocket communication.

---

## 🛡️ Deadlock Prevention

Potential worker deadlocks or hanging jobs are handled using:

### Worker Timeout

Each worker has a maximum processing time.

If a worker exceeds the timeout:

```text
Worker Timeout
      ↓
Worker Terminated
      ↓
Job marked FAILED
      ↓
Worker slot released
      ↓
Next queued job processed
```

### Non-blocking Event Loop

Queue state is managed through Node.js's event loop, avoiding traditional shared-memory mutex contention.

### Resource Cleanup

CSV streams and worker resources are cleaned up when processing completes or fails.

---

## 🔌 API Endpoints

### Upload CSV

```http
POST /api/upload
```

Multipart form data:

```text
file
priority
clientId
```

Example priority:

```text
HIGH
LOW
```

### Get Queue

```http
GET /api/queue
```

Returns the current queue state and job information.

### Get Job

```http
GET /api/job/:jobId
```

Returns details for a specific job.

### Get Statistics

```http
GET /api/stats
```

Returns queue statistics such as:

* Total jobs
* Processing jobs
* Waiting jobs
* Completed jobs
* Failed jobs
* Active workers
* Maximum workers

---

## 🔔 Socket.IO Events

The application uses Socket.IO for real-time queue updates.

### `queue:update`

Broadcast when queue state changes.

### `job:progress`

Broadcast during CSV processing.

### `job:completed`

Broadcast when processing finishes successfully.

### `job:failed`

Broadcast when a job fails.

---

## 🧪 Testing Scenarios

### Single User

1. Open the application.
2. Upload a CSV.
3. Select HIGH priority.
4. Submit the file.
5. Verify processing and completion.

### Multiple Users

Open the application in multiple browser windows and upload files simultaneously.

Observe that queue updates are synchronized between clients.

### Priority Testing

1. Upload a LOW priority file.
2. Upload a HIGH priority file.
3. Verify that the HIGH priority job is scheduled first when applicable.

### Starvation Prevention

Submit:

```text
LOW
HIGH
HIGH
HIGH
HIGH
HIGH
```

Verify that the LOW priority job eventually receives processing time instead of waiting indefinitely.

### Error Handling

Upload an invalid/non-numeric CSV and verify that the job is marked as `FAILED` without crashing the server.

---

## 💻 Local Development

### Prerequisites

* Node.js 18+
* npm

### Clone Repository

```bash
git clone https://github.com/IshaNITM/MultiUserQueueSystem.git
cd MultiUserQueueSystem
```

### Install Backend

```bash
cd server
npm install
```

### Start Backend

```bash
npm start
```

### Install Frontend

Open another terminal:

```bash
cd client
npm install
```

### Start Frontend

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

---

## ☁️ Deployment

The project is deployed using separate frontend and backend services.

### Frontend

Hosted on **Vercel**:

https://multi-user-queue-system-virid.vercel.app/

### Backend

Hosted on **Render**:

https://multiuserqueuesystem.onrender.com

### Environment Variable

The frontend uses:

```text
VITE_API_URL=https://multiuserqueuesystem.onrender.com
```

The backend is configured to communicate with the deployed frontend through CORS and Socket.IO.

---

## 📁 Project Structure

```text
MultiUserQueueSystem/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── models/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── queue/
│   │   ├── scheduler/
│   │   ├── server/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── workers/
│   │   └── index.js
│   └── package.json
│
├── small-integers.csv
├── floats.csv
├── mixed-values.csv
└── README.md
```

---

## 🔗 Repository

GitHub:

https://github.com/IshaNITM/MultiUserQueueSystem

## 📄 Assessment

This project was developed for the **Binaire Multi-User Queue System assessment**.
