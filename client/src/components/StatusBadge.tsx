import React from 'react';
import { JobStatus } from '../models/types';

interface StatusBadgeProps {
  status: JobStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getLabel = () => {
    switch (status) {
      case JobStatus.UPLOADING: return 'Uploading';
      case JobStatus.UPLOADED: return 'Uploaded';
      case JobStatus.QUEUED: return 'Queued';
      case JobStatus.WAITING: return 'Waiting';
      case JobStatus.PROCESSING: return 'Processing';
      case JobStatus.COMPLETED: return 'Completed';
      case JobStatus.FAILED: return 'Failed';
    }
  };

  const isActive = status === JobStatus.PROCESSING || status === JobStatus.WAITING;

  return (
    <span className={`status-badge ${status}`}>
      {isActive && <span className="pulse-dot" />}
      {getLabel()}
    </span>
  );
};
