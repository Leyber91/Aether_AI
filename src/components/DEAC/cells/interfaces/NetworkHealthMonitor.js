import React from 'react';
import { FiActivity, FiZap, FiCpu, FiWifi, FiTrendingUp, FiShield, FiGlobe } from 'react-icons/fi';
import '../styles/shared/StatusDots.css';
import './NetworkHealthMonitor.css';

/**
 * NetworkHealthMonitor - Top bar network status display
 * Shows real-time health metrics and system status including WebSocket connection
 */
const NetworkHealthMonitor = ({ health, metaLoopActive, evolutionInProgress, isConnected }) => {
  const getHealthStatus = (score) => {
    if (score >= 90) return { status: 'excellent', color: 'success' };
    if (score >= 70) return { status: 'good', color: 'warning' };
    return { status: 'warning', color: 'error' };
  };

  const healthStatus = getHealthStatus(health.healthScore);

  const formatUptime = () => {
    // Simulated uptime - would be real in production
    return '2h 34m';
  };

  return (
    <div className="network-health-monitor">
      
      {/* Connection Status */}
      <div className="connection-status">
        <div className="connection-icon-container">
          <FiGlobe className={`connection-icon ${isConnected ? 'connected' : 'disconnected'}`} />
          <div className={`status-dot status-dot--${isConnected ? 'ready' : 'error'}`}></div>
        </div>
        <div className="connection-info">
          <span className="connection-label">WebSocket</span>
          <span className={`connection-state ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Primary Health Indicator */}
      <div className="health-primary">
        <div className="health-icon-container">
          <FiShield className={`health-icon ${healthStatus.color}`} />
          <div className={`status-dot status-dot--${healthStatus.color === 'success' ? 'ready' : healthStatus.color === 'warning' ? 'thinking' : 'error'}`}></div>
        </div>
        <div className="health-info">
          <span className="health-label">Network Health</span>
          <span className={`health-score ${healthStatus.color}`}>
            {health.healthScore}% - {healthStatus.status}
          </span>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="health-metrics">
        
        {/* Active Nodes */}
        <div className="metric-item">
          <FiCpu className="metric-icon" />
          <div className="metric-info">
            <span className="metric-label">Active Nodes</span>
            <span className="metric-value">{health.activeNodes}</span>
          </div>
        </div>

        {/* MetaLoop Status */}
        <div className="metric-item">
          <FiZap className={`metric-icon ${metaLoopActive ? 'active' : 'inactive'}`} />
          <div className="metric-info">
            <span className="metric-label">MetaLoop</span>
            <span className={`metric-value ${metaLoopActive ? 'active' : 'inactive'}`}>
              {metaLoopActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {metaLoopActive && <div className="metaloop-pulse-indicator"></div>}
        </div>

        {/* Communication Volume */}
        <div className="metric-item">
          <FiWifi className="metric-icon" />
          <div className="metric-info">
            <span className="metric-label">Communications</span>
            <span className="metric-value">{health.totalCommunications}</span>
          </div>
        </div>

        {/* Evolution Generation */}
        <div className="metric-item">
          <FiTrendingUp className="metric-icon" />
          <div className="metric-info">
            <span className="metric-label">Evolution</span>
            <span className="metric-value">Gen {health.evolutionGeneration}</span>
          </div>
        </div>

        {/* System Activity */}
        <div className="metric-item">
          <FiActivity className={`metric-icon ${evolutionInProgress ? 'active' : 'idle'}`} />
          <div className="metric-info">
            <span className="metric-label">System</span>
            <span className={`metric-value ${evolutionInProgress ? 'active' : 'idle'}`}>
              {evolutionInProgress ? 'Evolving' : 'Stable'}
            </span>
          </div>
        </div>

      </div>

      {/* System Info */}
      <div className="system-info">
        <div className="system-item">
          <span className="system-label">Uptime:</span>
          <span className="system-value">{formatUptime()}</span>
        </div>
        <div className="system-item">
          <span className="system-label">Load:</span>
          <span className="system-value">
            {Math.round((health.activeNodes * health.totalCommunications / 100) * 10) / 10}%
          </span>
        </div>
      </div>

      {/* Real-time Activity Indicator */}
      {(metaLoopActive || evolutionInProgress) && (
        <div className="activity-indicator">
          <div className="activity-pulse"></div>
          <span className="activity-text">
            {evolutionInProgress ? 'Evolution in Progress' : 'MetaLoop Active'}
          </span>
        </div>
      )}

    </div>
  );
};

export default NetworkHealthMonitor; 