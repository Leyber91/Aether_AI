import React, { useState } from 'react';
import MarkdownRenderer from '../../common/MarkdownRenderer';
import { FiCopy, FiCode } from 'react-icons/fi';
import { LuLightbulb } from 'react-icons/lu';
import styles from './MessageItem.module.css';

/**
 * MessageContent component renders the content of a message with proper
 * formatting, action buttons, and accessibility features.
 */
const MessageContent = ({ isUserMessage, message, copyMessageToClipboard, explainCode, isLoading }) => {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  
  // Helper to check if message likely contains code
  const containsCodeBlock = (content) => {
    return content && (
      content.includes('```') || 
      content.includes('<svg') ||
      content.includes('<html') ||
      content.includes('function') ||
      content.includes('class ') ||
      /<style>[\s\S]*?<\/style>/i.test(content) ||
      /<script>[\s\S]*?<\/script>/i.test(content)
    );
  };
  
  const hasCode = !isUserMessage && containsCodeBlock(message.content);
  
  // For user messages, render simple text
  if (isUserMessage) {
    return (
      <div className={`${styles["message-content"]} ${styles["user-message-content"]}`}>
        {message.content}
      </div>
    );
  }
  
  // For AI messages, render with markdown, thinking content, and action buttons
  return (
    <>
      {message.thinking && (
        <div className={styles["thinking-content"]}>
          <strong>🤔 Model's reasoning:</strong>
          <div className={styles["thinking-text"]}>{message.thinking}</div>
        </div>
      )}
      
      <div className={styles["message-actions"]}>
        <button 
          className={`${styles["message-action-button"]} ${styles["copy-button"]}`}
          onClick={() => copyMessageToClipboard(message.id, message.content)}
          title="Copy message"
          aria-label="Copy message"
        >
          <FiCopy />
          <span className={styles["action-label"]}>Copy</span>
        </button>
        
        {hasCode && (
          <button 
            className={`${styles["message-action-button"]} ${styles["view-raw-button"]} ${showRawMarkdown ? styles["active"] : ""}`}
            onClick={() => setShowRawMarkdown(!showRawMarkdown)}
            title={showRawMarkdown ? "View rendered" : "View raw markdown"}
            aria-label={showRawMarkdown ? "View rendered" : "View raw markdown"}
          >
            <FiCode />
            <span className={styles["action-label"]}>{showRawMarkdown ? "Rendered" : "Raw"}</span>
          </button>
        )}
        
        <button 
          className={`${styles["message-action-button"]} ${styles["explain-button"]} ${isLoading ? styles["loading"] : ""}`}
          onClick={() => explainCode(message.id, message.content)}
          title={isLoading ? "Generating explanation..." : "Explain code"}
          aria-label={isLoading ? "Generating explanation..." : "Explain code"}
          disabled={isLoading}
        >
          <LuLightbulb />
          <span className={styles["action-label"]}>{isLoading ? "Explaining..." : "Explain"}</span>
        </button>
      </div>
      
      {showRawMarkdown ? (
        <div className={styles["raw-markdown"]}>
          <pre>{message.content}</pre>
        </div>
      ) : (
        <div className={styles["markdown-content"]}>
          <MarkdownRenderer content={message.content} />
        </div>
      )}
    </>
  );
};

export default MessageContent;
