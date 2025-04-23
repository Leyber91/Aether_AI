/**
 * Keyword extraction utilities for title generation fallbacks
 */

/**
 * Extract potential keywords from a message
 * @param {string} message - The message to extract keywords from
 * @returns {string[]} - Array of keywords
 */
export const extractKeywords = (message) => {
  if (!message) return [];
  
  // Simple keyword extraction - removes common words and punctuation
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'like', 'through', 'over', 'before',
    'after', 'between', 'under', 'during', 'without', 'of', 'this', 'that', 'these', 'those',
    'it', 'its', 'i', 'me', 'my', 'mine', 'you', 'your', 'yours', 'he', 'him', 'his', 'she',
    'her', 'hers', 'we', 'us', 'our', 'ours', 'they', 'them', 'their', 'theirs'
  ]);
  
  // Split by spaces and punctuation, filter out stop words, and keep only words with 3+ chars
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => !stopWords.has(word) && word.length >= 3);
  
  // Count word frequency
  const wordFrequency = {};
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  // Sort by frequency and return top words
  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(pair => pair[0]);
};
