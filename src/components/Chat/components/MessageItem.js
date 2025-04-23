import React from 'react';
import MessageHeader from './MessageHeader';
import MessageContent from './MessageContent';
import styles from './MessageItem.module.css';

const MessageItem = ({ 
  message, 
  conversation, 
  copyMessageToClipboard, 
  explainCode 
}) => {
  const isUserMessage = message.role === 'user';

  return (
    <div className={`${styles["message"]} ${isUserMessage ? styles["user-message"] : styles["ai-message"]}`}>
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
      />
    </div>
  );
};

export default MessageItem;
