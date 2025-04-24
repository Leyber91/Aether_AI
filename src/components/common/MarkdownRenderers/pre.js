/**
 * Custom pre block renderer for MarkdownRenderer
 */
// import React from 'react'; // Remove unused React import
import createMarkdownRenderer from './createMarkdownRenderer.js';

export default createMarkdownRenderer('pre', 'md-pre');
