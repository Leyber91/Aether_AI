import React from 'react';
import styles from './MessageItem.module.css';

/**
 * MessageHeader component renders the header of a message with role, timestamp, and usage information.
 * Handles both user and AI message headers with proper styling.
 */
const MessageHeader = ({ isUserMessage, conversation, message }) => {
  // Format timestamp to a more user-friendly format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };
  
  // Determine the message role label
  const getRoleLabel = () => {
    if (isUserMessage) return 'You';
    
    const provider = conversation?.provider || 'ai';
    const modelId = conversation?.modelId || message?.model || 'unknown';
    
    // Handle different providers
    if (provider === 'groq') {
      return `Groq (${modelId})`;
    } else if (provider === 'ollama') {
      return `Ollama (${modelId})`;
    } else {
      return `AI (${modelId})`;
    }
  };
  
  return (
    <div className={styles["message-role"]}>
      {getRoleLabel()}
      <div className={styles["message-timestamp"]}>
        {formatTimestamp(message.timestamp)}
      </div>
      {message.usage && (
        <div className={styles["message-tokens"]}>
          {message.usage.total_tokens} tokens
        </div>
      )}
    </div>
  );
};

export default MessageHeader;
