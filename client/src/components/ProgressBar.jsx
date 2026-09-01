import React from "react";

export const ProgressBar = ({ progress, animated = false }) => {
  const boundedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="progress-container">
      <div className="progress-track">
        <div
          className={`progress-fill ${animated ? "animated" : ""}`}
          style={{ width: `${boundedProgress}%` }}
        />
      </div>
      <div className="progress-text">{boundedProgress}%</div>
    </div>
  );
};
