import React, { useState, useContext } from 'react';
import { ChatContext } from '../../contexts/ChatContext';
import './ChatHistory.css';

const ChatHistory = () => {
  // Get conversationState from context (not direct destructure)
  const context = useContext(ChatContext);
  const conversationState = context.conversationState || {};
  const conversationActions = context.conversationActions || {};
  const {
    conversations = [],
    activeConversationId,
    titleGeneratingId
  } = conversationState;
  const {
    createConversation = () => {},
    deleteConversation = () => {},
    updateConversationTitle = () => {},
    setActiveConversationById = () => {}
  } = conversationActions;

  const [editingConversationId, setEditingConversationId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  
  // Defensive check for conversations
  if (!Array.isArray(conversations)) {
    return null; // or render a fallback UI
  }
  
  // Handle clicking on a conversation
  const handleConversationClick = (conversationId) => {
    setActiveConversationById(conversationId);
  };
  
  // Start editing a conversation title
  const startEditing = (conversation, e) => {
    e.stopPropagation();
    setEditingConversationId(conversation.id);
    setEditTitle(conversation.title);
  };
  
  // Save edited title
  const saveTitle = (e) => {
    e.preventDefault();
    if (editingConversationId) {
      updateConversationTitle(editingConversationId, editTitle.trim() || 'New Conversation');
      setEditingConversationId(null);
      setEditTitle('');
    }
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingConversationId(null);
    setEditTitle('');
  };
  
  // Delete a conversation
  const handleDeleteConversation = (conversationId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(conversationId);
    }
  };
  
  // Create a new conversation
  const handleNewConversation = () => {
    createConversation();
  };
  
  // Format the date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Format the model name for display
  const formatModelName = (modelId) => {
    if (!modelId) return 'Unknown model';
    
    // Remove version numbers and shorten common prefixes
    return modelId
      .replace(/deepseek-r1-distill-/g, '')
      .replace(/llama-/g, '')
      .replace(/llama3-/g, '')
      .replace(/mixtral-/g, '')
      .replace(/-[\d.]+b$/g, '')
      .replace(/\.gguf$/, '');
  };

  return (
    <div className="chat-history">
      <div className="chat-history-header">
        <h3 style={{marginBottom: 0}}>Chat Archive</h3>
        <button className="new-chat-button fused-plus" onClick={handleNewConversation} title="New Conversation">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="fusedPlusGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#a6f1ff" stopOpacity="0.85"/>
                <stop offset="100%" stopColor="#244e82" stopOpacity="0.85"/>
              </radialGradient>
              <filter id="fusedPlusOuterGlow" x="-8" y="-8" width="48" height="48" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="3.5" result="blur"/>
              </filter>
            </defs>
            <rect x="2" y="2" width="28" height="28" rx="12" fill="#101824" stroke="#244e82" strokeWidth="2.5"/>
            <rect x="2" y="2" width="28" height="28" rx="12" fill="url(#fusedPlusGlow)" filter="url(#fusedPlusOuterGlow)"/>
            <g filter="url(#fusedPlusOuterGlow)">
              <rect x="15" y="9" width="2" height="14" rx="1" fill="#a6f1ff"/>
              <rect x="9" y="15" width="14" height="2" rx="1" fill="#a6f1ff"/>
            </g>
          </svg>
        </button>
      </div>
      
      <div className="conversations-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">
            <p>No conversations yet</p>
            <p>Start a new chat to begin</p>
          </div>
        ) : (
          conversations.map(conversation => (
            <div 
              key={conversation.id} 
              className={`conversation-item ${activeConversationId === conversation.id ? 'active' : ''} ${titleGeneratingId === conversation.id ? 'title-generating' : ''}`}
              onClick={() => handleConversationClick(conversation.id)}
            >
              {editingConversationId === conversation.id ? (
                <form onSubmit={saveTitle}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                    onBlur={saveTitle}
                    onKeyDown={e => e.key === 'Escape' && cancelEditing()}
                  />
                </form>
              ) : (
                <>
                  <div className="conversation-title">
                    {titleGeneratingId === conversation.id ? (
                      <>
                        <span className="auto-title-badge">Auto-naming</span>
                        <span className="title-dots">
                          <span className="dot"></span>
                          <span className="dot"></span>
                          <span className="dot"></span>
                        </span>
                      </>
                    ) : (
                      conversation.title
                    )}
                  </div>
                  <div className="conversation-meta">
                    <div className="conversation-model">
                      {conversation.provider === 'groq' ? 'Groq: ' : 'Ollama: '}
                      {formatModelName(conversation.modelId)}
                    </div>
                    <div className="conversation-date">{formatDate(conversation.updatedAt)}</div>
                  </div>
                  <div className="conversation-actions">
                    <button 
                      className="rename-button" 
                      onClick={(e) => startEditing(conversation, e)}
                      title="Rename conversation"
                      disabled={titleGeneratingId === conversation.id}
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-button" 
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      title="Delete conversation"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
