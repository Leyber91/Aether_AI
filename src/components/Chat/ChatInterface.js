import React, { useContext, useState, useEffect, useRef } from 'react';
import { ChatContext } from '../../contexts/ChatContext';
import { ModelContext } from '../../contexts/ModelContext';
import { 
  ConversationHeader, 
  ChatMessages, 
  ChatInput, 
  ModelInfoFooter,
  ModelInsights,
  ConversationSwitcher,
  ChatHistory,
  ModelSelector,
  ResizableSidebar,
  NextStepSuggestions // Import NextStepSuggestions
} from '../shared/imports';
import { shouldShowUsageTracker, copyToClipboard } from './utils/chatHelpers';
import { useDynamicModelSelection } from '../../hooks/useOllamaEnhancements';
import styles from './components/ChatInterface.module.css';
import './ChatInterface.css';

/**
 * Main chat interface component that manages the messaging UI
 * Handles message sending, conversation management, and UI state
 */
const ChatInterface = () => {
  // Local state
  const [userInput, setUserInput] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showInsights, setShowInsights] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const titleInputRef = useRef(null);

  // Context values
  const context = useContext(ChatContext);
  console.log('ChatContext value:', context);
  const conversationState = context && context.conversationState ? context.conversationState : {};
  const conversationActions = context && context.conversationActions ? context.conversationActions : {};
  const conversationHelpers = context && context.conversationHelpers ? context.conversationHelpers : {};
  console.log('conversationHelpers:', conversationHelpers);
  const {
    conversations = [],
    activeConversationId,
    isLoading,
    error,
    isTitleGenerating,
    titleGeneratingId
  } = conversationState;
  const {
    createConversation = () => {},
    setActiveConversationById = () => {},
    autoRenameConversation = () => {},
    updateConversationTitle = () => {}
  } = conversationActions;
  const {
    getActiveConversationData = () => null,
    sendMessage = () => {}
  } = conversationHelpers;

  const { selectedModel, selectedProvider } = useContext(ModelContext);

  // Defensive: always get an object with a messages array
  const activeConversation = (() => {
    const conv = getActiveConversationData();
    if (conv && typeof conv === 'object') {
      return { ...conv, messages: Array.isArray(conv.messages) ? conv.messages : [] };
    }
    return { messages: [] };
  })();

  // Initialize smart model selection
  const {
    recommendedModel,
    enhancedPrompt,
    originalPrompt,
    isEnhancing,
    analyzeAndSelectModel
  } = useDynamicModelSelection(
    activeConversation?.messages || [],
    { enablePromptEnhancement: true }
  );

  // Create a new conversation only if no conversations exist
  useEffect(() => {
    if (!activeConversation && conversations.length === 0) {
      createConversation('New Conversation');
    } else if (!activeConversation && conversations.length > 0) {
      // If conversations exist but none is active, set the first one as active
      const conversationId = conversations[0].id;
      setActiveConversationById(conversationId);
    }
  }, [activeConversation, conversations, createConversation, setActiveConversationById]);

  // Scroll to the bottom of the chat on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Focus on title input when editing
  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
    }
  }, [isEditingTitle]);

  // Update edited title when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      setEditedTitle(activeConversation.title);
    }
  }, [activeConversation]);

  /**
   * Handles form submission for sending a new message
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    // Analyze message for smart routing if provider is ollama
    if (selectedProvider === 'ollama') {
      setShowInsights(true);
      const analysis = await analyzeAndSelectModel(userInput);

      // If we have a model recommendation and it's different, update it
      if (analysis.modelId && analysis.modelId !== selectedModel && selectedProvider === 'ollama') {
        // We don't automatically switch models, just show the recommendation
      }
    }

    // Get the message content to send (enhanced or original)
    const messageToSend = (enhancedPrompt && showInsights) ? enhancedPrompt : userInput;

    // Call the sendMessage from ChatContext
    try {
      await sendMessage(activeConversation.id, messageToSend);
      setUserInput('');
      setShowInsights(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  /**
   * Handles accepting the enhanced prompt
   */
  const handleAcceptEnhancement = () => {
    setUserInput(enhancedPrompt);
    setShowInsights(false);
  };

  /**
   * Handles rejecting the enhanced prompt
   */
  const handleRejectEnhancement = () => {
    setShowInsights(false);
  };

  /**
   * Copies a message to clipboard
   * @param {string} messageId - ID of the message to copy
   * @param {string} content - Content of the message
   */
  const copyMessageToClipboard = (messageId, content) => {
    copyToClipboard(content, setCopySuccess);
    setCopySuccess(messageId);
    setTimeout(() => setCopySuccess(''), 2000);
  };

  /**
   * Shows explanation for code in a message
   * @param {string} messageId - ID of the message containing code
   */
  const explainCode = async (messageId) => {
    const msg = activeConversation?.messages?.find(m => m.id === messageId);
    if (!msg || !msg.content) {
      setCopySuccess('No code found to explain.');
      setTimeout(() => setCopySuccess(''), 2000);
      return;
    }
    try {
      // Use Ollama LLM to explain code
      // Use a clear prompt for code explanation
      const prompt = `Explain the following code in clear, concise language for a developer. If it is not code, say so.\n\n${msg.content}`;
      // Prefer a short, safe output (adjust maxTokens as needed)
      const { sendMessageToOllama, OLLAMA_MODELS } = await import('../../services/ollama');
      const response = await sendMessageToOllama(
        OLLAMA_MODELS.GENERAL,
        [{ role: 'user', content: prompt }],
        { maxTokens: 200, force: true } // force: true bypasses cooldown
      );
      setCopySuccess(response?.content || 'No explanation available.');
      setTimeout(() => setCopySuccess(''), 5000);
    } catch (error) {
      setCopySuccess('Failed to explain code.');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  /**
   * Saves the edited conversation title
   */
  const saveEditedTitle = () => {
    if (activeConversation && editedTitle.trim()) {
      updateConversationTitle(activeConversation.id, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  /**
   * Cancels title editing and restores original title
   */
  const cancelTitleEditing = () => {
    setIsEditingTitle(false);
    if (activeConversation) {
      setEditedTitle(activeConversation.title);
    }
  };

  /**
   * Triggers automatic generation of conversation title
   */
  const handleAutoGenerateTitle = async () => {
    if (activeConversation) {
      await autoRenameConversation(activeConversation.id);
    }
  };

  // Check if usage tracker should be displayed
  const shouldShowUsageTrackerValue = activeConversation
    ? shouldShowUsageTracker(activeConversation, selectedProvider)
    : selectedProvider === 'groq';

  return (
    <div className={styles["chat-interface"]}>
      <div className={styles["chat-container"]}>
        <ResizableSidebar minWidth={250} maxWidth={500} defaultWidth={280}>
          <ModelSelector />
          <ConversationSwitcher />
          <ChatHistory />
        </ResizableSidebar>
        <main className={styles["chat-main"]}>
          {activeConversation && (
            <ConversationHeader
              conversation={activeConversation}
              isEditingTitle={isEditingTitle}
              setIsEditingTitle={setIsEditingTitle}
              editedTitle={editedTitle}
              setEditedTitle={setEditedTitle}
              saveEditedTitle={saveEditedTitle}
              cancelTitleEditing={cancelTitleEditing}
              handleAutoGenerateTitle={handleAutoGenerateTitle}
              isTitleGenerating={isTitleGenerating}
              titleGeneratingId={titleGeneratingId}
              titleInputRef={titleInputRef}
              shouldShowUsageTracker={shouldShowUsageTrackerValue}
            />
          )}
          <div className={styles["conversation-content"]}>
            {!activeConversation ? (
              <div className={styles["empty-conversation"]}>
                <h2>Select a conversation or start a new one</h2>
              </div>
            ) : (
              <>
                <div className={styles["messages-input-container"]}>
                  <div className={styles["messages-container"]}>
                    <ChatMessages
                      activeConversation={activeConversation}
                      isLoading={isLoading}
                      error={error}
                      copySuccess={copySuccess}
                      copyMessageToClipboard={copyMessageToClipboard}
                      explainCode={explainCode}
                      messagesEndRef={messagesEndRef}
                    />
                  </div>
                  <ChatInput
                    userInput={userInput}
                    setUserInput={setUserInput}
                    handleSubmit={handleSubmit}
                    isLoading={isLoading}
                    conversationHistory={activeConversation?.messages || []}
                    error={error}
                  />
                </div>
                {/* Model Insights Panel */}
                {selectedProvider === 'ollama' && (
                  <ModelInsights
                    originalPrompt={originalPrompt}
                    enhancedPrompt={enhancedPrompt}
                    recommendedModel={recommendedModel}
                    isEnhancing={isEnhancing}
                    isVisible={showInsights && enhancedPrompt !== originalPrompt}
                    onAcceptEnhancement={handleAcceptEnhancement}
                    onRejectEnhancement={handleRejectEnhancement}
                  />
                )}
                {/* END SUGGESTED NEXT STEPS PANEL */}
              </>
            )}
          </div>
          <ModelInfoFooter
            selectedModel={selectedModel}
            selectedProvider={selectedProvider}
          />
        </main>
      </div>
    </div>
  );
};

export default ChatInterface;
