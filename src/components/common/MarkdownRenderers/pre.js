/**
 * Custom pre block renderer for MarkdownRenderer
 */
import React from 'react';
import createMarkdownRenderer from './createMarkdownRenderer';

export default createMarkdownRenderer('pre', 'md-pre');
