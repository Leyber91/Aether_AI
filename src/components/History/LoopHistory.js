import React, { useEffect, useState } from 'react';
import './ChatHistory.css';

const LoopHistory = ({ onSelect }) => {
  const [loops, setLoops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/loop_conversations')
      .then(res => res.json())
      .then(data => {
        setLoops(data.conversations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="chat-history loop-history">
      <div className="chat-history-header">
        <h3 style={{marginBottom: 0}}>Loop Archive</h3>
      </div>
      <div className="conversations-list">
        {loading ? (
          <div>Loading...</div>
        ) : loops.length === 0 ? (
          <div className="no-conversations">
            <p>No loops yet</p>
            <p>Run MetaLoopLab to create one</p>
          </div>
        ) : (
          loops.map(loopId => (
            <div key={loopId} className="conversation-item" onClick={() => onSelect && onSelect(loopId)}>
              <div className="conversation-title">Loop {loopId}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LoopHistory;
