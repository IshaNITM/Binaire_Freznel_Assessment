import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import path from "path";
import fs from "fs";
import { QueueService } from "./services/QueueService.js";
import { createUploadRouter } from "./controllers/uploadController.js";
import { setupSocketHandlers } from "./server/socketHandler.js";
import { Logger } from "./utils/logger.js";

const PORT = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend dev server
app.use(cors());
app.use(express.json());

// Initialize core QueueService (with 4 worker threads max)
const queueService = new QueueService(4);

// Mount API router
app.use("/api", createUploadRouter(queueService));

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

setupSocketHandlers(io, queueService);

// Serve static frontend files in production if available
const clientBuildPath = path.join(process.cwd(), "../client/dist");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

server.listen(PORT, () => {
  Logger.info(
    "Server",
    `🚀 Binaire Queue System Server running on port ${PORT}`,
  );
});
