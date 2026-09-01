import React from 'react';
import { QueueStats } from '../models/types';

interface StatsOverviewProps {
  stats: QueueStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return (
    <div className="stats-grid">
      <div className="stat-card total">
        <span className="stat-label">Total Jobs</span>
        <span className="stat-value">{stats.totalJobs}</span>
      </div>

      <div className="stat-card waiting">
        <span className="stat-label">Waiting in Queue</span>
        <span className="stat-value">{stats.waiting}</span>
      </div>

      <div className="stat-card processing">
        <span className="stat-label">Currently Processing</span>
        <span className="stat-value">{stats.processing}</span>
      </div>

      <div className="stat-card completed">
        <span className="stat-label">Completed</span>
        <span className="stat-value">{stats.completed}</span>
      </div>

      <div className="stat-card failed">
        <span className="stat-label">Failed</span>
        <span className="stat-value">{stats.failed}</span>
      </div>
    </div>
  );
};
