import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiPlus, 
  FiCpu, 
  FiActivity, 
  FiDatabase, 
  FiUsers, 
  FiSettings, 
  FiTrash2, 
  FiMessageCircle,
  FiZap,
  FiBarChart2,
  FiPlay,
  FiPause,
  FiRefreshCw,
  FiFilter,
  FiSearch,
  FiDownload,
  FiUpload,
  FiAlertTriangle,
  FiTrendingUp,
  FiClock,
  FiTarget,
  FiGrid,
  FiList,
  FiEye,
  FiPieChart
} from 'react-icons/fi';
import './DEAC.css';
import DEACCard from './components/DEACCard';
import CreateDEACModal from './components/CreateDEACModal';
import DEACInteractionPanel from './components/DEACInteractionPanel';
import SystemStatusPanel from './components/SystemStatusPanel';
import DEACAnalytics from './components/DEACAnalytics';
import ControlTowerMetrics from './components/ControlTowerMetrics';

/**
 * Main DEAC Component - Dynamic Evolving AI Conglomerates Control Tower
 * Comprehensive management and monitoring of DEACs
 */
const DEAC = () => {
  // State management
  const [deacs, setDeacs] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDeac, setSelectedDeac] = useState(null);
  const [showInteractionPanel, setShowInteractionPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Control Tower Features
  const [viewMode, setViewMode] = useState('grid'); // grid, list, analytics
  const [filterStatus, setFilterStatus] = useState('all'); // all, ready, thinking, evolving, error
  const [sortBy, setSortBy] = useState('created'); // created, name, interactions, evolution
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeacs, setSelectedDeacs] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // API Base URL
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  /**
   * Calculate system-wide metrics
   */
  const calculateSystemMetrics = useCallback((deacsList) => {
    const metrics = {
      totalDeacs: deacsList.length,
      activeDeacs: deacsList.filter(d => d.state === 'ready').length,
      evolvingDeacs: deacsList.filter(d => d.state === 'evolving').length,
      totalInteractions: deacsList.reduce((sum, d) => sum + (d.total_interactions || 0), 0),
      totalGenerations: deacsList.reduce((sum, d) => sum + (d.evolution_generations || 0), 0),
      averageEvolutionScore: deacsList.length > 0 ? 
        deacsList.reduce((sum, d) => sum + (d.evolution_score || 0), 0) / deacsList.length : 0,
      modelsInUse: [...new Set(deacsList.map(d => d.base_model))].length,
      healthyDeacs: deacsList.filter(d => d.state !== 'error').length,
      errorDeacs: deacsList.filter(d => d.state === 'error').length,
    };
    
    setSystemMetrics(metrics);
  }, []);

  /**
   * Check for system alerts
   */
  const checkSystemAlerts = useCallback((deacsList) => {
    const newAlerts = [];
    
    // Error DEACs
    const errorDeacs = deacsList.filter(d => d.state === 'error');
    if (errorDeacs.length > 0) {
      newAlerts.push({
        id: 'error-deacs',
        type: 'error',
        message: `${errorDeacs.length} DEAC(s) in error state`,
        count: errorDeacs.length
      });
    }
    
    // High evolution DEACs (might need attention)
    const highEvolutionDeacs = deacsList.filter(d => d.evolution_generations > 40);
    if (highEvolutionDeacs.length > 0) {
      newAlerts.push({
        id: 'high-evolution',
        type: 'warning',
        message: `${highEvolutionDeacs.length} DEAC(s) with high evolution count`,
        count: highEvolutionDeacs.length
      });
    }
    
    // System overload
    if (deacsList.length > 20) {
      newAlerts.push({
        id: 'system-load',
        type: 'info',
        message: `Managing ${deacsList.length} DEACs - consider system optimization`,
        count: deacsList.length
      });
    }
    
    setAlerts(newAlerts);
  }, []);

  /**
   * Fetch system status
   */
  const fetchSystemStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/deac/system/status`);
      if (response.ok) {
        const status = await response.json();
        setSystemStatus(status);
      } else {
        throw new Error('Failed to fetch system status');
      }
    } catch (err) {
      console.error('Error fetching system status:', err);
      setError('Failed to connect to DEAC system');
    }
  }, [API_BASE]);

  /**
   * Fetch all DEACs
   */
  const fetchDeacs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/deac/list`);
      if (response.ok) {
        const data = await response.json();
        setDeacs(data.deacs || []);
        
        // Calculate system metrics
        calculateSystemMetrics(data.deacs || []);
        
        // Check for alerts
        checkSystemAlerts(data.deacs || []);
      } else {
        throw new Error('Failed to fetch DEACs');
      }
    } catch (err) {
      console.error('Error fetching DEACs:', err);
      setError('Failed to load DEACs');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, calculateSystemMetrics, checkSystemAlerts]);

  /**
   * Filter and sort DEACs
   */
  const getFilteredAndSortedDeacs = useCallback(() => {
    let filtered = deacs;
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(deac => deac.state === filterStatus);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(deac => 
        deac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deac.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deac.base_model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'interactions':
          return (b.total_interactions || 0) - (a.total_interactions || 0);
        case 'evolution':
          return (b.evolution_generations || 0) - (a.evolution_generations || 0);
        case 'created':
        default:
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });
    
    return filtered;
  }, [deacs, filterStatus, searchTerm, sortBy]);

  /**
   * Create a new DEAC
   */
  const createDeac = useCallback(async (deacConfig) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/deac/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deacConfig),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await fetchDeacs(); // Refresh the list
          setShowCreateModal(false);
          return { success: true, message: 'DEAC created successfully!' };
        } else {
          throw new Error(result.message || 'Failed to create DEAC');
        }
      } else {
        throw new Error('Failed to create DEAC');
      }
    } catch (err) {
      console.error('Error creating DEAC:', err);
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, fetchDeacs]);

  /**
   * Trigger evolution for a DEAC
   */
  const evolveDeac = useCallback(async (deacId) => {
    try {
      const response = await fetch(`${API_BASE}/deac/${deacId}/evolve`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchDeacs(); // Refresh to show updated evolution data
        return { success: true };
      } else {
        throw new Error('Failed to trigger evolution');
      }
    } catch (err) {
      console.error('Error evolving DEAC:', err);
      return { success: false, message: err.message };
    }
  }, [API_BASE, fetchDeacs]);

  /**
   * Bulk operations
   */
  const handleBulkEvolution = useCallback(async () => {
    if (selectedDeacs.length === 0) return;
    
    const results = await Promise.all(
      selectedDeacs.map(id => evolveDeac(id))
    );
    
    const successful = results.filter(r => r.success).length;
    alert(`Evolution triggered for ${successful}/${selectedDeacs.length} DEACs`);
    setSelectedDeacs([]);
  }, [selectedDeacs, evolveDeac]);

  /**
   * Delete a DEAC
   */
  const deleteDeac = useCallback(async (deacId) => {
    if (!selectedDeacs.includes(deacId) && 
        !window.confirm('Are you sure you want to delete this DEAC? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/deac/${deacId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchDeacs(); // Refresh the list
        if (selectedDeac && selectedDeac.id === deacId) {
          setSelectedDeac(null);
          setShowInteractionPanel(false);
        }
      } else {
        throw new Error('Failed to delete DEAC');
      }
    } catch (err) {
      console.error('Error deleting DEAC:', err);
      setError('Failed to delete DEAC');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, fetchDeacs, selectedDeacs, selectedDeac]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedDeacs.length === 0) return;
    
    if (!window.confirm(`Delete ${selectedDeacs.length} selected DEACs? This cannot be undone.`)) {
      return;
    }
    
    for (const deacId of selectedDeacs) {
      await deleteDeac(deacId);
    }
    
    setSelectedDeacs([]);
  }, [selectedDeacs, deleteDeac]);

  /**
   * Interact with a DEAC
   */
  const interactWithDeac = useCallback((deac) => {
    setSelectedDeac(deac);
    setShowInteractionPanel(true);
  }, []);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchSystemStatus();
      await fetchDeacs();
    };

    loadInitialData();
  }, [fetchSystemStatus, fetchDeacs]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSystemStatus();
      fetchDeacs();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSystemStatus, fetchDeacs]);

  const filteredDeacs = getFilteredAndSortedDeacs();

  return (
    <div className="deac-container">
      {/* Header Section */}
      <div className="deac-header">
        <div className="deac-title-section">
          <FiCpu className="deac-main-icon" />
          <div>
            <h1>DEAC Control Tower</h1>
            <p>Comprehensive management and monitoring of Dynamic Evolving AI Conglomerates</p>
          </div>
        </div>
        
        <div className="deac-header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            disabled={!systemStatus?.available}
          >
            <FiPlus /> Create DEAC
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <FiBarChart2 /> Analytics
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => { fetchSystemStatus(); fetchDeacs(); }}
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* System Status Panel */}
      <SystemStatusPanel 
        status={systemStatus} 
        isLoading={isLoading}
        error={error}
      />

      {/* Control Tower Metrics */}
      {systemMetrics && (
        <ControlTowerMetrics 
          metrics={systemMetrics}
          alerts={alerts}
        />
      )}

      {/* Control Panel */}
      <div className="control-panel">
        <div className="control-panel-left">
          <div className="search-filter-section">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search DEACs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="ready">Ready</option>
              <option value="thinking">Thinking</option>
              <option value="evolving">Evolving</option>
              <option value="error">Error</option>
              <option value="paused">Paused</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="created">Sort by Created</option>
              <option value="name">Sort by Name</option>
              <option value="interactions">Sort by Interactions</option>
              <option value="evolution">Sort by Evolution</option>
            </select>
          </div>
        </div>
        
        <div className="control-panel-right">
          <div className="view-mode-toggle">
            <button 
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <FiGrid />
            </button>
            <button 
              className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <FiList />
            </button>
            <button 
              className={`btn-icon ${viewMode === 'analytics' ? 'active' : ''}`}
              onClick={() => setViewMode('analytics')}
              title="Analytics View"
            >
              <FiPieChart />
            </button>
          </div>
          
          {selectedDeacs.length > 0 && (
            <div className="bulk-actions">
              <span className="selected-count">{selectedDeacs.length} selected</span>
              <button className="btn btn-secondary" onClick={handleBulkEvolution}>
                <FiZap /> Evolve All
              </button>
              <button className="btn btn-danger" onClick={handleBulkDelete}>
                <FiTrash2 /> Delete All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="deac-main-content">
        {viewMode === 'analytics' ? (
          <DEACAnalytics 
            deacs={deacs}
            systemMetrics={systemMetrics}
          />
        ) : (
          <div className="deac-grid-section">
            <div className="section-header">
              <h2>
                <FiActivity className="section-icon" />
                {filterStatus === 'all' ? 'All DEACs' : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} DEACs`} ({filteredDeacs.length})
              </h2>
            </div>

            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading DEACs...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p>{error}</p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => { setError(null); fetchDeacs(); }}
                >
                  Retry
                </button>
              </div>
            ) : filteredDeacs.length === 0 ? (
              <div className="empty-state">
                <FiCpu className="empty-state-icon" />
                <h3>{deacs.length === 0 ? 'No DEACs Created' : 'No DEACs Match Filter'}</h3>
                <p>
                  {deacs.length === 0 
                    ? 'Create your first Dynamic Evolving AI Conglomerate to get started'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {deacs.length === 0 && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                    disabled={!systemStatus?.available}
                  >
                    <FiPlus /> Create First DEAC
                  </button>
                )}
              </div>
            ) : (
              <div className={`deac-${viewMode}`}>
                {filteredDeacs.map((deac) => (
                  <DEACCard
                    key={deac.id}
                    deac={deac}
                    onInteract={interactWithDeac}
                    onEvolve={evolveDeac}
                    onDelete={deleteDeac}
                    isSelected={selectedDeacs.includes(deac.id)}
                    onSelect={(id, selected) => {
                      if (selected) {
                        setSelectedDeacs(prev => [...prev, id]);
                      } else {
                        setSelectedDeacs(prev => prev.filter(x => x !== id));
                      }
                    }}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateDEACModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={createDeac}
          systemStatus={systemStatus}
        />
      )}

      {showInteractionPanel && selectedDeac && (
        <DEACInteractionPanel
          isOpen={showInteractionPanel}
          deac={selectedDeac}
          onClose={() => setShowInteractionPanel(false)}
          apiBase={API_BASE}
        />
      )}
    </div>
  );
};

export default DEAC; 