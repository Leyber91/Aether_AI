import React, { useEffect, useCallback, useState, useRef } from 'react';
import './AutoSuggestion.css';

/**
 * AutoSuggestion component
 * Displays real-time suggestions as the user types
 * Follows the space theme with glass panel styling
 */
const AutoSuggestion = ({
  inputValue,
  suggestion,
  isLoading,
  onAccept,
  isEnabled,
  onToggle,
  error
}) => {
  const [formattedSuggestion, setFormattedSuggestion] = useState('');
  const [prevInputValue, setPrevInputValue] = useState('');
  const [prevSuggestion, setPrevSuggestion] = useState('');
  const suggestionRef = useRef(null);

  // Handle tab key to accept suggestion
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab' && suggestion && isEnabled && formattedSuggestion) {
      e.preventDefault();
      onAccept();
    }
  }, [suggestion, onAccept, isEnabled, formattedSuggestion]);

  // Attach key event listener
  useEffect(() => {
    if (isEnabled && suggestion && suggestion.length > 0) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [suggestion, isEnabled, handleKeyDown]);

  // Clean up and format the suggestion text
  const formatSuggestion = useCallback((text, input) => {
    if (!text) return '';

    // Remove any obvious directive text
    let cleaned = text
      .replace(/\blets?\s+improve\b.*$/i, '') // Remove "let's improve" directives
      .replace(/\blets?\s+try\b.*$/i, '') // Remove "let's try" directives
      .replace(/\s*\.{3,}\s*$/, '') // Remove trailing ellipsis
      .trim();

    // Handle multiline suggestions
    // If there are newlines, keep only the first few lines to avoid large suggestions
    if (cleaned.includes('\n')) {
      const lines = cleaned.split('\n');
      // Keep max 3 lines for better UI
      const limitedLines = lines.slice(0, 3);
      cleaned = limitedLines.join('\n');

      // If we truncated lines, add an indicator
      if (lines.length > 3) {
        cleaned += '...';
      }
    }

    // Ensure suggestion is a continuation of the input value
    if (input && cleaned.toLowerCase().startsWith(input.toLowerCase())) {
      cleaned = cleaned.substring(input.length).trimStart();
    }

    // Remove leading connectors if present
    cleaned = cleaned.replace(/^[,;:]\s*/, '');
    
    // Remove extra spaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    
    // Ensure the suggestion isn't exactly the same as input
    if (cleaned === input) return '';
    
    // Don't return very short suggestions (less than 3 chars)
    if (cleaned.length < 3) return '';

    return cleaned;
  }, []);

  // Update formatted suggestion when inputs change
  useEffect(() => {
    // Only update if suggestion or inputValue has actually changed
    if (suggestion !== prevSuggestion || inputValue !== prevInputValue) {
      const newFormatted = formatSuggestion(suggestion, inputValue);
      setFormattedSuggestion(newFormatted);
      setPrevSuggestion(suggestion);
      setPrevInputValue(inputValue);
    }
  }, [suggestion, inputValue, formatSuggestion, prevSuggestion, prevInputValue]);

  // Accessibility focus for screen readers
  useEffect(() => {
    // When a new suggestion appears, announce it for screen readers
    if (formattedSuggestion && suggestionRef.current) {
      suggestionRef.current.setAttribute('aria-live', 'polite');
    }
  }, [formattedSuggestion]);

  // Don't render if feature is disabled or no content to show
  if (!isEnabled || (!formattedSuggestion && !isLoading && !error)) {
    return null;
  }

  // Show loading indicator with animation
  if (isLoading && !formattedSuggestion && !error) {
    return (
      <div className="auto-suggestion glass-panel loading" aria-live="polite">
        <div className="suggestion-content">
          <span className="input-text">{inputValue}</span>
          <span className="suggestion-text loading">...</span>
        </div>
        <div className="suggestion-info">
          <span className="suggestion-hint">Loading suggestions</span>
          <button
            className="suggestion-toggle"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle && onToggle();
            }}
            title="Disable suggestions"
            aria-label="Disable suggestions"
          >
            Disable
          </button>
        </div>
      </div>
    );
  }

  // Show error state with visual indicator
  if (error) {
    return (
      <div className="auto-suggestion glass-panel error" aria-live="polite">
        <div className="suggestion-content">
          <span className="input-text">{inputValue}</span>
          <span className="suggestion-text error">
            <i className="fas fa-exclamation-triangle"></i>
          </span>
        </div>
        <div className="suggestion-info">
          <span className="suggestion-hint error">Connection issue</span>
          <button
            className="suggestion-toggle"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle && onToggle();
            }}
            title={isEnabled ? "Disable suggestions" : "Enable suggestions"}
            aria-label={isEnabled ? "Disable suggestions" : "Enable suggestions"}
          >
            {isEnabled ? "Disable" : "Enable"}
          </button>
        </div>
      </div>
    );
  }

  // Don't show if the formatted suggestion is empty
  if (!formattedSuggestion) return null;

  return (
    <div className="auto-suggestion glass-panel" aria-live="polite">
      <div className="suggestion-content">
        <span className="input-text">{inputValue}</span>
        <span className="suggestion-text" ref={suggestionRef} tabIndex={-1}>
          {formattedSuggestion.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {index > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </span>
      </div>
      <div className="suggestion-info">
        <span className="suggestion-hint">Press Tab to accept</span>
        <button
          className="suggestion-toggle"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle && onToggle();
          }}
          title={isEnabled ? "Disable suggestions" : "Enable suggestions"}
          aria-label={isEnabled ? "Disable suggestions" : "Enable suggestions"}
        >
          {isEnabled ? "Disable" : "Enable"}
        </button>
      </div>
    </div>
  );
};

export default AutoSuggestion;