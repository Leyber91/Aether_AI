import React, { useContext, useState, useRef, useEffect } from 'react';
import { ChatContext } from '../../contexts/ChatContext';
import { ModelContext } from '../../contexts/ModelContext';
import './ConversationSwitcher.css';

const ConversationSwitcher = () => {
  const { conversationState, conversationActions } = useContext(ChatContext);
  const { conversations = [], activeConversationId } = conversationState;
  const { createConversation, setActiveConversationById, deleteConversation } = conversationActions;
  const { selectedProvider } = useContext(ModelContext);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => setOpen(prev => !prev);
  const handleNew = () => {
    createConversation('New Conversation');
    setOpen(false);
  };
  const handleSelect = (id) => {
    setActiveConversationById(id);
    setOpen(false);
  };
  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  return (
    <div
      ref={wrapperRef}
      className={`conversation-switcher${open ? ' conversation-switcher-dropdown' : ''}`}
    >
      <div className={`switcher-header${open ? ' compact' : ''}`}>          
        <h4 className="switcher-title-label">Recent Chats</h4>
        <div className="switcher-header-actions">
          <button className="switcher-new-btn" onClick={handleNew} title="New Conversation">
            + New
            <span className="switcher-provider-indicator" style={{marginLeft: 8, fontSize: '0.85em', color: selectedProvider === 'groq' ? '#7ad0ff' : '#b0b6c9'}}>
              ({selectedProvider === 'groq' ? 'Groq' : 'Ollama'})
            </span>
          </button>
          <button className="switcher-new-btn" onClick={toggleOpen} title="Toggle conversations">{open ? '▲' : '▼'}</button>
        </div>
      </div>
      <div style={{paddingLeft: 16, paddingBottom: 2, fontSize: '0.82em', color: '#8a94a7'}}>
        Provider for new chats is set above in the Model Selector.
      </div>
      {open && (
        <ul className="switcher-list">
          {conversations.length === 0 && <li className="switcher-empty">No conversations</li>}
          {conversations.map(conv => {
            const isActive = conv.id === activeConversationId;
            return (
              <li
                key={conv.id}
                className={`switcher-item${isActive ? ' active' : ''}`}
                onClick={() => handleSelect(conv.id)}
              >
                <div className="switcher-title">{conv.title}</div>
                {conv.provider && <div className="switcher-provider">{conv.provider}</div>}
                {!isActive && (
                  <button className="switcher-delete-btn" onClick={e => handleDelete(e, conv.id)} title="Delete conversation">×</button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ConversationSwitcher;