import React, { useState, useEffect, useRef } from 'react';
import { 
  FiX, 
  FiSend, 
  FiUser, 
  FiCpu, 
  FiDatabase, 
  FiActivity,
  FiMessageCircle,
  FiRefreshCw
} from 'react-icons/fi';

/**
 * DEACInteractionPanel - Real-time interaction with a DEAC
 */
const DEACInteractionPanel = ({ isOpen, deac, onClose, apiBase }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [memoryStats, setMemoryStats] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (isOpen && deac) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I'm ${deac.name}, a Dynamic Evolving AI Conglomerate. I can learn, evolve, and remember our conversations. How can I help you today?`,
          timestamp: new Date().toISOString(),
          confidence: 1.0
        }
      ]);
      
      // Fetch memory stats
      fetchMemoryStats();
    }
  }, [isOpen, deac]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMemoryStats = async () => {
    if (!deac) return;
    
    try {
      const response = await fetch(`${apiBase}/deac/${deac.id}/memory`);
      if (response.ok) {
        const stats = await response.json();
        setMemoryStats(stats);
      }
    } catch (error) {
      console.error('Error fetching memory stats:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBase}/deac/${deac.id}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            session_id: Date.now(),
            interface: 'web_panel'
          }
        }),
      });

      if (response.ok) {
        const interaction = await response.json();
        
        const assistantMessage = {
          id: interaction.interaction_id,
          role: 'assistant',
          content: interaction.response,
          timestamp: interaction.timestamp,
          confidence: interaction.confidence,
          processing_time: interaction.processing_time_ms,
          thinking_process: interaction.thinking_process,
          memory_accessed: interaction.memory_accessed
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Refresh memory stats after interaction
        setTimeout(fetchMemoryStats, 1000);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now().toString(),
        role: 'error',
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageIcon = (role) => {
    switch (role) {
      case 'user': return <FiUser />;
      case 'assistant': return <FiCpu />;
      case 'error': return <FiActivity />;
      default: return <FiMessageCircle />;
    }
  };

  const getMessageClass = (role) => {
    switch (role) {
      case 'user': return 'message-user';
      case 'assistant': return 'message-assistant';
      case 'error': return 'message-error';
      default: return 'message-system';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container interaction-panel">
        <div className="modal-header">
          <div className="modal-title">
            <FiCpu className="modal-icon" />
            <div>
              <h2>Interact with {deac.name}</h2>
              <span className="deac-model">{deac.base_model}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-content interaction-content">
          {/* DEAC Info Bar */}
          <div className="deac-info-bar">
            <div className="deac-status">
              <div className={`status-indicator ${deac.state === 'ready' ? 'status-ready' : 'status-thinking'}`}>
                <FiActivity />
                {deac.state || 'ready'}
              </div>
              <span>Gen {deac.evolution_generations}</span>
            </div>
            
            {memoryStats && (
              <div className="memory-info">
                <FiDatabase />
                <span>{memoryStats.stats?.total_memories || 0} memories</span>
              </div>
            )}
            
            <button 
              className="btn-icon"
              onClick={fetchMemoryStats}
              title="Refresh memory stats"
            >
              <FiRefreshCw />
            </button>
          </div>

          {/* Messages Area */}
          <div className="messages-area">
            {messages.map((message) => (
              <div key={message.id} className={`message ${getMessageClass(message.role)}`}>
                <div className="message-header">
                  <div className="message-author">
                    {getMessageIcon(message.role)}
                    <span>
                      {message.role === 'user' ? 'You' : 
                       message.role === 'assistant' ? deac.name : 
                       'System'}
                    </span>
                  </div>
                  <div className="message-meta">
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                    {message.confidence !== undefined && (
                      <span className="message-confidence">
                        {(message.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                    {message.processing_time && (
                      <span className="message-timing">
                        {message.processing_time}ms
                      </span>
                    )}
                  </div>
                </div>
                <div className="message-content">
                  {message.content}
                </div>
                
                {message.thinking_process && message.thinking_process.length > 0 && (
                  <div className="message-thinking">
                    <details>
                      <summary>Thinking Process</summary>
                      <ul>
                        {message.thinking_process.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="message message-loading">
                <div className="message-header">
                  <div className="message-author">
                    <FiCpu />
                    <span>{deac.name}</span>
                  </div>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-area">
            <div className="input-container">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
                rows={3}
                disabled={isLoading}
              />
              <button
                className="send-button"
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                title="Send message"
              >
                <FiSend />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DEACInteractionPanel; 