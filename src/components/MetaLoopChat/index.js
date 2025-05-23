/**
 * MetaLoopChat Module Index
 * Exports all components for easier imports
 * Enhanced to include new components and utilities
 */

// Main components
export { default as MetaLoopLab } from './MetaLoopLab';
export { default as MetaLoopChat } from './MetaLoopChat';

// UI Components
export { default as MetaLoopAnimation } from './components/MetaLoopAnimation';
export { default as MetaLoopBanner } from './components/MetaLoopBanner';
export { default as MessageTypeSelector } from './components/MessageTypeSelector';
export { default as MessageFlowVisualizer } from './components/MessageFlowVisualizer';
export { default as AdvancedLabTab } from './components/AdvancedLabTab';

// Logic modules
export { useMetaLoopOrchestration } from './hooks/useMetaLoopOrchestration';
export { useMessageTypes } from './hooks/useMessageTypes';

// Domain modules
export * from './domain/agentConfig';
export * from './domain/messageUtils';
export * from './domain/processGraphUtils';

// Services
export * from './services/llmService';

// Utility exports for easy access to key functions
export { 
  processAgentResponse, 
  detectMessageType, 
  createMessage, 
  extractTrailingJson, 
  extractImages 
} from './domain/messageUtils';
