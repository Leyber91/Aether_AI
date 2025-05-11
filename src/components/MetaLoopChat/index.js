/**
 * MetaLoopChat Module Index
 * Exports all components for easier imports
 */

// Main components
export { default as MetaLoopLab } from './MetaLoopLab';
export { default as MetaLoopChat } from './MetaLoopChat';

// UI Components
export { default as MetaLoopAnimation } from './components/MetaLoopAnimation';
export { default as MetaLoopBanner } from './components/MetaLoopBanner';

// Logic modules
export { useMetaLoopOrchestration } from './hooks/useMetaLoopOrchestration';

// Domain modules
export * from './domain/agentConfig';
export * from './domain/messageUtils';
export * from './domain/processGraphUtils';

// Services
export * from './services/llmService';
