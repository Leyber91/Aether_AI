import React from 'react';

/**
 * MessageTypeSelector Component
 * Allows selecting specific message types for structured prompting
 * Implements Blueprint 3.3.3 - Dynamic process flows and specialized UI
 * 
 * @param {Object} props - Component properties
 * @param {string} props.selectedType - Current selected message type
 * @param {Function} props.onTypeChange - Function to call when type changes
 * @param {boolean} props.disabled - Whether the selector is disabled
 * @returns {JSX.Element} - Rendered component
 */
const MessageTypeSelector = ({ selectedType, onTypeChange, disabled = false }) => {
  // Available message types with icon, label, description
  const messageTypes = [
    { 
      id: null, 
      icon: '📝', 
      label: 'Standard', 
      description: 'Default message without specific type'
    },
    { 
      id: 'analysis', 
      icon: '⚙️', 
      label: 'Analysis', 
      description: 'Detailed breakdown of concepts or information'
    },
    { 
      id: 'critique', 
      icon: '⚠️', 
      label: 'Critique', 
      description: 'Critical evaluation with feedback for improvement'
    },
    { 
      id: 'reflection', 
      icon: '↻', 
      label: 'Reflection', 
      description: 'Introspective reasoning about process or decisions'
    },
    { 
      id: 'summary', 
      icon: '◈', 
      label: 'Summary', 
      description: 'Concise overview of key points'
    },
    { 
      id: 'observation', 
      icon: '👁️', 
      label: 'Observation', 
      description: 'Direct statements about what is perceived'
    },
    { 
      id: 'question', 
      icon: '❓', 
      label: 'Question', 
      description: 'Inquiry designed to gather information'
    },
    { 
      id: 'action', 
      icon: '▶️', 
      label: 'Action', 
      description: 'Specific steps or recommendations to take'
    }
  ];

  return (
    <div className="message-type-selector">
      <label 
        htmlFor="message-type-select"
        style={{ 
          display: 'block', 
          marginBottom: '5px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#74d0fc'
        }}
      >
        Message Type:
      </label>
      <select
        id="message-type-select"
        value={selectedType || ''}
        onChange={(e) => onTypeChange(e.target.value === '' ? null : e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '8px',
          background: '#192436',
          color: '#e0f0ff',
          border: '1px solid #4ad3fa55',
          fontSize: '14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1
        }}
      >
        {messageTypes.map(type => (
          <option 
            key={type.id || 'standard'} 
            value={type.id || ''}
            style={{ padding: '8px' }}
          >
            {type.icon} {type.label}
          </option>
        ))}
      </select>
      
      {/* Description of selected type */}
      {selectedType !== undefined && (
        <div 
          style={{ 
            marginTop: '5px',
            fontSize: '12px',
            color: '#aaa',
            fontStyle: 'italic',
            paddingLeft: '2px'
          }}
        >
          {messageTypes.find(t => t.id === selectedType)?.description || 'Standard message without specific type'}
        </div>
      )}
    </div>
  );
};

export default MessageTypeSelector; 