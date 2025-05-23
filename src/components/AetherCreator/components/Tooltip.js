import React, { useState } from 'react';
import styles from '../AetherCreator.module.css'; // Assuming we might want to use parent's styles for tooltipIcon

const Tooltip = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-block', verticalAlign: 'middle' }} // Added verticalAlign
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div style={{
          position: 'absolute',
          bottom: '125%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#333',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          zIndex: 1000,
          width: '250px',
          fontSize: '0.9em',
          border: '1px solid #555',
          boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
          textAlign: 'left', // Ensure text is aligned left
        }}>
          {text}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            marginLeft: '-5px',
            borderWidth: '5px',
            borderStyle: 'solid',
            borderColor: '#333 transparent transparent transparent'
          }} />
        </div>
      )}
    </div>
  );
};

export default Tooltip; 