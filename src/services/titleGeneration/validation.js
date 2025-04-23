/**
 * Title validation utilities for conversation auto-naming
 */

/**
 * Check if a title is valid
 * @param {string} title - The title to check
 * @returns {boolean} - Whether the title is valid
 */
export const isValidTitle = (title) => {
  if (!title) return false;
  
  // Remove common filler words for the word count check
  const cleanedTitle = title
    .replace(/^(the|a|an|title|conversation|chat|about)\s+/i, '')
    .trim();
  
  const wordCount = cleanedTitle.split(/\s+/).length;
  const charCount = cleanedTitle.length;
  
  // Title must be 1-6 words and 2-50 characters
  return wordCount >= 1 && wordCount <= 6 && charCount >= 2 && charCount <= 50;
};

/**
 * Clean up a generated title
 * @param {string} title - The raw title
 * @returns {string} - The cleaned title
 */
export const cleanupTitle = (title) => {
  if (!title) return '';
  if (typeof title !== 'string') title = String(title);
  return title
    .replace(/^['"]|['"]$/g, '') // Remove quotes at start/end
    .replace(/^Title:?\s*/i, '') // Remove "Title:" prefix if present
    .replace(/^Conversation About\s*/i, '') // Remove "Conversation About" prefix
    .replace(/^Chat About\s*/i, '') // Remove "Chat About" prefix
    .replace(/^About\s*/i, '') // Remove "About" prefix
    .replace(/\n/g, ' ') // Remove any newlines
    .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single
    .trim();
};

/**
 * Convert a string to title case
 * @param {string} str - The string to convert
 * @returns {string} - The title-cased string
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
