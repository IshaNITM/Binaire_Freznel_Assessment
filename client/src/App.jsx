import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { FileUpload } from "./components/FileUpload";
import { StatsOverview } from "./components/StatsOverview";
import { QueueDashboard } from "./components/QueueDashboard";
import { socketService } from "./services/socketService";
import "./styles/index.css";
import "./styles/components.css";

export const App = () => {
  const [clientId, setClientId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    processing: 0,
    waiting: 0,
    completed: 0,
    failed: 0,
    activeWorkers: 0,
    maxWorkers: 4,
  });

  useEffect(() => {
    // Generate or retrieve persistent unique client identity for this browser session
    let id = localStorage.getItem("binaire_client_id");
    if (!id) {
      id = `USER-${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem("binaire_client_id", id);
    }
    setClientId(id);

    // Connect socket
    socketService.connect();

    const unsubConnection = socketService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    const unsubQueue = socketService.onQueueUpdate((state) => {
      setJobs(state.jobs);
      setStats(state.stats);
    });

    const unsubProgress = socketService.onJobProgress((updatedJob) => {
      setJobs((prevJobs) =>
        prevJobs.map((j) => (j.jobId === updatedJob.jobId ? updatedJob : j)),
      );
    });

    return () => {
      unsubConnection();
      unsubQueue();
      unsubProgress();
    };
  }, []);

  return (
    <div className="app-container">
      <Header clientId={clientId} isConnected={isConnected} />
      <FileUpload clientId={clientId} onUploadSuccess={() => {}} />
      <StatsOverview stats={stats} />
      <QueueDashboard jobs={jobs} stats={stats} currentClientId={clientId} />
    </div>
  );
};
