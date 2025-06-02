import React, { useState, useEffect } from 'react';
import { 
  FiZap, 
  FiMessageCircle, 
  FiActivity, 
  FiChevronUp, 
  FiChevronDown,
  FiSend,
  FiEye,
  FiRefreshCw
} from 'react-icons/fi';

const MetaLoopController = ({ 
  isActive, 
  channels, 
  onChannelInteraction 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [channelStats, setChannelStats] = useState({
    totalChannels: 0,
    activeChannels: 0,
    totalMessages: 0,
    averageLatency: 0
  });

  // Calculate channel statistics
  useEffect(() => {
    const stats = {
      totalChannels: channels.size,
      activeChannels: Array.from(channels.values()).filter(ch => ch.isActive).length,
      totalMessages: Array.from(channels.values()).reduce((sum, ch) => sum + ch.messageQueue.length, 0),
      averageLatency: 0 // Would be calculated from actual message timings
    };
    setChannelStats(stats);
  }, [channels]);

  const handleSendMessage = async () => {
    if (!selectedChannel || !messageInput.trim()) return;
    
    const message = {
      content: messageInput,
      type: 'manual',
      timestamp: new Date()
    };
    
    if (onChannelInteraction) {
      await onChannelInteraction(selectedChannel.source, selectedChannel.target, message);
    }
    
    setMessageInput('');
  };

  const getChannelArray = () => {
    return Array.from(channels.entries()).map(([id, channel]) => ({
      id,
      ...channel
    }));
  };

  const getChannelStatus = (channel) => {
    if (channel.isActive) return 'active';
    if (channel.messageQueue.length > 0) return 'pending';
    return 'idle';
  };

  const getChannelStrengthColor = (strength) => {
    if (strength >= 0.8) return '#7affc3';
    if (strength >= 0.5) return '#ffe066';
    return '#ff7a7a';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`metaloop-controller ${isActive ? 'active' : 'inactive'}`}>
      {/* Controller Header */}
      <div 
        className="controller-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="header-left">
          <FiZap className={`metaloop-icon ${isActive ? 'pulsing' : ''}`} />
          <div className="header-info">
            <h3>MetaLoop Controller</h3>
            <div className="status-text">
              {isActive ? 'Bidirectional Communication Active' : 'Communication Inactive'}
            </div>
          </div>
        </div>
        
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{channelStats.activeChannels}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat">
            <span className="stat-value">{channelStats.totalMessages}</span>
            <span className="stat-label">Messages</span>
          </div>
          <button className="expand-btn">
            {isExpanded ? <FiChevronDown /> : <FiChevronUp />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="controller-content">
          {/* Statistics Panel */}
          <div className="stats-panel">
            <div className="stat-card">
              <FiActivity className="stat-icon" />
              <div className="stat-info">
                <div className="stat-number">{channelStats.totalChannels}</div>
                <div className="stat-description">Total Channels</div>
              </div>
            </div>
            
            <div className="stat-card">
              <FiZap className="stat-icon" />
              <div className="stat-info">
                <div className="stat-number">{channelStats.activeChannels}</div>
                <div className="stat-description">Active Channels</div>
              </div>
            </div>
            
            <div className="stat-card">
              <FiMessageCircle className="stat-icon" />
              <div className="stat-info">
                <div className="stat-number">{channelStats.totalMessages}</div>
                <div className="stat-description">Total Messages</div>
              </div>
            </div>
          </div>

          {/* Channels List */}
          <div className="channels-section">
            <div className="section-header">
              <h4>Communication Channels</h4>
              <button className="refresh-btn">
                <FiRefreshCw />
              </button>
            </div>
            
            <div className="channels-list">
              {getChannelArray().map(channel => (
                <div 
                  key={channel.id}
                  className={`channel-item ${selectedChannel?.id === channel.id ? 'selected' : ''}`}
                  onClick={() => setSelectedChannel(channel)}
                >
                  <div className="channel-info">
                    <div className="channel-route">
                      <span className="node-name">{channel.source}</span>
                      <div className="connection-line">
                        <div 
                          className="strength-indicator"
                          style={{ 
                            backgroundColor: getChannelStrengthColor(channel.strength),
                            width: `${channel.strength * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="node-name">{channel.target}</span>
                    </div>
                    
                    <div className="channel-details">
                      <div className={`status-indicator ${getChannelStatus(channel)}`}>
                        {getChannelStatus(channel)}
                      </div>
                      <div className="last-communication">
                        Last: {formatTimestamp(channel.lastCommunication)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="channel-metrics">
                    <div className="metric">
                      <span className="metric-label">Strength:</span>
                      <span className="metric-value">{channel.strength.toFixed(2)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Queue:</span>
                      <span className="metric-value">{channel.messageQueue.length}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Interaction Panel */}
          {selectedChannel && isActive && (
            <div className="interaction-panel">
              <div className="panel-header">
                <h4>
                  Channel: {selectedChannel.source} → {selectedChannel.target}
                </h4>
                <div className="channel-strength">
                  Strength: {selectedChannel.strength.toFixed(2)}
                </div>
              </div>
              
              {/* Message History */}
              <div className="message-history">
                <h5>Recent Messages</h5>
                <div className="messages-container">
                  {selectedChannel.messageQueue.slice(-5).map((msg, index) => (
                    <div key={index} className="message-item">
                      <div className="message-content">
                        {msg.message.content || JSON.stringify(msg.message)}
                      </div>
                      {msg.response && (
                        <div className="message-response">
                          → {msg.response}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {selectedChannel.messageQueue.length === 0 && (
                    <div className="no-messages">
                      No messages exchanged yet
                    </div>
                  )}
                </div>
              </div>
              
              {/* Send Message */}
              <div className="send-message">
                <div className="input-group">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Enter message to send through MetaLoop..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button 
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <FiSend />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="system-status">
            <div className="status-item">
              <span className="status-label">MetaLoop Status:</span>
              <span className={`status-value ${isActive ? 'active' : 'inactive'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="status-item">
              <span className="status-label">Network Health:</span>
              <span className="status-value">
                {channelStats.activeChannels > 0 ? 'Good' : 'Disconnected'}
              </span>
            </div>
            
            <div className="status-item">
              <span className="status-label">Communication Mode:</span>
              <span className="status-value">Bidirectional</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaLoopController; 