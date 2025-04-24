import React from 'react';
import ConversationHeader from './ConversationHeader.js';

/**
 * Component that displays the currently selected model information
 * 
 * @param {Object} props - Component props
 * @param {string} props.selectedModel - Currently selected model
 * @param {string} props.selectedProvider - Currently selected provider (groq or ollama)
 * @returns {JSX.Element} - Rendered component
 */
const ModelInfoFooter = ({ selectedModel, selectedProvider }) => {
  return (
    <div className={"model-info-footer"}>
      <div className={"model-info-content"}>
        {selectedModel ? (
          <div className={"model-info-details"}>
            <div className={"model-status"}>
              <div className={"model-indicator"}></div>
            </div>
            <div className={"model-details"}>
              <span className={"provider-name"}>
                {selectedProvider === 'groq' ? 'Groq' : 'Ollama'}
              </span>
              <span className={"model-divider"}>/</span>
              <span className={"model-name"}>{selectedModel}</span>
            </div>
          </div>
        ) : (
          <span className={"no-model"}>No model selected</span>
        )}
        <div className={"footer-powered-by"}>
          <span className={"app-name"}>WindsurfALFA</span>
          <span className={"app-version"}>v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default ModelInfoFooter;
