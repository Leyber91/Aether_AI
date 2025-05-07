import React from 'react';
import MessageItem from './MessageItem';
import styles from './ChatMessages.module.css';

const ChatMessages = ({
  activeConversation,
  isLoading,
  explainLoading,
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
          isLoading={message.id === messages[messages.length - 1]?.id && explainLoading}
          isLastMessage={message.id === messages[messages.length - 1]?.id}
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
        <div className={`${styles["error-message"] || ""}`}>
          <p>{error}</p>
        </div>
      )}
      {copySuccess && (
        <div className={`${styles["success-message"] || ""}`}>
          <p>{copySuccess}</p>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
