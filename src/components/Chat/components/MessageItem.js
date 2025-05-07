import React from 'react';
import MessageHeader from './MessageHeader';
import MessageContent from './MessageContent';
import styles from './MessageItem.module.css';

/**
 * MessageItem component renders a single message in the chat conversation
 * with proper styling and accessibility features.
 */
const MessageItem = ({ 
  message, 
  conversation, 
  copyMessageToClipboard, 
  explainCode,
  isLoading,
  isLastMessage 
}) => {
  const isUserMessage = message.role === 'user';
  const isExplanation = message.isExplanation === true;
  
  return (
    <div 
      className={`${styles["message"]} ${isUserMessage ? styles["user-message"] : styles["ai-message"]} ${isExplanation ? styles["explanation-message"] : ""}`}
      id={`message-${message.id}`}
    >
      <MessageHeader 
        isUserMessage={isUserMessage} 
        conversation={conversation} 
        message={message} 
      />
      <MessageContent 
        isUserMessage={isUserMessage}
        message={message}
        copyMessageToClipboard={copyMessageToClipboard}
        explainCode={explainCode}
        isLoading={isLoading}
        isExplanation={isExplanation}
      />
      {isExplanation && message.metadata && (
        <div className={styles["explanation-metadata"]}>
          {message.metadata.codeLanguage && (
            <span className={styles["explanation-badge"]}>
              {message.metadata.codeLanguage}
            </span>
          )}
          {message.metadata.blocksCount > 1 && (
            <span className={styles["explanation-badge"]}>
              {message.metadata.blocksCount} blocks
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
