import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Priority } from "../models/types.js";

// Set up upload storage directory
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.originalname.endsWith(".csv") ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

export function createUploadRouter(queueService) {
  const router = Router();

  /**
   * POST /api/upload
   * Form fields: file (multipart), priority ('HIGH' | 'LOW'), clientId (string)
   */
  router.post("/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const clientId = (req.body.clientId || "anonymous").toString();
      const priorityStr = (req.body.priority || "LOW").toString().toUpperCase();
      const priority = priorityStr === "HIGH" ? Priority.HIGH : Priority.LOW;

      const result = await queueService.submitJob(
        clientId,
        req.file.originalname,
        req.file.path,
        req.file.size,
        priority,
      );

      if (!result.success) {
        // Remove invalid file from disk
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(201).json({
        message: "File submitted successfully",
        job: result.job,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  /**
   * GET /api/queue
   */
  router.get("/queue", (_req, res) => {
    res.json(queueService.getQueueState());
  });

  /**
   * GET /api/job/:jobId
   */
  router.get("/job/:jobId", (req, res) => {
    const { jobId } = req.params;
    const job = queueService.getJobStatus(jobId);
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.json(job);
  });

  /**
   * GET /api/stats
   */
  router.get("/stats", (_req, res) => {
    res.json(queueService.getStats());
  });

  return router;
}
