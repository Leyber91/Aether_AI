 /**
 * Shared imports to handle case sensitivity issues in the codebase
 * This file helps standardize imports across the application
 * and avoid issues with case-sensitive imports on certain platforms
 */

// Export all components with standardized casing to avoid case sensitivity issues
export { default as AutoSuggestion } from '../Chat/AutoSuggestion';
export { default as TextEnhancer } from '../Chat/TextEnhancer';
export { default as ModelInsights } from '../Chat/ModelInsights';
export { default as NextStepSuggestions } from '../Chat/NextStepSuggestions';
export { default as ChatMessages } from '../Chat/components/ChatMessages';
export { default as ChatInput } from '../Chat/components/ChatInput';
export { default as ConversationHeader } from '../Chat/components/ConversationHeader';
export { default as MessageItem } from '../Chat/components/MessageItem';
export { default as ModelInfoFooter } from '../Chat/components/ModelInfoFooter';
export { default as ConversationSwitcher } from '../ConversationSwitcher/ConversationSwitcher';
export { default as ChatHistory } from '../History/ChatHistory';
export { default as ModelSelector } from '../ModelSelector/ModelSelector';
export { default as ResizableSidebar } from '../common/ResizableSidebar';
export { default as UsageTracker } from '../common/UsageTracker';
