import React from 'react';
import { FiCheck, FiX, FiAlertTriangle, FiActivity, FiDatabase, FiCpu } from 'react-icons/fi';

/**
 * SystemStatusPanel - Displays DEAC system health and status
 */
const SystemStatusPanel = ({ status, isLoading, error }) => {
  if (isLoading && !status) {
    return (
      <div className="system-status-panel loading">
        <div className="status-header">
          <FiActivity className="status-icon" />
          <h3>System Status</h3>
        </div>
        <div className="status-loading">
          <div className="loading-spinner"></div>
          <span>Checking system status...</span>
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="system-status-panel error">
        <div className="status-header">
          <FiX className="status-icon error" />
          <h3>System Status - Error</h3>
        </div>
        <div className="status-error">
          <FiAlertTriangle />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusIcon = (isAvailable) => {
    return isAvailable ? (
      <FiCheck className="status-check success" />
    ) : (
      <FiX className="status-check error" />
    );
  };

  const getStatusClass = (isAvailable) => {
    return isAvailable ? 'success' : 'error';
  };

  return (
    <div className={`system-status-panel ${status.available ? 'healthy' : 'unhealthy'}`}>
      <div className="status-header">
        <FiActivity className="status-icon" />
        <h3>System Status</h3>
        <div className={`overall-status ${getStatusClass(status.available)}`}>
          {getStatusIcon(status.available)}
          {status.available ? 'System Online' : 'System Offline'}
        </div>
      </div>

      <div className="status-grid">
        <div className="status-item">
          <div className="status-item-header">
            {getStatusIcon(status.controller_initialized)}
            <span>DEAC Controller</span>
          </div>
          <div className="status-detail">
            {status.controller_initialized ? 'Operational' : 'Not Available'}
          </div>
        </div>

        <div className="status-item">
          <div className="status-item-header">
            {getStatusIcon(status.memory_manager_initialized)}
            <span>Memory Manager</span>
          </div>
          <div className="status-detail">
            {status.memory_manager_initialized ? 'Operational' : 'Not Available'}
          </div>
        </div>

        <div className="status-item">
          <div className="status-item-header">
            {getStatusIcon(status.vector_service_initialized)}
            <span>Vector Service</span>
          </div>
          <div className="status-detail">
            {status.vector_service_initialized ? 'Operational' : 'Not Available'}
          </div>
        </div>

        <div className="status-item">
          <div className="status-item-header">
            {getStatusIcon(status.model_service_available)}
            <span>Model Service</span>
          </div>
          <div className="status-detail">
            {status.model_service_available ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {status.active_deacs !== undefined && (
          <div className="status-item metric">
            <div className="status-item-header">
              <FiCpu className="status-check" />
              <span>Active DEACs</span>
            </div>
            <div className="status-metric">
              {status.active_deacs}
            </div>
          </div>
        )}

        {status.data_directory && (
          <div className="status-item">
            <div className="status-item-header">
              <FiDatabase className="status-check" />
              <span>Data Storage</span>
            </div>
            <div className="status-detail">
              Ready
            </div>
          </div>
        )}
      </div>

      {!status.available && (
        <div className="status-warning">
          <FiAlertTriangle />
          <div>
            <strong>System Not Available</strong>
            <p>The DEAC system requires additional dependencies. Please ensure ChromaDB, Redis, and WebSockets are installed.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemStatusPanel; 