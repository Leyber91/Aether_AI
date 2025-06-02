import React from 'react';
import { 
  FiCpu, 
  FiActivity, 
  FiZap, 
  FiMessageCircle, 
  FiTrendingUp, 
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiDatabase,
  FiUsers
} from 'react-icons/fi';

/**
 * ControlTowerMetrics - System-wide metrics and alerts dashboard
 */
const ControlTowerMetrics = ({ metrics, alerts }) => {
  if (!metrics) return null;

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error': return <FiXCircle />;
      case 'warning': return <FiAlertTriangle />;
      case 'info': return <FiCheckCircle />;
      default: return <FiActivity />;
    }
  };

  const getAlertClass = (type) => {
    switch (type) {
      case 'error': return 'alert-error';
      case 'warning': return 'alert-warning';
      case 'info': return 'alert-info';
      default: return 'alert-info';
    }
  };

  const calculateHealthScore = () => {
    if (metrics.totalDeacs === 0) return 100;
    return Math.round((metrics.healthyDeacs / metrics.totalDeacs) * 100);
  };

  const healthScore = calculateHealthScore();

  return (
    <div className="control-tower-metrics">
      <div className="metrics-header">
        <h3>System Overview</h3>
        <div className={`health-score ${healthScore >= 90 ? 'excellent' : healthScore >= 70 ? 'good' : 'warning'}`}>
          <span className="health-label">System Health</span>
          <span className="health-value">{healthScore}%</span>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-header">
            <FiCpu className="metric-icon" />
            <span className="metric-title">Total DEACs</span>
          </div>
          <div className="metric-value">{metrics.totalDeacs}</div>
          <div className="metric-subtitle">Active: {metrics.activeDeacs}</div>
        </div>

        <div className="metric-card success">
          <div className="metric-header">
            <FiMessageCircle className="metric-icon" />
            <span className="metric-title">Total Interactions</span>
          </div>
          <div className="metric-value">{metrics.totalInteractions.toLocaleString()}</div>
          <div className="metric-subtitle">
            Avg: {metrics.totalDeacs > 0 ? Math.round(metrics.totalInteractions / metrics.totalDeacs) : 0} per DEAC
          </div>
        </div>

        <div className="metric-card evolution">
          <div className="metric-header">
            <FiZap className="metric-icon" />
            <span className="metric-title">Evolution Steps</span>
          </div>
          <div className="metric-value">{metrics.totalGenerations}</div>
          <div className="metric-subtitle">
            Avg Score: {(metrics.averageEvolutionScore * 100).toFixed(1)}%
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-header">
            <FiDatabase className="metric-icon" />
            <span className="metric-title">Models in Use</span>
          </div>
          <div className="metric-value">{metrics.modelsInUse}</div>
          <div className="metric-subtitle">Different base models</div>
        </div>

        <div className="metric-card activity">
          <div className="metric-header">
            <FiActivity className="metric-icon" />
            <span className="metric-title">Evolving Now</span>
          </div>
          <div className="metric-value">{metrics.evolvingDeacs}</div>
          <div className="metric-subtitle">Currently evolving</div>
        </div>

        <div className={`metric-card ${metrics.errorDeacs > 0 ? 'error' : 'success'}`}>
          <div className="metric-header">
            {metrics.errorDeacs > 0 ? <FiXCircle className="metric-icon" /> : <FiCheckCircle className="metric-icon" />}
            <span className="metric-title">System Status</span>
          </div>
          <div className="metric-value">{metrics.errorDeacs}</div>
          <div className="metric-subtitle">
            {metrics.errorDeacs > 0 ? 'DEACs with errors' : 'All systems healthy'}
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="alerts-section">
          <h4>System Alerts</h4>
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-item ${getAlertClass(alert.type)}`}>
                <div className="alert-icon">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="alert-content">
                  <span className="alert-message">{alert.message}</span>
                  {alert.count && (
                    <span className="alert-count">{alert.count}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlTowerMetrics; 