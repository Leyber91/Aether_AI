import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiSend, FiZap, FiActivity, FiArrowRight } from 'react-icons/fi';
import '../styles/shared/Buttons.css';
import '../styles/shared/StatusDots.css';
import './MetaLoopCommunicationPanel.css';

/**
 * MetaLoopCommunicationPanel - Real-time communication viewer
 * Shows network interactions, MetaLoop messages, and evolution events
 */
const MetaLoopCommunicationPanel = ({ communicationLog, onSendMessage }) => {
  const [messageInput, setMessageInput] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('broadcast');
  const [filterType, setFilterType] = useState('all');
  const logContainerRef = useRef(null);

  // Auto-scroll to latest messages
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [communicationLog]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    onSendMessage(selectedTarget, messageInput);
    setMessageInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'metaloop': return FiZap;
      case 'spawn': return FiActivity;
      case 'evolution': return FiActivity;
      case 'system': return FiMessageCircle;
      default: return FiMessageCircle;
    }
  };

  const getMessageTypeClass = (type) => {
    switch (type) {
      case 'metaloop': return 'metaloop-message';
      case 'spawn': return 'spawn-message';
      case 'evolution': return 'evolution-message';
      case 'system': return 'system-message';
      default: return 'default-message';
    }
  };

  const filteredMessages = communicationLog.filter(message => {
    if (filterType === 'all') return true;
    return message.type === filterType;
  });

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="metaloop-communication-panel">
      
      {/* Panel Header */}
      <div className="communication-header">
        <div className="header-info">
          <FiMessageCircle className="panel-icon" />
          <div>
            <h3>MetaLoop Communications</h3>
            <span className="communication-subtitle">
              {filteredMessages.length} messages • Real-time network activity
            </span>
          </div>
        </div>
        
        {/* Message Filter */}
        <div className="message-filters">
          {['all', 'metaloop', 'spawn', 'evolution', 'system'].map(type => (
            <button
              key={type}
              className={`filter-btn ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Communication Log */}
      <div className="communication-content">
        <div className="messages-container" ref={logContainerRef}>
          {filteredMessages.length === 0 ? (
            <div className="empty-messages">
              <FiZap className="empty-icon" />
              <p>No communications yet. Activate MetaLoop to see network activity.</p>
            </div>
          ) : (
            filteredMessages.map((message, index) => {
              const MessageIcon = getMessageIcon(message.type);
              return (
                <div key={index} className={`message-item ${getMessageTypeClass(message.type)}`}>
                  
                  {/* Message Header */}
                  <div className="message-header">
                    <div className="message-flow">
                      <span className="message-source">{message.source}</span>
                      <FiArrowRight className="flow-arrow" />
                      <span className="message-target">{message.target}</span>
                    </div>
                    <div className="message-meta">
                      <MessageIcon className="message-type-icon" />
                      <span className="message-time">{formatTimestamp(message.timestamp)}</span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="message-content">
                    {message.message}
                  </div>

                  {/* Message Type Badge */}
                  <div className={`message-type-badge ${message.type}`}>
                    {message.type}
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="message-input-section">
        <div className="input-controls">
          
          {/* Target Selection */}
          <div className="target-selection">
            <label>Send to:</label>
            <select 
              value={selectedTarget} 
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="target-select"
            >
              <option value="broadcast">Broadcast</option>
              <option value="genesis-1">Genesis Alpha</option>
              <option value="genesis-2">Genesis Beta</option>
              <option value="genesis-3">Genesis Gamma</option>
            </select>
          </div>

          {/* Message Input */}
          <div className="message-input-container">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Send a message to the network..."
              className="message-input"
              rows={2}
            />
            <button 
              className="cell-btn cell-btn--primary send-btn"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <FiSend />
            </button>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button 
            className="cell-btn cell-btn--secondary cell-btn--compact"
            onClick={() => setMessageInput('Status report')}
          >
            Status Report
          </button>
          <button 
            className="cell-btn cell-btn--secondary cell-btn--compact"
            onClick={() => setMessageInput('Initiate collaboration protocol')}
          >
            Collaboration
          </button>
          <button 
            className="cell-btn cell-btn--secondary cell-btn--compact"
            onClick={() => setMessageInput('Request capability analysis')}
          >
            Analysis
          </button>
        </div>
      </div>

      {/* Communication Stats */}
      <div className="communication-stats">
        <div className="stat-item">
          <span className="stat-label">Total Messages:</span>
          <span className="stat-value">{communicationLog.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">MetaLoop Active:</span>
          <div className="metaloop-status-indicator">
            <div className="status-dot status-dot--communicating"></div>
            <span>Active</span>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-label">Last Activity:</span>
          <span className="stat-value">
            {communicationLog.length > 0 
              ? formatTimestamp(communicationLog[0].timestamp)
              : 'None'
            }
          </span>
        </div>
      </div>

    </div>
  );
};

export default MetaLoopCommunicationPanel; 