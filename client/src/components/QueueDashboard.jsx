import React, { useState } from "react";
import { JobCard } from "./JobCard";

export const QueueDashboard = ({ jobs, stats, currentClientId }) => {
  const [filter, setFilter] = useState("ALL");

  const filteredJobs = jobs.filter((job) => {
    if (filter === "MY_JOBS") return job.clientId === currentClientId;
    if (filter === "ACTIVE")
      return (
        job.status === "QUEUED" ||
        job.status === "WAITING" ||
        job.status === "PROCESSING"
      );
    return true;
  });

  return (
    <div className="glass-panel">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <span>⚙️</span> Processing Queue
          <span className="worker-pool-badge">
            Workers Active: {stats.activeWorkers}/{stats.maxWorkers}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setFilter("ALL")}
            className={`priority-badge ${filter === "ALL" ? "HIGH" : ""}`}
            style={{
              cursor: "pointer",
              background:
                filter === "ALL" ? "var(--accent-primary)" : "var(--bg-input)",
              color: "#fff",
              border: "1px solid var(--border-color)",
              padding: "6px 12px",
            }}
          >
            All Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            style={{
              cursor: "pointer",
              background:
                filter === "ACTIVE"
                  ? "var(--accent-primary)"
                  : "var(--bg-input)",
              color: "#fff",
              border: "1px solid var(--border-color)",
              padding: "6px 12px",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            Active ({stats.waiting + stats.processing})
          </button>
          <button
            onClick={() => setFilter("MY_JOBS")}
            style={{
              cursor: "pointer",
              background:
                filter === "MY_JOBS"
                  ? "var(--accent-primary)"
                  : "var(--bg-input)",
              color: "#fff",
              border: "1px solid var(--border-color)",
              padding: "6px 12px",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            My Jobs ({jobs.filter((j) => j.clientId === currentClientId).length}
            )
          </button>
        </div>
      </div>

      <div className="queue-table-container">
        {filteredJobs.length === 0 ? (
          <div className="empty-state">
            No jobs found matching current filter. Upload a CSV file above to
            start processing!
          </div>
        ) : (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>File</th>
                <th>User ID</th>
                <th>Priority</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Pos</th>
                <th>Worker</th>
                <th>Progress</th>
                <th>Result (Sum)</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.jobId}
                  job={job}
                  currentClientId={currentClientId}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
