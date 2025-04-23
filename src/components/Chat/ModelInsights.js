import React from 'react';
import styles from './ModelInsights.module.css';

/**
 * ModelInsights component
 * Shows information about the model being used and prompt enhancements
 * Fits with the space theme using glassmorphic styling
 */
const ModelInsights = ({ 
  originalPrompt,
  enhancedPrompt,
  recommendedModel,
  isEnhancing,
  isVisible,
  onAcceptEnhancement,
  onRejectEnhancement
}) => {
  // Don't render if component shouldn't be visible
  if (!isVisible || (!originalPrompt && !enhancedPrompt)) {
    return null;
  }

  // Only show enhancement UI if there's an enhancement and it differs from original
  const hasEnhancement = enhancedPrompt && 
                         originalPrompt !== enhancedPrompt && 
                         !isEnhancing;

  // Helper function to truncate long text
  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={styles.modelInsights}>
      {isEnhancing ? (
        <div className={styles.insightsLoading}>
          <div className={styles.spinner}></div>
          <span>Analyzing your message...</span>
        </div>
      ) : (
        <>
          <div className={styles.insightsHeader}>
            <span className={styles.insightsTitle}>AI Insights</span>
            <span className={styles.modelBadge}>{recommendedModel}</span>
          </div>
          
          {hasEnhancement && (
            <div className={styles.promptEnhancement}>
              <div className={styles.enhancementLabel}>Suggested Enhancement:</div>
              <div className={styles.enhancementContent}>{truncateText(enhancedPrompt)}</div>
              
              <div className={styles.enhancementActions}>
                <button 
                  className={`${styles.enhancementButton} ${styles.accept}`}
                  onClick={onAcceptEnhancement}
                >
                  Use Enhanced
                </button>
                <button 
                  className={styles.enhancementButton}
                  onClick={onRejectEnhancement}
                >
                  Use Original
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ModelInsights;
