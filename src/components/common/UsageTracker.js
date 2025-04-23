import React, { useContext, useEffect, useState, useRef } from 'react';
import { ModelContext } from '../../contexts/ModelContext';
import { ChatContext } from '../../contexts/ChatContext';
import { getTokenUsageStats, getModelLimits } from '../../utils/tokenUsage';
import { calculateUsageMetrics } from '../../utils/usageMetrics';
import './UsageTracker.css';

/**
 * Renders a usage meter with label and progress bar
 */
const UsageMeter = ({ label, current, limit, percent, statusClass }) => {
  const unlimited = limit === -1;
  const formattedCurrent = typeof current === 'number' ? current.toLocaleString() : '0';
  const formattedLimit = unlimited ? '' : `/${typeof limit === 'number' ? limit.toLocaleString() : limit}`;
  
  return (
    <div className="usage-meter">
      <div className="usage-label">
        <span className="usage-label-text">{label}</span>
        <span className="usage-values">{formattedCurrent}{formattedLimit}</span>
      </div>
      <div className="usage-progress-container">
        <div 
          className={`usage-progress-bar ${statusClass}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

/**
 * UsageTracker component - displays token usage metrics for models
 */
const UsageTracker = ({ forceDisplay = false }) => {
  const { selectedProvider, selectedModel } = useContext(ModelContext);
  const { conversationHelpers = {} } = useContext(ChatContext);
  const { getActiveConversationData, getCurrentModelUsage } = conversationHelpers;
  const [metrics, setMetrics] = useState(null);
  const prevStatsRef = useRef(null);
  
  useEffect(() => {
    const activeConversation = getActiveConversationData();
    const isGroq = selectedProvider === 'groq' || (activeConversation && activeConversation.provider === 'groq');
    
    if (isGroq || forceDisplay) {
      const stats = getCurrentModelUsage ? getCurrentModelUsage() : { minute: { requests: 0 }, daily: { tokens: 0 } };
      const limits = getModelLimits(selectedModel || (activeConversation && activeConversation.modelId));
      
      const newMetrics = calculateUsageMetrics(stats, limits);
      setMetrics(newMetrics);
      prevStatsRef.current = stats;
    }
  }, [selectedProvider, selectedModel, getActiveConversationData, getCurrentModelUsage, forceDisplay]);
  
  if (!metrics) return null;
  
  return (
    <div className="usage-tracker">
      <div className="usage-header">
        <div className="usage-title">Usage</div>
        <div className="usage-model">{selectedModel}</div>
      </div>
      <div className="usage-meters">
        <UsageMeter 
          label="Tokens" 
          current={metrics.stats.daily.tokens} 
          limit={metrics.limits.tokensPerDay} 
          percent={metrics.dailyTokensPercent}
          statusClass={metrics.tokensClass}
        />
        <UsageMeter 
          label="Requests" 
          current={metrics.stats.minute.requests} 
          limit={metrics.limits.requestsPerMinute} 
          percent={metrics.minuteRequestsPercent}
          statusClass={metrics.requestsClass}
        />
      </div>
    </div>
  );
};

export default UsageTracker;
