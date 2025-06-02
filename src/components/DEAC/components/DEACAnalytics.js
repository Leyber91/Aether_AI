import React from 'react';
import { 
  FiPieChart, 
  FiBarChart2, 
  FiTrendingUp, 
  FiActivity, 
  FiZap,
  FiMessageCircle,
  FiCpu,
  FiDatabase
} from 'react-icons/fi';

/**
 * DEACAnalytics - Analytics and charts for DEAC system
 */
const DEACAnalytics = ({ deacs, systemMetrics }) => {
  if (!deacs || deacs.length === 0) {
    return (
      <div className="analytics-container">
        <div className="analytics-empty">
          <FiPieChart className="analytics-empty-icon" />
          <h3>No Analytics Available</h3>
          <p>Create some DEACs to see analytics and insights.</p>
        </div>
      </div>
    );
  }

  // Calculate analytics data
  const statusDistribution = deacs.reduce((acc, deac) => {
    const status = deac.state || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const modelDistribution = deacs.reduce((acc, deac) => {
    const model = deac.base_model || 'unknown';
    acc[model] = (acc[model] || 0) + 1;
    return acc;
  }, {});

  const evolutionData = deacs.map(deac => ({
    name: deac.name,
    generations: deac.evolution_generations || 0,
    score: (deac.evolution_score || 0) * 100,
    interactions: deac.total_interactions || 0
  })).sort((a, b) => b.generations - a.generations);

  const interactionData = deacs.map(deac => ({
    name: deac.name,
    interactions: deac.total_interactions || 0,
    created: new Date(deac.created_at || Date.now())
  })).sort((a, b) => b.interactions - a.interactions);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return '#2ed573';
      case 'thinking': return '#ff9f43';
      case 'evolving': return '#8e44ad';
      case 'error': return '#ff4757';
      case 'paused': return '#747d8c';
      default: return '#b4b7c9';
    }
  };

  const getModelColor = (index) => {
    const colors = ['#4facfe', '#00f2fe', '#2ed573', '#ff9f43', '#8e44ad', '#ff4757'];
    return colors[index % colors.length];
  };

  const StatusChart = () => {
    const total = Object.values(statusDistribution).reduce((sum, count) => sum + count, 0);
    
    return (
      <div className="chart-container">
        <div className="chart-header">
          <FiActivity className="chart-icon" />
          <h4>DEAC Status Distribution</h4>
        </div>
        <div className="pie-chart">
          {Object.entries(statusDistribution).map(([status, count], index) => {
            const percentage = (count / total) * 100;
            return (
              <div key={status} className="chart-item">
                <div 
                  className="status-bar" 
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: getStatusColor(status)
                  }}
                />
                <div className="chart-label">
                  <span className="status-name">{status}</span>
                  <span className="status-count">{count} ({percentage.toFixed(1)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ModelChart = () => {
    const total = Object.values(modelDistribution).reduce((sum, count) => sum + count, 0);
    
    return (
      <div className="chart-container">
        <div className="chart-header">
          <FiCpu className="chart-icon" />
          <h4>Model Distribution</h4>
        </div>
        <div className="model-chart">
          {Object.entries(modelDistribution).map(([model, count], index) => {
            const percentage = (count / total) * 100;
            return (
              <div key={model} className="chart-item">
                <div 
                  className="model-bar" 
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: getModelColor(index)
                  }}
                />
                <div className="chart-label">
                  <span className="model-name">{model}</span>
                  <span className="model-count">{count} DEACs ({percentage.toFixed(1)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const EvolutionChart = () => {
    const maxGenerations = Math.max(...evolutionData.map(d => d.generations), 1);
    
    return (
      <div className="chart-container">
        <div className="chart-header">
          <FiZap className="chart-icon" />
          <h4>Evolution Progress</h4>
        </div>
        <div className="evolution-chart">
          {evolutionData.slice(0, 10).map((deac, index) => (
            <div key={deac.name} className="evolution-item">
              <div className="evolution-label">
                <span className="deac-name">{deac.name.slice(0, 20)}...</span>
                <span className="evolution-stats">
                  Gen {deac.generations} | {deac.score.toFixed(1)}%
                </span>
              </div>
              <div className="evolution-bars">
                <div 
                  className="generation-bar"
                  style={{ 
                    width: `${(deac.generations / maxGenerations) * 100}%`,
                    backgroundColor: '#8e44ad'
                  }}
                />
                <div 
                  className="score-bar"
                  style={{ 
                    width: `${deac.score}%`,
                    backgroundColor: '#4facfe'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const InteractionChart = () => {
    const maxInteractions = Math.max(...interactionData.map(d => d.interactions), 1);
    
    return (
      <div className="chart-container">
        <div className="chart-header">
          <FiMessageCircle className="chart-icon" />
          <h4>Top Interactions</h4>
        </div>
        <div className="interaction-chart">
          {interactionData.slice(0, 10).map((deac, index) => (
            <div key={deac.name} className="interaction-item">
              <div className="interaction-label">
                <span className="deac-name">{deac.name.slice(0, 25)}...</span>
                <span className="interaction-count">{deac.interactions}</span>
              </div>
              <div 
                className="interaction-bar"
                style={{ 
                  width: `${(deac.interactions / maxInteractions) * 100}%`,
                  backgroundColor: '#2ed573'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <FiBarChart2 className="analytics-icon" />
        <h2>DEAC Analytics Dashboard</h2>
      </div>

      <div className="analytics-summary">
        <div className="summary-card">
          <FiTrendingUp className="summary-icon" />
          <div className="summary-content">
            <span className="summary-value">{systemMetrics?.totalInteractions || 0}</span>
            <span className="summary-label">Total Interactions</span>
          </div>
        </div>
        <div className="summary-card">
          <FiZap className="summary-icon" />
          <div className="summary-content">
            <span className="summary-value">{systemMetrics?.totalGenerations || 0}</span>
            <span className="summary-label">Evolution Steps</span>
          </div>
        </div>
        <div className="summary-card">
          <FiDatabase className="summary-icon" />
          <div className="summary-content">
            <span className="summary-value">{(systemMetrics?.averageEvolutionScore * 100 || 0).toFixed(1)}%</span>
            <span className="summary-label">Avg Evolution Score</span>
          </div>
        </div>
        <div className="summary-card">
          <FiCpu className="summary-icon" />
          <div className="summary-content">
            <span className="summary-value">{systemMetrics?.modelsInUse || 0}</span>
            <span className="summary-label">Models in Use</span>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="charts-row">
          <StatusChart />
          <ModelChart />
        </div>
        <div className="charts-row">
          <EvolutionChart />
          <InteractionChart />
        </div>
      </div>

      <div className="analytics-insights">
        <div className="insights-header">
          <h4>System Insights</h4>
        </div>
        <div className="insights-list">
          {systemMetrics?.errorDeacs > 0 && (
            <div className="insight-item warning">
              <FiActivity />
              <span>{systemMetrics.errorDeacs} DEAC(s) need attention due to error state</span>
            </div>
          )}
          {systemMetrics?.totalDeacs > 10 && (
            <div className="insight-item info">
              <FiCpu />
              <span>Large system with {systemMetrics.totalDeacs} DEACs - consider performance monitoring</span>
            </div>
          )}
          {systemMetrics?.averageEvolutionScore > 0.8 && (
            <div className="insight-item success">
              <FiZap />
              <span>Excellent evolution performance with {(systemMetrics.averageEvolutionScore * 100).toFixed(1)}% average score</span>
            </div>
          )}
          {systemMetrics?.totalInteractions === 0 && (
            <div className="insight-item info">
              <FiMessageCircle />
              <span>Start interacting with your DEACs to see engagement analytics</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DEACAnalytics; 