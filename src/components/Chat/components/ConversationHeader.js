import React from 'react';
import { UsageTracker } from '../../shared/imports';
import { FiEdit2, FiSave, FiX } from 'react-icons/fi'; 
import { HiOutlineRefresh } from 'react-icons/hi';
import { BiSolidMagicWand } from 'react-icons/bi';
import { useNavigation, ROUTES } from '../../../contexts/NavigationContext';
import styles from './ConversationHeader.module.css';

const ConversationHeader = ({
  conversation,
  isEditingTitle,
  setIsEditingTitle,
  editedTitle,
  setEditedTitle,
  saveEditedTitle,
  cancelTitleEditing,
  handleAutoGenerateTitle,
  isTitleGenerating,
  titleGeneratingId,
  titleInputRef,
  shouldShowUsageTracker
}) => {
  const { navigateTo } = useNavigation();
  const handleShare = () => {
    if (!conversation?.id) return;
    const shareUrl = `${window.location.origin}/share/${conversation.id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => alert('Conversation link copied!'))
      .catch(err => console.error('Copy failed', err));
  };

  return (
    <div className={styles["conversation-header"]}>
      <div className={styles["header-title-section"]}>
        {isEditingTitle ? (
          <div className={styles["title-edit-container"]}>
            <input
              ref={titleInputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditedTitle();
                if (e.key === 'Escape') cancelTitleEditing();
              }}
              onBlur={saveEditedTitle}
              className={styles["title-edit-input"]}
              placeholder="Enter conversation title..."
            />
            <button className={styles["title-save-button"]} onClick={saveEditedTitle}>
              <FiSave size={16} /> 
              <span>Save</span>
            </button>
            <button className={styles["title-cancel-button"]} onClick={cancelTitleEditing}>
              <FiX size={16} /> 
              <span>Cancel</span>
            </button>
          </div>
        ) : (
          <div className={styles["chat-title-container"]}>
            <div className={styles["chat-title-wrapper"]}>
              <div className={styles["title-icon-wrapper"]}>
                <div className={styles["title-icon"]}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.5 12H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.5 8.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.5 15.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <h2 className={styles["chat-title"]}>
                {conversation && titleGeneratingId === conversation.id ? (
                  <div className={styles["title-generating"]}>
                    <span className={styles["auto-title-badge"]}>
                      <HiOutlineRefresh className={styles["spin-icon"]} size={12} />
                      Auto-naming
                    </span>
                    <span className={styles["title-dots"]}>
                      <span className={styles["dot"]}></span>
                      <span className={styles["dot"]}></span>
                      <span className={styles["dot"]}></span>
                    </span>
                  </div>
                ) : (
                  conversation?.title || "New Chat"
                )}
              </h2>
            </div>
            <div className={styles["title-actions"]}>
              <button 
                className={styles["title-edit-button"]}
                title="Edit title"
                onClick={() => setIsEditingTitle(true)}
                disabled={!conversation || titleGeneratingId === conversation.id}
              >
                <FiEdit2 size={16} />
                <span>Edit</span>
              </button>
              <button
                className={styles["auto-name-button"]}
                title="Auto-generate title based on conversation context"
                onClick={handleAutoGenerateTitle}
                disabled={!conversation || titleGeneratingId === conversation.id || !conversation?.messages?.length}
              >
                <BiSolidMagicWand size={16} />
                <span>Auto-name</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <div className={styles["header-actions-row"]}>
        {shouldShowUsageTracker && (
          <div className={styles["header-usage-section"]}>
            <UsageTracker forceDisplay={conversation?.provider === 'groq'} />
          </div>
        )}
        <div className={styles["conversation-controls"]}>
          <button className={styles["conversation-control-button"]} title="Share conversation" onClick={handleShare}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L15 6M15 6H10.5M15 6V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3C19.2 3 21 4.8 21 12C21 19.2 19.2 21 12 21C4.8 21 3 19.2 3 12C3 4.8 4.8 3 12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className={styles["conversation-control-button"]} title="Conversation settings" onClick={() => navigateTo(ROUTES.SETTINGS)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12.8799V11.1199C2 10.0799 2.85 9.21994 3.9 9.21994C5.71 9.21994 6.45 7.93994 5.54 6.36994C5.02 5.46994 5.33 4.29994 6.24 3.77994L7.97 2.78994C8.76 2.31994 9.78 2.59994 10.25 3.38994L10.36 3.57994C11.26 5.14994 12.74 5.14994 13.65 3.57994L13.76 3.38994C14.23 2.59994 15.25 2.31994 16.04 2.78994L17.77 3.77994C18.68 4.29994 18.99 5.46994 18.47 6.36994C17.56 7.93994 18.3 9.21994 20.11 9.21994C21.15 9.21994 22.01 10.0699 22.01 11.1199V12.8799C22.01 13.9199 21.16 14.7799 20.11 14.7799C18.3 14.7799 17.56 16.0599 18.47 17.6299C18.99 18.5399 18.68 19.6999 17.77 20.2199L16.04 21.2099C15.25 21.6799 14.23 21.3999 13.76 20.6099L13.65 20.4199C12.75 18.8499 11.27 18.8499 10.36 20.4199L10.25 20.6099C9.78 21.3999 8.76 21.6799 7.97 21.2099L6.24 20.2199C5.33 19.6999 5.02 18.5299 5.54 17.6299C6.45 16.0599 5.71 14.7799 3.9 14.7799C2.85 14.7799 2 13.9199 2 12.8799Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationHeader;
