import { useState, useCallback } from 'react';

/**
 * Custom hook for managing message types in MetaLoopLab
 * Provides state and utility functions for message type selection
 * Implements Blueprint 3.3.3.d - Deep Observability, Introspection & Control
 * 
 * @returns {Object} - Hook state and methods
 */
export function useMessageTypes() {
  // Current message type for next agent response
  const [currentMessageType, setCurrentMessageType] = useState(null);
  
  // Agent-specific message types (for default assignments)
  const [agentMessageTypes, setAgentMessageTypes] = useState({
    'Agent A': 'analysis',  // Default type for Agent A
    'Agent B': 'critique',  // Default type for Agent B
    'Agent R': 'reflection', // Default type for Reflector
    'Meta Agent': 'observation', // Default for Meta Agent
    'System': null          // System messages have no default type
  });
  
  /**
   * Update message type for a specific agent
   * @param {string} agentName - Agent name
   * @param {string|null} messageType - New message type
   */
  const updateAgentDefaultType = useCallback((agentName, messageType) => {
    setAgentMessageTypes(prev => ({
      ...prev,
      [agentName]: messageType
    }));
  }, []);
  
  /**
   * Get default message type for a given agent
   * @param {string} agentName - Agent name
   * @returns {string|null} - Message type
   */
  const getAgentDefaultType = useCallback((agentName) => {
    return agentMessageTypes[agentName] || null;
  }, [agentMessageTypes]);
  
  /**
   * Reset current message type based on agent
   * @param {string} agentName - Agent name
   */
  const resetMessageTypeForAgent = useCallback((agentName) => {
    setCurrentMessageType(getAgentDefaultType(agentName));
  }, [getAgentDefaultType]);
  
  /**
   * Get message type display information
   * @param {string|null} type - Message type
   * @returns {Object} - Type info (icon, color, label)
   */
  const getMessageTypeInfo = useCallback((type) => {
    switch (type) {
      case 'analysis':
        return { icon: '⚙️', color: '#74d0fc', label: 'Analysis' };
      case 'critique':
        return { icon: '⚠️', color: '#f7b267', label: 'Critique' };
      case 'reflection':
        return { icon: '↻', color: '#9f85ff', label: 'Reflection' };
      case 'summary':
        return { icon: '◈', color: '#64ecaa', label: 'Summary' };
      case 'observation':
        return { icon: '👁️', color: '#5da8ff', label: 'Observation' };
      case 'question': 
        return { icon: '❓', color: '#e2c87a', label: 'Question' };
      case 'action':
        return { icon: '▶️', color: '#ff8570', label: 'Action' };
      default:
        return { icon: '📝', color: '#aaa', label: 'Standard' };
    }
  }, []);
  
  /**
   * Check if a message is of a specific type
   * @param {Object} message - Message object
   * @param {string} type - Type to check for
   * @returns {boolean} - True if message is of the specified type
   */
  const isMessageOfType = useCallback((message, type) => {
    return message?.type === type;
  }, []);
  
  /**
   * Count messages of specific type in a list
   * @param {Array} messages - List of messages
   * @param {string} type - Type to count
   * @returns {number} - Count of messages of the specified type
   */
  const countMessagesOfType = useCallback((messages, type) => {
    return messages?.filter(msg => msg.type === type).length || 0;
  }, []);
  
  return {
    // State
    currentMessageType,
    agentMessageTypes,
    
    // Setters
    setCurrentMessageType,
    updateAgentDefaultType,
    
    // Getters
    getAgentDefaultType,
    getMessageTypeInfo,
    
    // Utility functions
    resetMessageTypeForAgent,
    isMessageOfType,
    countMessagesOfType
  };
}

export default useMessageTypes; 