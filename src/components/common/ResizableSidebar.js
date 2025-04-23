import React, { useState, useEffect, useRef } from 'react';
import './ResizableSidebar.css';

const ResizableSidebar = ({ children, minWidth = 280, maxWidth = 500, defaultWidth = 280 }) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const resizeHandleRef = useRef(null);

  // Load saved width from localStorage if available
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (!isNaN(parsedWidth) && parsedWidth >= minWidth && parsedWidth <= maxWidth) {
        setWidth(parsedWidth);
      }
    }
  }, [minWidth, maxWidth]);

  // Handle mouse down on resize handle
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle mouse move while resizing
  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
    }
  };

  // Handle mouse up after resizing
  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Save the width preference to localStorage
    localStorage.setItem('sidebarWidth', width.toString());
  };

  // Handle double-click to reset to default width
  const handleDoubleClick = () => {
    setWidth(defaultWidth);
    localStorage.setItem('sidebarWidth', defaultWidth.toString());
  };

  return (
    <div 
      ref={sidebarRef}
      className="resizable-sidebar"
      style={{ width: `${width}px` }}
    >
      {children}
      {/* Resize handle removed as requested: it was not resizing anything or needed visually */}
    </div>
  );
};

export default ResizableSidebar;
