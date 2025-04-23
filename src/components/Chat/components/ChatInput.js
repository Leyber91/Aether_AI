import React, { useRef, useEffect, useState } from 'react';
import { TextEnhancer, AutoSuggestion } from '../../shared/imports';
import { useAutoSuggestions } from '../../../hooks/useOllamaEnhancements';
import styles from './ChatInput.module.css';
import { NextStepsIcon, EnhanceIcon, SendIcon } from './ChatInputSVG';
import NextStepSuggestions from '../NextStepSuggestions';

const ChatInput = ({ 
  userInput: value, 
  setUserInput: onChange, 
  handleSubmit: onSubmit, 
  isLoading,
  conversationHistory,
  error
}) => {
  const inputRef = useRef(null);
  const [showEnhancer, setShowEnhancer] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Use the auto-suggestions hook
  const { 
    inputValue, 
    handleInputChange, 
    suggestions, 
    isLoading: suggestionsLoading, 
    error: suggestionsError,
    acceptSuggestion, 
    isEnabled: suggestionsEnabled,
    toggleEnabled: toggleSuggestions 
  } = useAutoSuggestions({
    showPartialResults: true,
    enabled: true, // Start enabled by default
  });
  
  // Sync userInput with the auto-suggestions input
  useEffect(() => {
    if (value !== inputValue) {
      handleInputChange(value);
    }
  }, [value, inputValue, handleInputChange]);
  
  // Handle applying a suggestion
  const handleAcceptSuggestion = () => {
    const newText = acceptSuggestion();
    onChange(newText);
  };
  
  // Focus input field on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Toggle the text enhancer
  const toggleEnhancer = () => {
    // Close suggestions if open
    if (showSuggestions) {
      setShowSuggestions(false);
    }
    setShowEnhancer(prev => !prev);
  };

  // Toggle next step suggestions
  const toggleNextStepSuggestions = () => {
    // Close enhancer if open
    if (showEnhancer) {
      setShowEnhancer(false);
    }
    setShowSuggestions(prev => {
      const newVal = !prev;
      return newVal;
    });
  };

  // Handle applying enhanced text
  const handleApplyEnhancement = (enhancedText) => {
    onChange(enhancedText);
    setShowEnhancer(false);
    // Focus back on the input after closing enhancer
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Handle applying a next step suggestion (insert into input)
  const handleNextStepSuggestion = (suggestionText) => {
    onChange(suggestionText);
    setShowSuggestions(false);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Update text in the input field
  const handleChange = (e) => {
    const newText = e.target.value;
    onChange(newText);
  };

  // Handle keyboard shortcuts and special keys
  const handleKeyDown = (e) => {
    // Check for Cmd/Ctrl + Enter to submit (in addition to just Enter)
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit(e);
    }

    // Toggle text enhancer with Cmd/Ctrl + E
    if (e.key === 'e' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      toggleEnhancer();
    }
  };

  return (
    <div className={styles["chat-input-container"]}>
      <form onSubmit={onSubmit} className={styles["chat-input-form"]}>
        <div className={styles["input-wrapper"]}>
          <textarea
            ref={inputRef}
            className={styles["chat-input"]}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            rows={1}
            autoFocus
          />
          {showSuggestions && (
            <NextStepSuggestions
              conversationId={conversationHistory?.length ? conversationHistory[0]?.conversationId : undefined}
              conversationHistory={conversationHistory}
              onSuggestionSelect={handleNextStepSuggestion}
              onClose={toggleNextStepSuggestions}
              isVisible={showSuggestions}
            />
          )}
          {showEnhancer && (
            <TextEnhancer
              originalText={value}
              onApply={handleApplyEnhancement}
              onCancel={() => setShowEnhancer(false)}
              conversationHistory={conversationHistory}
            />
          )}
          <button
            type="button"
            className={styles["next-steps-button"]}
            onClick={toggleNextStepSuggestions}
            title="Show suggested next steps"
            disabled={isLoading}
            tabIndex={-1}
          >
            <NextStepsIcon />
          </button>
          <button
            type="button"
            className={styles["enhance-button"]}
            onClick={toggleEnhancer}
            disabled={isLoading || !value?.trim()}
            title="Enhance your message"
            tabIndex={-1}
          >
            <EnhanceIcon />
          </button>
          <button
            type="submit"
            className={styles["send-button"]}
            disabled={isLoading || !value?.trim()}
            title="Send"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
