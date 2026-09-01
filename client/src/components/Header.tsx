import React from 'react';

interface HeaderProps {
  clientId: string;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ clientId, isConnected }) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">B</div>
        <div>
          <h1 className="brand-title">BINAIRE QUEUE SYSTEM</h1>
        </div>
        <span className="user-badge" title="Your unique client session ID">
          User: {clientId.slice(0, 8)}...
        </span>
      </div>

      <div className="connection-indicator">
        <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
        <span style={{ color: isConnected ? '#34d399' : '#f87171' }}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </header>
  );
};
