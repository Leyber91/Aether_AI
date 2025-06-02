import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiPlus, 
  FiCpu, 
  FiActivity, 
  FiBrain, 
  FiUsers, 
  FiSettings, 
  FiTrash2, 
  FiMessageCircle,
  FiZap,
  FiBarChart3,
  FiPlay,
  FiPause,
  FiRefreshCw
} from 'react-icons/fi';
import './DEAC.css';
import DEACCard from './components/DEACCard';
import CreateDEACModal from './components/CreateDEACModal';
import DEACInteractionPanel from './components/DEACInteractionPanel';
import SystemStatusPanel from './components/SystemStatusPanel';

/**
 * Main DEAC Component - Dynamic Evolving AI Conglomerates
 * Manages the creation, interaction, and monitoring of DEACs
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

  // API Base URL
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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
      } else {
        throw new Error('Failed to fetch DEACs');
      }
    } catch (err) {
      console.error('Error fetching DEACs:', err);
      setError('Failed to load DEACs');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE]);

  /**
   * Create a new DEAC
   */
  const createDeac = async (deacConfig) => {
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
  };

  /**
   * Delete a DEAC
   */
  const deleteDeac = async (deacId) => {
    if (!window.confirm('Are you sure you want to delete this DEAC? This action cannot be undone.')) {
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
  };

  /**
   * Interact with a DEAC
   */
  const interactWithDeac = (deac) => {
    setSelectedDeac(deac);
    setShowInteractionPanel(true);
  };

  /**
   * Trigger evolution for a DEAC
   */
  const evolveDeac = async (deacId) => {
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
  };

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

  return (
    <div className="deac-container">
      {/* Header Section */}
      <div className="deac-header">
        <div className="deac-title-section">
          <FiCpu className="deac-main-icon" />
          <div>
            <h1>Dynamic Evolving AI Conglomerates</h1>
            <p>Create, manage, and interact with autonomous AI entities that learn and evolve</p>
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

      {/* Main Content */}
      <div className="deac-main-content">
        {/* DEACs Grid */}
        <div className="deac-grid-section">
          <div className="section-header">
            <h2>
              <FiActivity className="section-icon" />
              Active DEACs ({deacs.length})
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
          ) : deacs.length === 0 ? (
            <div className="empty-state">
              <FiCpu className="empty-state-icon" />
              <h3>No DEACs Created</h3>
              <p>Create your first Dynamic Evolving AI Conglomerate to get started</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
                disabled={!systemStatus?.available}
              >
                <FiPlus /> Create First DEAC
              </button>
            </div>
          ) : (
            <div className="deac-grid">
              {deacs.map((deac) => (
                <DEACCard
                  key={deac.id}
                  deac={deac}
                  onInteract={interactWithDeac}
                  onEvolve={evolveDeac}
                  onDelete={deleteDeac}
                />
              ))}
            </div>
          )}
        </div>
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