import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getAllOllamaModels } from '../services/ollamaService';
import { initializeTokenUsage, trackTokenUsage, getTokenUsageStats, checkUsageLimits } from '../utils/tokenUsage';
import config from '../config';
import { GROQ_MODELS } from '../utils/groqModels';

// Create the context
export const ModelContext = createContext();

export const ModelProvider = ({ children }) => {
  const [models, setModels] = useState({
    ollama: [],
    groq: GROQ_MODELS
  });
  const [selectedModel, setSelectedModel] = useState(config.defaultModelId);
  const [selectedProvider, setSelectedProvider] = useState(config.defaultProvider);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // For tracking Groq token usage - now using the improved tracker
  const [tokenUsage, setTokenUsage] = useState(() => initializeTokenUsage());
  const [lastResponseUsage, setLastResponseUsage] = useState(null);
  const [usageLimits, setUsageLimits] = useState({});

  // Initialize token usage from persistent storage
  useEffect(() => {
    // Initialize token usage data from storage
    const initialUsage = initializeTokenUsage();
    setTokenUsage(initialUsage);
    
    // Set up interval to refresh minute-based usage statistics
    const intervalId = setInterval(() => {
      setTokenUsage(initializeTokenUsage());
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, []);

  // Function to refresh Ollama models
  const refreshOllamaModels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const ollamaModelsResult = await getAllOllamaModels();
      // Defensive: ensure only the array is set on models.ollama
      setModels(prev => ({ ...prev, ollama: Array.isArray(ollamaModelsResult.models) ? ollamaModelsResult.models : [] }));
    } catch (err) {
      setError('Failed to fetch Ollama models. Make sure Ollama is running.');
      console.error('Error fetching Ollama models:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Ollama models on initial load
  useEffect(() => {
    refreshOllamaModels();
  }, [refreshOllamaModels]);

  // Function to select a model
  const selectModel = (provider, modelId) => {
    setSelectedProvider(provider);
    setSelectedModel(modelId);
    
    // Update usage limits for the selected model if it's a Groq model
    if (provider === 'groq' && modelId) {
      updateUsageLimits(modelId);
    }
  };
  
  // Update usage limits for a given model
  const updateUsageLimits = (modelId) => {
    if (!modelId) return;
    
    // Check current usage against limits
    const limits = checkUsageLimits(modelId);
    setUsageLimits(limits);
  };
  
  // Function to update token usage from API response
  const updateTokenUsage = (modelId, usageData) => {
    const { total_tokens, prompt_tokens, completion_tokens } = usageData;
    
    // Track this usage event
    const updatedUsage = trackTokenUsage(modelId, {
      total_tokens,
      prompt_tokens,
      completion_tokens
    });
    
    // Update the state with the new usage data
    setTokenUsage(updatedUsage);
    
    // Also update the last response usage for UI components to react
    setLastResponseUsage(usageData);
    
    return updatedUsage;
  };
  
  // Get current selected model data
  const getSelectedModelData = () => {
    if (!selectedModel) return null;
    
    if (selectedProvider === 'groq') {
      return models.groq.find(model => model.id === selectedModel) || null;
    }
    
    return models.ollama.find(model => model.id === selectedModel) || null;
  };

  // Get usage statistics for the current model
  const getCurrentModelUsage = () => {
    if (selectedProvider !== 'groq' || !selectedModel) return null;
    
    return getTokenUsageStats(selectedModel);
  };

  return (
    <ModelContext.Provider 
      value={{ 
        models, 
        selectedModel, 
        selectedProvider, 
        isLoading, 
        error, 
        selectModel, 
        refreshOllamaModels,
        tokenUsage,
        lastResponseUsage,
        usageLimits,
        updateTokenUsage,
        getSelectedModelData,
        getCurrentModelUsage,
        updateUsageLimits
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};
