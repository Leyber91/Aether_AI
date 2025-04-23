import React, { useState, useEffect, useContext } from 'react';
import { ModelContext } from '../../contexts/ModelContext';
import { 
  OLLAMA_MODELS, 
  enhanceTextWithOllama, 
  isOllamaRunning,
  PROMPT_FRAMEWORKS,
  getFrameworkSystemPrompt,
  getFrameworkUserPrompt
} from '../../services/enhancedOllamaService';
import './TextEnhancer.css';

/**
 * TextEnhancer component
 * Provides options to enhance text before sending
 * Always uses Ollama for enhancements (unlimited local processing)
 */
const TextEnhancer = ({ 
  originalText, 
  onApply, 
  onCancel,
  conversationHistory
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedText, setEnhancedText] = useState('');
  const [error, setError] = useState(null);
  const [enhancementType, setEnhancementType] = useState('professional');
  const [currentRequest, setCurrentRequest] = useState(null);
  const [ollamaAvailable, setOllamaAvailable] = useState(true);
  
  // Get the model context (though we'll always use Ollama for enhancements)
  const { selectedProvider } = useContext(ModelContext);
  
  // Check if Ollama is running on component mount
  useEffect(() => {
    const checkOllama = async () => {
      try {
        const isRunning = await isOllamaRunning();
        setOllamaAvailable(isRunning);
        
        if (!isRunning) {
          setError('Ollama is not running. Please start Ollama to use text enhancement.');
        }
      } catch (err) {
        console.error("Error checking Ollama status:", err);
        setOllamaAvailable(false);
        setError('Unable to connect to Ollama. Please check your connection.');
      }
    };
    
    checkOllama();
  }, []);
  
  // Generate enhanced text based on the selected style
  const generateEnhancement = async (type) => {
    if (!originalText?.trim()) {
      setError('Please enter some text to enhance');
      return;
    }
    
    if (!ollamaAvailable) {
      setError('Ollama is not running. Please start Ollama to use text enhancement.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Cancel any pending requests
      if (currentRequest && typeof currentRequest.abort === 'function') {
        currentRequest.abort();
      }
      
      // Get optimized prompts using the helper functions
      const systemPrompt = getFrameworkSystemPrompt(type);
      const userPrompt = getFrameworkUserPrompt(type, originalText);
      
      // Prepare messages for the AI request
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      
      // Always use Ollama regardless of the selected provider for the main chat
      const controller = new AbortController();
      setCurrentRequest(controller);
      
      // Use the enhanceTextWithOllama function for streaming, robust enhancement
      const enhancedResult = await enhanceTextWithOllama(
        OLLAMA_MODELS.GENERAL,
        messages,
        {
          temperature: 0.7,
          maxTokens: 500,
          signal: controller.signal,
          fallbackMessage: "I couldn't enhance your text. Please try again or use a different enhancement style.",
          onUpdate: (partial) => setEnhancedText(partial.content || ''),
        }
      );
      setEnhancedText(enhancedResult);
    } catch (err) {
      // Only set error if it's not an abort error
      if (err.name !== 'AbortError') {
        console.error("TextEnhancer error:", err);
        setError('Error enhancing text: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
      setCurrentRequest(null);
    }
  };
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cancel any pending requests when component unmounts
      if (currentRequest && typeof currentRequest.abort === 'function') {
        currentRequest.abort();
      }
    };
  }, [currentRequest]);
  
  // --- DEBUG: Log enhancement type and preview updates ---
  useEffect(() => {
    if (originalText && ollamaAvailable) {
      console.log('[DEBUG] Enhancement type changed:', enhancementType);
      generateEnhancement(enhancementType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enhancementType, originalText, ollamaAvailable]);
  
  // --- DEBUG: Log when Apply Enhanced Text is clicked ---
  const handleApplyClick = () => {
    console.log('[DEBUG] Apply Enhanced Text clicked. Enhanced text:', enhancedText);
    if (typeof onApply === 'function') onApply(enhancedText);
  };
  
  // Helper function to render enhancement option with icon
  const renderEnhancementOption = (type, label, icon) => (
    <button 
      type="button"
      onClick={() => setEnhancementType(type)}
      className={`enhancement-option ${enhancementType === type ? 'active' : ''}`}
      disabled={isLoading || !ollamaAvailable}
      title={label}
    >
      <span className="option-icon">{icon}</span>
      <span className="option-text">{label}</span>
    </button>
  );
  
  return (
    <div className="text-enhancer-container">
      <div className="text-enhancer-glass-panel">
        <div className="text-enhancer-header">
          <h3 className="text-enhancer-title">Enhance Your Message</h3>
        </div>
        
        {error && <div className="enhancer-error">{error}</div>}
        
        <div className="text-enhancer-content">
          <div className="text-enhancer-sidebar">
            <div className="enhancement-categories">
              <div className="category-label">BASIC STYLES</div>
              <div className="enhancement-options">
                {renderEnhancementOption(PROMPT_FRAMEWORKS.BASIC.PROFESSIONAL, 'Professional', '👔')}
                {renderEnhancementOption(PROMPT_FRAMEWORKS.BASIC.CREATIVE, 'Creative', '🎨')}
                {renderEnhancementOption(PROMPT_FRAMEWORKS.BASIC.CONCISE, 'Concise', '✂️')}
                {renderEnhancementOption(PROMPT_FRAMEWORKS.BASIC.ELABORATE, 'Elaborate', '📝')}
              </div>
              
              <div className="category-label">ADVANCED FRAMEWORKS</div>
              <div className="enhancement-options">
                {renderEnhancementOption(PROMPT_FRAMEWORKS.ADVANCED.PROBLEM_SOLUTION, 'Problem-Solution', '🧩')}
                {renderEnhancementOption(PROMPT_FRAMEWORKS.ADVANCED.ITERATIVE_REFINEMENT, 'Iterative Refinement', '🔄')}
                {renderEnhancementOption(PROMPT_FRAMEWORKS.ADVANCED.SUCCESS_CRITERIA, 'Success Criteria', '🎯')}
                {renderEnhancementOption(PROMPT_FRAMEWORKS.ADVANCED.MULTI_PERSPECTIVE, 'Multi-Perspective', '👥')}
                {renderEnhancementOption(PROMPT_FRAMEWORKS.ADVANCED.SCENARIO_BASED, 'Scenario-Based', '🎬')}
              </div>
            </div>
          </div>
          
          <div className="text-preview-container">
            <div className="text-preview-row">
              <div className="preview-column">
                <h4>Original Text:</h4>
                <div className="original-text custom-scrollbar">{originalText}</div>
              </div>
              
              <div className="preview-column">
                <h4>Enhanced Text:</h4>
                <div className="enhanced-text custom-scrollbar">
                  {isLoading ? (
                    <div className="loading-indicator">
                      <div className="spinner-container">
                        <div className="spinner-glow"></div>
                        <div className="spinner"></div>
                      </div>
                      <span>Enhancing your text</span>
                    </div>
                  ) : enhancedText ? (
                    enhancedText
                  ) : (
                    <span className="placeholder-text">Enhanced text will appear here</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="enhancer-actions">
          <button 
            onClick={onCancel} 
            className="enhancer-button cancel-button"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={handleApplyClick} 
            className="enhancer-button apply-button"
            disabled={isLoading || !enhancedText}
          >
            Apply Enhanced Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextEnhancer;