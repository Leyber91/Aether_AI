import React, { useState, useEffect } from 'react';
import { FiZap, FiArrowRight } from 'react-icons/fi';
import './MetaLoopChannel.css';

/**
 * MetaLoopChannel - Bidirectional communication cell
 * Handles message flow between two network nodes
 */
const MetaLoopChannel = ({ 
  sourceId, 
  targetId, 
  strength = 0.5,
  isActive = false,
  onMessage,
  children 
}) => {
  const [messageFlow, setMessageFlow] = useState([]);
  const [isTransmitting, setIsTransmitting] = useState(false);

  // Handle incoming messages
  useEffect(() => {
    if (children && typeof children.message !== 'undefined') {
      setIsTransmitting(true);
      setTimeout(() => setIsTransmitting(false), 1000);
      
      setMessageFlow(prev => [...prev.slice(-4), {
        id: Date.now(),
        content: children.message,
        timestamp: new Date()
      }]);
    }
  }, [children]);

  const sendMessage = (content) => {
    const message = {
      sourceId,
      targetId,
      content,
      strength,
      timestamp: new Date()
    };
    
    onMessage?.(message);
  };

  const channelClass = `metaloop-channel ${isActive ? 'active' : 'idle'} ${isTransmitting ? 'transmitting' : ''}`;

  return (
    <div className={channelClass}>
      {/* Channel Connection Line */}
      <div className="channel-line">
        <div 
          className="strength-indicator"
          style={{ width: `${strength * 100}%` }}
        ></div>
      </div>

      {/* Source Node ID */}
      <div className="node-endpoint source">
        {sourceId}
      </div>

      {/* Direction Indicator */}
      <div className="direction-indicator">
        <FiArrowRight />
        <FiZap className={`metaloop-icon ${isActive ? 'pulsing' : ''}`} />
      </div>

      {/* Target Node ID */}
      <div className="node-endpoint target">
        {targetId}
      </div>

      {/* Message Flow Indicator */}
      {isTransmitting && (
        <div className="message-particle"></div>
      )}

      {/* Recent Messages */}
      <div className="message-history">
        {messageFlow.slice(-2).map(msg => (
          <div key={msg.id} className="message-trace">
            {msg.content.substring(0, 20)}...
          </div>
        ))}
      </div>

      {/* Channel Metrics */}
      <div className="channel-metrics">
        <span className="strength-value">{strength.toFixed(2)}</span>
        <span className="message-count">{messageFlow.length}</span>
      </div>

      {/* Dynamic Content */}
      {children}
    </div>
  );
};

export default MetaLoopChannel; 