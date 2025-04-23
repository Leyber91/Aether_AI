import React, { useState, useRef } from 'react';
import styles from './Tooltip.module.css';

export default function Tooltip({ label, children, side = 'top' }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef();

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 100);
  };
  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <span
      className={styles.wrapper}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={-1}
    >
      {children}
      <span
        className={
          styles.tooltip +
          (visible ? ' ' + styles.visible : '') +
          ' ' + styles[side]
        }
        role="tooltip"
        aria-hidden={!visible}
      >
        {label}
        <span className={styles.arrow} />
      </span>
    </span>
  );
}
