import React, { useState, useRef } from "react";
import { Priority } from "../models/types";
import { ApiService } from "../services/apiService";

export const FileUpload = ({ clientId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [priority, setPriority] = useState(Priority.HIGH);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".csv") || file.type === "text/csv") {
        setSelectedFile(file);
        setErrorMsg(null);
      } else {
        setErrorMsg("Please select a valid CSV file");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please select a CSV file to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMsg(null);

    const result = await ApiService.uploadCsv(
      selectedFile,
      priority,
      clientId,
      (progress) => setUploadProgress(progress),
    );

    setIsUploading(false);

    if (result.success) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploadSuccess();
    } else {
      setErrorMsg(result.error || "Upload failed");
    }
  };

  return (
    <div className="glass-panel">
      <h2 className="upload-card-title">
        <span>📄</span> Upload CSV File
      </h2>

      <form onSubmit={handleSubmit} className="upload-form">
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="csv-file-input"
        />

        <div
          className={`drop-zone ${isDragOver ? "active" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-icon">📁</div>
          <div className="drop-text">
            {selectedFile
              ? selectedFile.name
              : "Click or Drag & Drop CSV file here"}
          </div>
          <div className="drop-subtext">
            {selectedFile
              ? `${(selectedFile.size / 1024).toFixed(1)} KB`
              : "Numeric values only (Integers & Floating-point numbers)"}
          </div>
        </div>

        {errorMsg && (
          <div style={{ color: "#f87171", fontSize: "13px", padding: "4px 0" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="upload-controls">
          <div className="selected-file-info">
            <span style={{ color: "var(--text-muted)" }}>File:</span>
            <span style={{ fontWeight: 600 }}>
              {selectedFile ? selectedFile.name : "No file selected"}
            </span>
          </div>

          <div className="priority-select-group">
            <label className="priority-label" htmlFor="priority-select">
              Priority:
            </label>
            <select
              id="priority-select"
              className="priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={isUploading}
            >
              <option value={Priority.HIGH}>⚡ HIGH</option>
              <option value={Priority.LOW}>🐢 LOW</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? `Uploading ${uploadProgress}%...` : "Submit Job"}
          </button>
        </div>
      </form>
    </div>
  );
};
