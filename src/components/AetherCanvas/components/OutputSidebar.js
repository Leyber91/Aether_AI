import React, { useRef, useEffect } from 'react';
import { ReactComponent as OutputIcon } from '../icons/OutputIcon.svg';
import styles from '../AetherCanvas.module.css';

const OutputSidebar = ({ outputLogs, showOutputSidebar, handleClearLog }) => {
  const outputLogScrollRef = useRef(null);
  useEffect(() => {
    if (outputLogScrollRef.current) {
      outputLogScrollRef.current.scrollTop = outputLogScrollRef.current.scrollHeight;
    }
  }, [outputLogs]);

  if (!showOutputSidebar) return null;
  return (
    <div className={styles.outputSidebar}>
      <div className={styles.outputSidebarHeader}>
        <OutputIcon style={{ marginRight: 8, fontSize: 20, verticalAlign: 'middle' }} />
        <span>Model Output Log</span>
        <button
          className={styles.clearLogBtn}
          onClick={handleClearLog}
          title="Clear Log"
          aria-label="Clear Log"
          style={{ marginLeft: 'auto', fontSize: 14 }}
        >
          Clear
        </button>
      </div>
      <div className={styles.outputSidebarBody}>
        <div className={styles.outputLogScroll} ref={outputLogScrollRef}>
          {outputLogs.map((line, i) => (
            <div key={i} className={styles.outputLogLine}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OutputSidebar;
