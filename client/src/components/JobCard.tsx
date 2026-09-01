import React from 'react';
import { IQueueJob, JobStatus } from '../models/types';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';

interface JobCardProps {
  job: IQueueJob;
  currentClientId: string;
}

export const JobCard: React.FC<JobCardProps> = ({ job, currentClientId }) => {
  const isOwnJob = job.clientId === currentClientId;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <tr style={{ background: isOwnJob ? 'rgba(99, 102, 241, 0.05)' : undefined }}>
      <td className="job-id-cell">
        {job.jobId}
        {isOwnJob && <span style={{ marginLeft: 6, fontSize: 10, color: '#818cf8', fontWeight: 'bold' }}>(You)</span>}
      </td>
      <td>
        <div style={{ fontWeight: 500, color: '#f3f4f6' }}>{job.fileName}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {(job.fileSize / 1024).toFixed(1)} KB
        </div>
      </td>
      <td className="user-cell">{job.clientId.slice(0, 8)}...</td>
      <td>
        <span className={`priority-badge ${job.priority}`}>
          {job.priority === 'HIGH' ? '⚡ HIGH' : '🐢 LOW'}
        </span>
      </td>
      <td>
        <StatusBadge status={job.status} />
      </td>
      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
        {job.status === JobStatus.QUEUED || job.status === JobStatus.WAITING
          ? `#${job.queuePosition}`
          : '—'}
      </td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
        {job.workerId || '—'}
      </td>
      <td>
        {job.status === JobStatus.PROCESSING ? (
          <ProgressBar progress={job.progress} animated={true} />
        ) : job.status === JobStatus.COMPLETED ? (
          <ProgressBar progress={100} animated={false} />
        ) : (
          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>
        )}
      </td>
      <td>
        {job.status === JobStatus.COMPLETED && job.result !== null ? (
          <span className="result-cell">{job.result.toLocaleString()}</span>
        ) : job.status === JobStatus.FAILED ? (
          <span className="error-cell" title={job.error || 'Failed'}>
            ⚠️ {job.error || 'Failed'}
          </span>
        ) : (
          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>Pending</span>
        )}
      </td>
      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {formatDate(job.createdAt)}
      </td>
    </tr>
  );
};
