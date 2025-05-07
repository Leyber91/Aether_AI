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
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const [explainLoading, setExplainLoading] = useState(false); // Add explainLoading state

  // Refs
  const messagesEndRef = useRef(null);
  const titleInputRef = useRef(null);

  // Context values
  const context = useContext(ChatContext);
  const conversationState = context && context.conversationState ? context.conversationState : {};
  const conversationActions = context && context.conversationActions ? context.conversationActions : {};
  const conversationHelpers = context && context.conversationHelpers ? context.conversationHelpers : {};
  const {
    conversations = [],
    activeConversationId,
    isLoading: isLoadingContext,
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
    sendMessage = () => {},
    updateLocalMessages = () => {}
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
   * @param {boolean} mcpEnabled - MCP toggle state
   */
  const handleSubmit = async (e, mcpEnabled) => {
    e.preventDefault();
    if (!userInput.trim() || isLoadingContext) return;

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
      // Pass MCP state to backend if needed (add as extra param or metadata)
      await sendMessage(activeConversation.id, messageToSend, { mcpEnabled });
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
   * Explains code found in a message by using the Ollama service
   * @param {string} messageId - ID of the message containing code
   * @param {string} content - Content of the message to analyze
   */
  const explainCode = async (messageId, content) => {
    try {
      setExplainLoading(true);
      
      // Extract code blocks from the message content
      const codeBlockRegex = /```([a-zA-Z0-9+-]+)?[\s\n]([^```]+)```/g;
      const inlineCodeRegex = /`([^`]+)`/g;
      
      let codeBlocks = [];
      let match;
      
      // Extract code blocks
      while ((match = codeBlockRegex.exec(content)) !== null) {
        codeBlocks.push({
          type: 'block',
          language: match[1] || 'text',
          code: match[2].trim()
        });
      }
      
      // If no code blocks found, look for inline code
      if (codeBlocks.length === 0) {
        while ((match = inlineCodeRegex.exec(content)) !== null) {
          codeBlocks.push({
            type: 'inline',
            language: 'text',
            code: match[1].trim()
          });
        }
      }
      
      let codeToExplain = '';
      
      if (codeBlocks.length > 0) {
        if (codeBlocks.length > 1) {
          // Explain all code blocks with context
          const allCodeContent = codeBlocks.map((block, index) => 
            `Block ${index + 1} (${block.language}):\n${block.code}`
          ).join('\n\n----- Next Block -----\n\n');
          
          codeToExplain = `Multiple code blocks found:\n\n${allCodeContent}`;
        } else {
          // Use the single code block for explanation
          codeToExplain = `Language: ${codeBlocks[0].language}\n${codeBlocks[0].code}`;
        }
      } else {
        // If no code blocks are found, use the entire content
        codeToExplain = content;
      }
      
      // More comprehensive prompt for better explanations
      const prompt = `You are a code explanation expert. Analyze and explain the following code clearly and comprehensively.
      
${codeToExplain}

Provide a structured explanation including:
1. Summary: A concise overview of what this code does
2. Key components: Breakdown of functions, classes, or major sections
3. Logic flow: How the code executes step by step
4. Notable patterns or techniques used
5. Potential improvements or issues to be aware of

If this doesn't appear to be code or is too simple to explain in depth, provide a brief explanation appropriate to the content.
Format your explanation with markdown for readability, using headers, lists, and code blocks where helpful.`;

      // Import and use Enhanced Ollama service
      const { enhanceTextWithOllama, OLLAMA_MODELS } = await import('../../services/enhancedOllamaService');
      
      // Select appropriate model based on code complexity
      const isComplexCode = codeToExplain.length > 500 || codeBlocks.length > 1;
      const modelToUse = isComplexCode 
        ? OLLAMA_MODELS.CODING  // Use CODING model for complex code
        : OLLAMA_MODELS.GENERAL; // Use GENERAL model for simpler code
      
      const response = await enhanceTextWithOllama(
        modelToUse,
        prompt,
        { 
          maxTokens: 1000, // Increased token limit for more comprehensive explanations
          temperature: 0.3 // Lower temperature for more focused responses
        }
      );
      
      // Display the explanation as a special message
      if (response) {
        // Create a well-formatted explanation message
        const explanationTitle = codeBlocks.length > 1 
          ? "## Code Explanation (Multiple Blocks)" 
          : "## Code Explanation";
          
        const explanationContent = `${explanationTitle}\n\n${response}`;
        
        // Create an explanation message
        const explanationMessage = {
          id: `explanation-${Date.now()}`,
          role: 'assistant',
          content: explanationContent,
          timestamp: new Date().toISOString(),
          isExplanation: true,
          parentMessageId: messageId,
          metadata: {
            explanationType: codeBlocks.length > 0 ? 'code' : 'text',
            codeType: codeBlocks.length > 0 ? codeBlocks[0].type : null,
            codeLanguage: codeBlocks.length > 0 ? codeBlocks[0].language : null,
            blocksCount: codeBlocks.length
          }
        };
        
        // Add the message to the conversation
        if (activeConversation && context.conversationHelpers.updateLocalMessages) {
          const updatedMessages = [...activeConversation.messages, explanationMessage];
          const updatedConversation = { ...activeConversation, messages: updatedMessages };
          
          // Sort messages chronologically
          const sortedMessages = [...updatedMessages].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          
          // Update the conversation with sorted messages
          const sortedConversation = {
            ...activeConversation,
            messages: sortedMessages
          };
          
          // Update conversation in context
          context.conversationHelpers.updateLocalMessages(sortedConversation);
          
          // Also save the conversation to persistence
          if (context.conversationHelpers.saveConversation) {
            context.conversationHelpers.saveConversation(sortedConversation);
          }
          
          // Scroll to the new explanation
          setTimeout(() => {
            const explanationElement = document.getElementById(`message-${explanationMessage.id}`);
            if (explanationElement) {
              explanationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      } else {
        setCopySuccess("Failed to generate code explanation.");
        setTimeout(() => setCopySuccess(''), 2000);
      }
    } catch (error) {
      console.error("Error explaining code:", error);
      setCopySuccess(`Error explaining code: ${error.message}`);
      setTimeout(() => setCopySuccess(''), 2000);
    } finally {
      setExplainLoading(false);
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
                      isLoading={isLoadingContext}
                      explainLoading={explainLoading}
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
                    isLoading={isLoadingContext}
                    conversationHistory={activeConversation.messages}
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
