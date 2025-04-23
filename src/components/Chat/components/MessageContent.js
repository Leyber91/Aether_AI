import React from 'react';
import MarkdownRenderer from '../../common/MarkdownRenderer';
import { FiCopy } from 'react-icons/fi';
import { LuLightbulb } from 'react-icons/lu';
import styles from './MessageItem.module.css';

const MessageContent = ({ isUserMessage, message, copyMessageToClipboard, explainCode }) => {
  // Always use the correct class for content
  if (isUserMessage) {
    return (
      <div className={`${styles["message-content"]} ${styles["user-message-content"] || ""}`}>{message.content}</div>
    );
  }
  // For assistant/Ollama messages, show main content and (if present) thinking
  return (
    <>
      {message.thinking && (
        <div className={styles["thinking-content"] || "thinking-content-default"}>
          <strong>🤔 Model's reasoning:</strong>
          <div className={styles["thinking-text"] || ""}>{message.thinking}</div>
        </div>
      )}
      <div className={styles["message-actions"] || ""}>
        <button 
          className={`${styles["message-action-button"]} ${styles["copy-button"] || ""}`}
          onClick={() => copyMessageToClipboard(message.id, message.content)}
          title="Copy message"
          aria-label="Copy message"
        >
          <FiCopy />
          <span className={styles["action-label"]}>Copy</span>
        </button>
        <button 
          className={`${styles["message-action-button"]} ${styles["explain-button"] || ""}`}
          onClick={() => explainCode(message)}
          title="Explain code"
          aria-label="Explain code"
        >
          <LuLightbulb />
          <span className={styles["action-label"]}>Explain</span>
        </button>
      </div>
      {/* Ensure markdown is always rendered with the correct class for the container */}
      <div className={styles["markdown-content"] || ""}>
        <MarkdownRenderer content={message.content} />
      </div>
    </>
  );
};

export default MessageContent;
