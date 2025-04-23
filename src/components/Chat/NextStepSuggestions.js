import React, { useState, useEffect, useContext } from 'react';
import { ModelContext } from '../../contexts/ModelContext';
import { generateNextStepSuggestions } from '../../services/enhancedOllamaService';
import './NextStepSuggestions.css';
import { NextStepsIcon } from './components/ChatInputSVG';

/**
 * NextStepSuggestions component
 * Analyzes the conversation and suggests possible next messages
 * based on the conversation context
 */
const NextStepSuggestions = ({ 
  conversationId, 
  conversationHistory, 
  onSuggestionSelect, 
  onClose,
  isVisible
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  
  // Get the model context to check which provider is being used
  const { selectedProvider } = useContext(ModelContext);

  // Utility to fetch latest conversation by ID from localStorage
  function getLatestConversationById(conversationId) {
    try {
      const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
      return conversations.find(conv => conv.id === conversationId) || null;
    } catch (e) {
      return null;
    }
  }

  // Enhanced: Always fetch latest conversation history by ID
  const getCurrentHistory = () => {
    if (conversationId) {
      const conv = getLatestConversationById(conversationId);
      if (conv && Array.isArray(conv.messages)) {
        return conv.messages;
      }
    }
    return conversationHistory || [];
  };

  // Utility: Format suggestion for consistent display (add title if possible)
  function formatSuggestionText(text) {
    // Try to extract a bolded title and description
    const match = text.match(/^\*\*(.*?)\*\*[:：]?\s*(.*)$/);
    if (match) {
      return { title: match[1], description: match[2] };
    }
    // Try to split on colon if present
    const colonIdx = text.indexOf(':');
    if (colonIdx > 0 && colonIdx < text.length - 1) {
      return { title: text.slice(0, colonIdx).trim(), description: text.slice(colonIdx + 1).trim() };
    }
    // Default: treat all as description
    return { title: '', description: text };
  }

  // Generate relevant suggestions based on conversation history and message contents
  const generateSuggestions = async () => {
    let currentHistory = getCurrentHistory();
    // DEBUG: Log the current conversation history for troubleshooting
    console.log('[DEBUG] NextStepSuggestions currentHistory:', currentHistory);
    // Take only the last 5 messages for suggestion context
    if (Array.isArray(currentHistory) && currentHistory.length > 5) {
      currentHistory = currentHistory.slice(-5);
    }
    // Defensive: Filter out empty or whitespace-only messages
    currentHistory = (currentHistory || []).filter(m => m && m.content && m.content.trim().length > 0);
    if (!currentHistory || currentHistory.length < 2) {
      setError('Not enough conversation history to analyze');
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Use LLM-powered suggestions
      const llmSuggestions = await generateNextStepSuggestions(currentHistory, 3);
      // DEBUG: Log the LLM suggestions result
      console.log('[DEBUG] LLM suggestions result:', llmSuggestions);
      if (!llmSuggestions || llmSuggestions.length === 0) {
        setError('No suggestions available for this conversation.');
        setSuggestions([]);
      } else {
        setSuggestions(llmSuggestions.map((text, idx) => {
          const { title, description } = formatSuggestionText(text);
          return {
            id: `llm-suggestion-${idx}`,
            text: description,
            label: title ? title : 'LLM Suggestion',
            raw: text
          };
        }));
      }
    } catch (err) {
      setError('Failed to generate suggestions. Please try again.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user selecting a suggestion
  const handleSelectSuggestion = (suggestion) => {
    if (typeof onSuggestionSelect === 'function') {
      onSuggestionSelect(suggestion.text);
    }
    onClose(); // Close the suggestions panel after selection
  };

  // Enhanced: Add debug log to close handler
  const handleClose = () => {
    console.log('[DEBUG] Suggestions panel close triggered');
    if (typeof onClose === 'function') onClose();
  };

  // Initialize suggestions on component mount or when made visible
  useEffect(() => {
    if (isVisible && !isLoading) {
      generateSuggestions();
    }
  }, [isVisible, conversationId, conversationHistory]); // Regenerate when conversation changes or history updates

  if (!isVisible) return null;

  return (
    <div
      className="next-step-suggestions"
      style={{
        display: 'block',
        position: 'absolute',
        zIndex: 9999,
        left: 0,
        right: 0,
        bottom: '60px', // adjust as needed
        background: 'rgba(18,24,38,0.99)',
        border: '2px solid #74d0fc',
        minHeight: '120px',
        minWidth: '320px',
        color: '#fff',
        pointerEvents: 'auto'
      }}
    >
      <div className="suggestions-header">
        <h3 className="suggestions-title">
          <span className="suggestions-title-icon"><NextStepsIcon size={20} /></span>
          Suggested Next Steps
        </h3>
        <button 
          className="close-suggestions" 
          aria-label="Close suggestions" 
          onClick={handleClose}
        >
          ×
        </button>
      </div>
      <div className="suggestions-content">
        {isLoading ? (
          <div className="suggestions-loading">
            <div className="suggestions-loading-spinner"></div>
            <span>Analyzing conversation...</span>
          </div>
        ) : error ? (
          <div className="suggestions-error">
            <span>{error}</span>
            <button 
              onClick={generateSuggestions} 
              className="retry-suggestions"
            >
              Try Again
            </button>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="suggestions-empty">
            <span className="suggestions-empty-icon"><NextStepsIcon size={18} /></span>
            <p>No suggestions available for this conversation.</p>
            {/* Always show a default actionable suggestion if array is empty */}
            <div className="suggestion-item" style={{marginTop: '12px', cursor: 'default'}}>
              <div className="suggestion-label">Tip</div>
              <p className="suggestion-text">Ask a follow-up question or request clarification to continue the conversation.</p>
            </div>
          </div>
        ) : (
          suggestions.map(suggestion => (
            <div
              key={suggestion.id}
              className="suggestion-item"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="suggestion-label">{suggestion.label}</div>
              <p className="suggestion-text">{suggestion.text}</p>
              <div className="suggestion-footer">
                <button className="use-suggestion" onClick={e => { e.stopPropagation(); handleSelectSuggestion(suggestion); }}>
                  Use <span>→</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NextStepSuggestions;
