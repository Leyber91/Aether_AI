import React from 'react';
import MessageItem from './MessageItem';
import styles from './ChatMessages.module.css';
console.log('ChatMessages styles:', styles);

const ChatMessages = ({
  activeConversation,
  isLoading,
  error,
  copySuccess,
  copyMessageToClipboard,
  explainCode,
  messagesEndRef
}) => {
  // Defensive: ensure messages is always an array
  const messages = Array.isArray(activeConversation?.messages) ? activeConversation.messages : [];

  return (
    <div className={`${styles["chat-messages"] || ""} ${styles["custom-scrollbar"] || ""}`}>  
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          conversation={activeConversation}
          copyMessageToClipboard={copyMessageToClipboard}
          explainCode={explainCode}
        />
      ))}
      {isLoading && (
        <div className={`${styles["ai-message"] || ""} ${styles["loading"] || ""}`}>
          <div className={styles["loading-indicator"] || ""}>
            <span></span><span></span><span></span>
          </div>
        </div>
      )}
      {error && (
        <div className={styles["error-message"] || ""}>
          {error}
        </div>
      )}
      {copySuccess && (
        <div className={styles["copy-notification"] || ""}>
          {copySuccess}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
