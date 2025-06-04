import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiSend, FiZap, FiUsers, FiTarget, FiCpu, FiActivity } from 'react-icons/fi';
import '../styles/shared/Buttons.css';
import '../styles/shared/StatusDots.css';
import './DEACChatInterface.css';

/**
 * DEACChatInterface - Living chat system integrated with DEAC network
 * Each message can trigger evolution, spawning, and network communication
 */
const DEACChatInterface = ({ 
  networkNodes, 
  selectedDEAC, 
  activeNodeChat, 
  onChatMessage, 
  onNodeSelect, 
  communicationLog 
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState('network'); // 'network' or 'direct'
  const chatContainerRef = useRef(null);

  // Auto-scroll to latest messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Switch to direct mode when a DEAC is selected
  useEffect(() => {
    if (activeNodeChat) {
      setChatMode('direct');
    }
  }, [activeNodeChat]);

  // Add communication log entries to chat history
  useEffect(() => {
    const chatRelevantTypes = ['user-chat', 'deac-response', 'network-response', 'spawn', 'evolution'];
    const newChatEntries = communicationLog
      .filter(log => chatRelevantTypes.includes(log.type))
      .slice(0, 10) // Get latest 10 entries
      .reverse(); // Reverse to show chronologically

    if (newChatEntries.length > 0) {
      setChatHistory(prev => {
        const existingTimestamps = prev.map(entry => entry.timestamp?.getTime());
        const uniqueNewEntries = newChatEntries.filter(entry => 
          !existingTimestamps.includes(entry.timestamp?.getTime())
        );
        return [...prev, ...uniqueNewEntries];
      });
    }
  }, [communicationLog]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isLoading) return;

    const message = messageInput.trim();
    setMessageInput('');
    setIsLoading(true);

    try {
      // Add user message to chat history immediately
      const userMessage = {
        type: 'user-message',
        source: 'user',
        target: chatMode === 'direct' ? activeNodeChat : 'network',
        message: message,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, userMessage]);

      // Send message through DEAC network
      const response = await onChatMessage(message, chatMode === 'direct' ? activeNodeChat : null);
      
      // Response will be added via communicationLog useEffect
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      setChatHistory(prev => [...prev, {
        type: 'error',
        source: 'system',
        target: 'user',
        message: `Error: ${error.message || 'Failed to send message'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const switchToNetworkMode = () => {
    setChatMode('network');
    onNodeSelect(null);
  };

  const switchToDirectMode = (nodeId) => {
    setChatMode('direct');
    onNodeSelect(nodeId);
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'user-message':
      case 'user-chat': 
        return FiMessageCircle;
      case 'deac-response': 
        return FiCpu;
      case 'network-response': 
        return FiUsers;
      case 'spawn': 
        return FiActivity;
      case 'evolution': 
        return FiZap;
      default: 
        return FiMessageCircle;
    }
  };

  const getMessageClass = (type, source) => {
    if (type === 'user-message' || type === 'user-chat' || source === 'user') {
      return 'user-message';
    }
    if (type === 'network-response' || source === 'network') {
      return 'network-message';
    }
    if (type === 'deac-response' || networkNodes.find(n => n.id === source)) {
      return 'deac-message';
    }
    if (type === 'spawn' || type === 'evolution') {
      return 'evolution-message';
    }
    return 'system-message';
  };

  const formatMessageContent = (entry) => {
    if (entry.type === 'spawn') {
      return `🎯 ${entry.message}`;
    }
    if (entry.type === 'evolution') {
      return `⚡ ${entry.message}`;
    }
    return entry.message;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActiveNodeInfo = () => {
    if (!activeNodeChat) return null;
    return networkNodes.find(n => n.id === activeNodeChat);
  };

  const activeNode = getActiveNodeInfo();

  return (
    <div className="deac-chat-interface">
      
      {/* Chat Header with Mode Controls */}
      <div className="chat-header">
        
        {/* Mode Switch */}
        <div className="chat-mode-controls">
          <button 
            className={`mode-btn ${chatMode === 'network' ? 'active' : ''}`}
            onClick={switchToNetworkMode}
          >
            <FiUsers className="mode-icon" />
            Network
          </button>
          <button 
            className={`mode-btn ${chatMode === 'direct' ? 'active' : ''}`}
            disabled={!activeNodeChat}
          >
            <FiTarget className="mode-icon" />
            Direct
          </button>
        </div>

        {/* Active Target Info */}
        <div className="chat-target-info">
          {chatMode === 'network' ? (
            <div className="target-display">
              <FiUsers className="target-icon" />
              <span>Broadcasting to {networkNodes.length} nodes</span>
            </div>
          ) : activeNode ? (
            <div className="target-display">
              <FiCpu className="target-icon" />
              <div className="node-info">
                <span className="node-name">{activeNode.data.name}</span>
                <span className="node-spec">{activeNode.data.specialization}</span>
              </div>
              <div className={`status-dot status-dot--${activeNode.data.state}`}></div>
            </div>
          ) : (
            <div className="target-display">
              <span className="no-target">Select a DEAC node for direct chat</span>
            </div>
          )}
        </div>

      </div>

      {/* Node Selector for Direct Mode */}
      {chatMode === 'direct' && (
        <div className="node-selector">
          {networkNodes.map(node => (
            <button
              key={node.id}
              className={`node-select-btn ${activeNodeChat === node.id ? 'active' : ''}`}
              onClick={() => switchToDirectMode(node.id)}
            >
              <div className={`status-dot status-dot--${node.data.state}`}></div>
              <span className="node-name">{node.data.name}</span>
              <span className="node-gen">Gen {node.data.evolutionGeneration}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      <div className="chat-messages" ref={chatContainerRef}>
        
        {/* Welcome Message */}
        {chatHistory.length === 0 && (
          <div className="welcome-message">
            <FiZap className="welcome-icon" />
            <h3>Welcome to DEAC Network</h3>
            <p>
              {chatMode === 'network' 
                ? "Your messages will be broadcast to all DEAC nodes in the network. They can trigger evolution, spawning, and collective intelligence."
                : activeNode 
                  ? `You're now chatting directly with ${activeNode.data.name}. This DEAC specializes in ${activeNode.data.specialization}.`
                  : "Select a DEAC node above to start a direct conversation."
              }
            </p>
            
            {/* Quick Action Suggestions */}
            <div className="quick-suggestions">
              <button 
                className="suggestion-btn"
                onClick={() => setMessageInput('What is your current status?')}
              >
                Check Status
              </button>
              <button 
                className="suggestion-btn"
                onClick={() => setMessageInput('Spawn a new analyzer node')}
              >
                Spawn Node
              </button>
              <button 
                className="suggestion-btn"
                onClick={() => setMessageInput('Evolve your capabilities')}
              >
                Trigger Evolution
              </button>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {chatHistory.map((entry, index) => {
          const MessageIcon = getMessageIcon(entry.type);
          const messageClass = getMessageClass(entry.type, entry.source);
          
          return (
            <div key={index} className={`chat-message ${messageClass}`}>
              
              {/* Message Header */}
              <div className="message-header">
                <div className="message-sender">
                  <MessageIcon className="sender-icon" />
                  <span className="sender-name">
                    {entry.source === 'user' ? 'You' :
                     entry.source === 'network' ? 'Network Collective' :
                     networkNodes.find(n => n.id === entry.source)?.data.name || 
                     entry.source}
                  </span>
                  {entry.target && entry.target !== 'user' && (
                    <>
                      <span className="arrow">→</span>
                      <span className="target-name">
                        {entry.target === 'network' ? 'Network' :
                         networkNodes.find(n => n.id === entry.target)?.data.name || 
                         entry.target}
                      </span>
                    </>
                  )}
                </div>
                <span className="message-time">{formatTimestamp(entry.timestamp)}</span>
              </div>

              {/* Message Content */}
              <div className="message-content">
                {formatMessageContent(entry)}
              </div>

              {/* Evolution Indicator */}
              {(entry.type === 'spawn' || entry.type === 'evolution') && (
                <div className="evolution-indicator">
                  <FiActivity className="evolution-icon" />
                  <span>Network Evolution Triggered</span>
                </div>
              )}

            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="chat-message loading-message">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>DEAC network processing...</span>
          </div>
        )}

      </div>

      {/* Chat Input */}
      <div className="chat-input-section">
        
        {/* Active Node Context (for direct mode) */}
        {chatMode === 'direct' && activeNode && (
          <div className="node-context">
            <div className="context-info">
              <FiCpu className="context-icon" />
              <div className="context-details">
                <span className="context-name">{activeNode.data.name}</span>
                <span className="context-personality">{activeNode.data.personality}</span>
              </div>
            </div>
            <div className="context-stats">
              <span className="stat">Gen {activeNode.data.evolutionGeneration}</span>
              <span className="stat">{activeNode.data.capabilities?.length || 0} capabilities</span>
              <span className="stat">{activeNode.data.conversationHistory?.length || 0} messages</span>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="input-area">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              chatMode === 'network' 
                ? "Send message to entire DEAC network..."
                : activeNode 
                  ? `Chat with ${activeNode.data.name}...`
                  : "Select a DEAC node first..."
            }
            className="message-input"
            rows={3}
            disabled={isLoading || (chatMode === 'direct' && !activeNode)}
          />
          <button 
            className="cell-btn cell-btn--primary send-btn"
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isLoading || (chatMode === 'direct' && !activeNode)}
          >
            <FiSend />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="chat-quick-actions">
          <button 
            className="quick-action-btn"
            onClick={() => setMessageInput('What can you do?')}
          >
            Capabilities
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => setMessageInput('Show network status')}
          >
            Network Status
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => setMessageInput('Collaborate with other nodes')}
          >
            Collaborate
          </button>
        </div>

      </div>

    </div>
  );
};

export default DEACChatInterface; 