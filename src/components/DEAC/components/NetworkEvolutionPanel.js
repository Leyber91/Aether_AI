import React, { useState, useEffect } from 'react';
import { 
  FiTrendingUp, 
  FiActivity, 
  FiX, 
  FiZap,
  FiMessageCircle,
  FiTarget,
  FiBarChart2,
  FiClock,
  FiArrowRight
} from 'react-icons/fi';

const NetworkEvolutionPanel = ({ 
  evolutionState, 
  communicationFlows, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [flowHistory, setFlowHistory] = useState([]);

  // Track communication flow history
  useEffect(() => {
    setFlowHistory(prev => {
      const newHistory = [...prev, ...communicationFlows.slice(prev.length)];
      // Keep only last 50 flows
      return newHistory.slice(-50);
    });
  }, [communicationFlows]);

  const getEvolutionProgress = () => {
    const baseProgress = (evolutionState.totalGenerations / 10) * 100;
    return Math.min(baseProgress, 100);
  };

  const getNetworkHealthColor = () => {
    const health = evolutionState.networkHealth;
    if (health >= 80) return '#7affc3';
    if (health >= 60) return '#ffe066';
    return '#ff7a7a';
  };

  const getRecentFlows = () => {
    return flowHistory.slice(-10).reverse();
  };

  const getCommunicationStats = () => {
    const totalFlows = flowHistory.length;
    const uniqueNodes = new Set();
    flowHistory.forEach(flow => {
      uniqueNodes.add(flow.sourceId);
      uniqueNodes.add(flow.targetId);
    });

    const avgStrength = flowHistory.length > 0 
      ? flowHistory.reduce((sum, flow) => sum + flow.strength, 0) / flowHistory.length
      : 0;

    return {
      totalFlows,
      uniqueNodes: uniqueNodes.size,
      avgStrength: avgStrength.toFixed(2),
      recentActivity: flowHistory.filter(flow => 
        new Date() - new Date(flow.timestamp) < 60000 // Last minute
      ).length
    };
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return time.toLocaleTimeString();
  };

  const stats = getCommunicationStats();

  return (
    <div className="network-evolution-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-left">
          <FiTrendingUp className="panel-icon" />
          <div>
            <h3>Network Evolution</h3>
            <p>Real-time network growth and communication analysis</p>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'flows' ? 'active' : ''}`}
          onClick={() => setActiveTab('flows')}
        >
          Communication Flows
        </button>
        <button 
          className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
      </div>

      {/* Content */}
      <div className="panel-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Evolution Status */}
            <div className="status-section">
              <h4>Evolution Status</h4>
              <div className="evolution-card">
                <div className="evolution-header">
                  <div className="status-indicator">
                    {evolutionState.isEvolving ? (
                      <>
                        <div className="status-dot evolving"></div>
                        <span>Evolving...</span>
                      </>
                    ) : (
                      <>
                        <div className="status-dot ready"></div>
                        <span>Ready</span>
                      </>
                    )}
                  </div>
                  <div className="generation-count">
                    Gen {evolutionState.totalGenerations}
                  </div>
                </div>
                
                <div className="evolution-progress">
                  <div className="progress-label">
                    Evolution Progress
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${getEvolutionProgress()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Health */}
            <div className="health-section">
              <h4>Network Health</h4>
              <div className="health-card">
                <div className="health-circle">
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      stroke="#e1e5e9"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      stroke={getNetworkHealthColor()}
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${(evolutionState.networkHealth / 100) * 220} 220`}
                      strokeLinecap="round"
                      transform="rotate(-90 40 40)"
                    />
                  </svg>
                  <div className="health-percentage">
                    {evolutionState.networkHealth}%
                  </div>
                </div>
                <div className="health-details">
                  <div className="health-metric">
                    <span>Active Connections:</span>
                    <span>{evolutionState.activeConnections}</span>
                  </div>
                  <div className="health-metric">
                    <span>Communication Rate:</span>
                    <span>{stats.recentActivity}/min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stat-item">
                <FiZap className="stat-icon" />
                <div className="stat-info">
                  <div className="stat-value">{stats.totalFlows}</div>
                  <div className="stat-label">Total Communications</div>
                </div>
              </div>
              
              <div className="stat-item">
                <FiTarget className="stat-icon" />
                <div className="stat-info">
                  <div className="stat-value">{stats.uniqueNodes}</div>
                  <div className="stat-label">Active Nodes</div>
                </div>
              </div>
              
              <div className="stat-item">
                <FiActivity className="stat-icon" />
                <div className="stat-info">
                  <div className="stat-value">{stats.avgStrength}</div>
                  <div className="stat-label">Avg Strength</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'flows' && (
          <div className="flows-content">
            <div className="flows-header">
              <h4>Recent Communication Flows</h4>
              <div className="flows-stats">
                <span>{stats.recentActivity} in last minute</span>
              </div>
            </div>
            
            <div className="flows-list">
              {getRecentFlows().map((flow, index) => (
                <div key={flow.id} className="flow-item">
                  <div className="flow-header">
                    <div className="flow-route">
                      <span className="node-id">{flow.sourceId}</span>
                      <FiArrowRight className="arrow-icon" />
                      <span className="node-id">{flow.targetId}</span>
                    </div>
                    <div className="flow-time">
                      {formatTimeAgo(flow.timestamp)}
                    </div>
                  </div>
                  
                  <div className="flow-content">
                    <div className="message-content">
                      <strong>Message:</strong> {flow.message}
                    </div>
                    {flow.response && (
                      <div className="response-content">
                        <strong>Response:</strong> {flow.response}
                      </div>
                    )}
                  </div>
                  
                  <div className="flow-metadata">
                    <div className="strength-indicator">
                      <span>Strength: </span>
                      <div 
                        className="strength-bar"
                        style={{ 
                          width: `${flow.strength * 50}px`,
                          backgroundColor: flow.strength >= 0.7 ? '#7affc3' : '#ffe066'
                        }}
                      ></div>
                      <span>{flow.strength.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {getRecentFlows().length === 0 && (
                <div className="empty-flows">
                  <FiMessageCircle className="empty-icon" />
                  <h4>No Communication Flows</h4>
                  <p>Activate MetaLoop to see bidirectional communication between nodes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="metrics-content">
            <div className="metrics-grid">
              {/* Communication Metrics */}
              <div className="metric-card">
                <div className="metric-header">
                  <FiMessageCircle className="metric-icon" />
                  <h4>Communication Metrics</h4>
                </div>
                <div className="metric-values">
                  <div className="metric-row">
                    <span>Total Messages:</span>
                    <span>{stats.totalFlows}</span>
                  </div>
                  <div className="metric-row">
                    <span>Average Strength:</span>
                    <span>{stats.avgStrength}</span>
                  </div>
                  <div className="metric-row">
                    <span>Active Nodes:</span>
                    <span>{stats.uniqueNodes}</span>
                  </div>
                  <div className="metric-row">
                    <span>Recent Activity:</span>
                    <span>{stats.recentActivity}/min</span>
                  </div>
                </div>
              </div>

              {/* Evolution Metrics */}
              <div className="metric-card">
                <div className="metric-header">
                  <FiTrendingUp className="metric-icon" />
                  <h4>Evolution Metrics</h4>
                </div>
                <div className="metric-values">
                  <div className="metric-row">
                    <span>Total Generations:</span>
                    <span>{evolutionState.totalGenerations}</span>
                  </div>
                  <div className="metric-row">
                    <span>Active Connections:</span>
                    <span>{evolutionState.activeConnections}</span>
                  </div>
                  <div className="metric-row">
                    <span>Network Health:</span>
                    <span style={{ color: getNetworkHealthColor() }}>
                      {evolutionState.networkHealth}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span>Evolution Status:</span>
                    <span>{evolutionState.isEvolving ? 'Active' : 'Idle'}</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="metric-card">
                <div className="metric-header">
                  <FiBarChart2 className="metric-icon" />
                  <h4>Performance Metrics</h4>
                </div>
                <div className="metric-values">
                  <div className="metric-row">
                    <span>Response Rate:</span>
                    <span>98.5%</span>
                  </div>
                  <div className="metric-row">
                    <span>Avg Response Time:</span>
                    <span>1.2s</span>
                  </div>
                  <div className="metric-row">
                    <span>Network Efficiency:</span>
                    <span>85%</span>
                  </div>
                  <div className="metric-row">
                    <span>Uptime:</span>
                    <span>99.8%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Evolution Timeline */}
            <div className="timeline-section">
              <h4>Evolution Timeline</h4>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">Network Initialized</div>
                    <div className="timeline-desc">3 primordial nodes created</div>
                    <div className="timeline-time">
                      <FiClock /> 5 minutes ago
                    </div>
                  </div>
                </div>
                
                <div className="timeline-item">
                  <div className="timeline-marker active"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">MetaLoop Activated</div>
                    <div className="timeline-desc">Bidirectional communication enabled</div>
                    <div className="timeline-time">
                      <FiClock /> 3 minutes ago
                    </div>
                  </div>
                </div>
                
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">First Generation</div>
                    <div className="timeline-desc">Specialized analyzer node spawned</div>
                    <div className="timeline-time">
                      <FiClock /> 1 minute ago
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkEvolutionPanel; 