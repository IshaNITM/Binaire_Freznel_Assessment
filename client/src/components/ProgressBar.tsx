import React from 'react';

interface ProgressBarProps {
  progress: number;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, animated = false }) => {
  const boundedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="progress-container">
      <div className="progress-track">
        <div
          className={`progress-fill ${animated ? 'animated' : ''}`}
          style={{ width: `${boundedProgress}%` }}
        />
      </div>
      <div className="progress-text">{boundedProgress}%</div>
    </div>
  );
};
