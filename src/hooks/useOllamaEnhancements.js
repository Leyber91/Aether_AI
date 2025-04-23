/**
 * React Hooks for Ollama Enhancements
 * Provides UI components with easy access to enhanced Ollama features
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getTextCompletions, 
  smartQueryRouter,
  getOllamaSystemInfo,
  getSuggestions,
  OLLAMA_MODELS
} from '../services/enhancedOllamaService';

/**
 * Hook for auto-suggestions as the user types
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} - Suggestions state and handlers
 */
export const useAutoSuggestions = (options = {}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEnabled, setIsEnabled] = useState(
    options.enabled ?? true
  );
  const [errorCount, setErrorCount] = useState(0);
  
  // Ref to store the latest input value
  const inputRef = useRef('');
  // Ref to store the timer ID
  const timerRef = useRef(null);
  
  // Update input value and ref
  const handleInputChange = useCallback((value) => {
    setInputValue(value);
    inputRef.current = value;
    
    // Reset suggestions when input changes
    if (suggestions) {
      setSuggestions('');
    }
    
    // Clear any previous errors
    if (error) {
      setError(null);
    }
  }, [suggestions, error]);
  
  // Toggle auto-suggestions on/off
  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => !prev);
    if (!isEnabled) {
      setSuggestions('');
      setError(null);
      setErrorCount(0);
    }
  }, [isEnabled]);
  
  // Accept suggestion (append to current input)
  const acceptSuggestion = useCallback(() => {
    if (suggestions) {
      const newValue = inputValue + suggestions;
      setInputValue(newValue);
      inputRef.current = newValue;
      setSuggestions('');
      return newValue;
    }
    return inputValue;
  }, [inputValue, suggestions]);
  
  // Fetch suggestions when input changes
  useEffect(() => {
    // Only fetch if enabled and input is valid, and error count is not too high
    if (!isEnabled || !inputValue || inputValue.length < 5 || errorCount > 3) {
      if (suggestions) setSuggestions('');
      return;
    }
    
    // Don't suggest if the input ends with a space or newline
    if (inputValue.endsWith(' ') || inputValue.endsWith('\n')) {
      if (suggestions) setSuggestions('');
      return;
    }
    
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setError(null);
    
    // Fetch suggestions with improved error handling
    const fetchSuggestions = async () => {
      try {
        setIsLoading(true);
        
        // Use the enhanced getTextCompletions with context
        const completion = await getTextCompletions(inputValue, {
          maxTokens: options.maxTokens || 20,
          model: OLLAMA_MODELS.AUTOCOMPLETE,
          onUpdate: options.showPartialResults ? setSuggestions : null,
          onError: (errorMsg) => {
            console.error("Text completion error:", errorMsg);
            setError(errorMsg);
            setErrorCount(prev => prev + 1);
          },
          fallbackMessage: "" // Return empty string on error instead of throwing
        });
        
        // Only update suggestions if the input hasn't changed
        if (inputRef.current === inputValue && completion) {
          setSuggestions(completion);
          // Reset error count on success
          if (errorCount > 0) setErrorCount(0);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setError(error.message || "Failed to get suggestions");
        setErrorCount(prev => prev + 1);
        
        // Disable suggestions temporarily after too many errors
        if (errorCount >= 3) {
          console.warn("Too many errors, temporarily disabling auto-suggestions");
          // Don't actually disable the feature, just stop making requests
          // This lets the user re-enable it manually if they want
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Use a timeout to avoid excessive API calls
    // Use a longer delay after errors
    const delay = errorCount > 0 ? 1500 : 500;
    timerRef.current = setTimeout(fetchSuggestions, delay);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [inputValue, isEnabled, options.maxTokens, options.showPartialResults, errorCount, suggestions]);
  
  return {
    inputValue,
    suggestions,
    isLoading,
    isEnabled,
    error,
    handleInputChange,
    toggleEnabled,
    acceptSuggestion
  };
};

/**
 * Hook for dynamic model selection based on message content
 * 
 * @param {Array} conversationHistory - The current conversation history
 * @param {Object} userPreferences - User preferences for model selection
 * @returns {Object} - Model selection and prompt enhancement state
 */
export const useDynamicModelSelection = (conversationHistory = [], userPreferences = {}) => {
  const [recommendedModel, setRecommendedModel] = useState(OLLAMA_MODELS.TITLE_GEN);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState(null);
  
  // Analyze conversation and select best model
  const analyzeAndSelectModel = useCallback(async (message) => {
    setIsEnhancing(true);
    setOriginalPrompt(message);
    setError(null);
    
    try {
      // Determine if prompt enhancement is enabled
      const enablePromptEnhancement = userPreferences.enablePromptEnhancement !== false;
      
      // Call the smart router with conversation context
      const { modelId, enhancedPrompt } = await smartQueryRouter(message, {
        conversationType: userPreferences.conversationType || 'general',
        enablePromptEnhancement,
        conversationHistory: conversationHistory.slice(-3) // Last 3 messages for context
      });
      
      setRecommendedModel(modelId);
      setEnhancedPrompt(enhancedPrompt);
      
      return {
        modelId,
        enhancedPrompt,
        originalPrompt: message
      };
    } catch (error) {
      console.error('Error in model selection:', error);
      setError(error.message || "Failed to enhance prompt");
      
      // Fallback to default
      return {
        modelId: OLLAMA_MODELS.TITLE_GEN,
        enhancedPrompt: message,
        originalPrompt: message
      };
    } finally {
      setIsEnhancing(false);
    }
  }, [userPreferences, conversationHistory]);
  
  return {
    recommendedModel,
    enhancedPrompt,
    originalPrompt,
    isEnhancing,
    error,
    analyzeAndSelectModel
  };
};

/**
 * Hook for monitoring Ollama models and system status
 * 
 * @returns {Object} - Ollama system status information
 */
export const useOllamaSystemStatus = () => {
  const [status, setStatus] = useState({
    isRunning: false,
    models: [],
    lastChecked: null,
    isLoading: true,
    error: null
  });
  
  // Check Ollama status
  const checkStatus = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
      const info = await getOllamaSystemInfo();
      
      // If we have models, consider Ollama running even if status might not be explicitly 'running'
      const isRunning = info.status === 'running' || (info.models && info.models.length > 0);
      
      setStatus({
        isRunning: isRunning,
        models: info.models || [],
        lastChecked: new Date(),
        isLoading: false,
        error: null
      });
      
      return isRunning;
    } catch (error) {
      console.error('Failed to check Ollama status:', error);
      
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        isLoading: false,
        error: error.message || 'Failed to connect to Ollama'
      }));
      
      return false;
    }
  }, []);
  
  // Check status on component mount
  useEffect(() => {
    checkStatus();
    
    // Periodically check status (every 2 minutes)
    const intervalId = setInterval(checkStatus, 120000);
    return () => clearInterval(intervalId);
  }, [checkStatus]);
  
  return {
    ...status,
    checkStatus
  };
};
