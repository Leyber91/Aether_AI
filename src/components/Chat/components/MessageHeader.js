import React from 'react';

const MessageHeader = ({ isUserMessage, conversation, message }) => {
  return (
    <div className="message-role">
      {isUserMessage ? 'You' : 
        conversation?.provider === 'groq' 
          ? `Groq (${conversation?.modelId})` 
          : `Ollama (${conversation?.modelId})`
      }
      <div className="message-timestamp">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
      {message.usage && (
        <div className="message-tokens">
          {message.usage.total_tokens} tokens
        </div>
      )}
    </div>
  );
};

export default MessageHeader;
