// Central configuration file for environment variables and app settings
import { GROQ_MODELS } from './utils/groqModels';

const config = {
  // API keys
  groqApiKey: process.env.REACT_APP_GROQ_API_KEY || '',
  
  // API endpoints
  groqApiUrl: 'https://api.groq.com/openai/v1',
  ollamaApiUrl: '/ollama-api',
  
  // Use the predefined models from groqModels.js
  groqModels: GROQ_MODELS,
  
  // Default selected models
  defaultGroqModelId: 'llama3-8b-8192'
};

// Log available environment variables in development
// if (process.env.NODE_ENV === 'development') {
//   console.log(
//     'Available environment variables:',
//     Object.keys(process.env)
//       .filter(key => key.startsWith('REACT_APP_'))
//       .reduce((obj, key) => {
//         // Only log that keys exist, not their values (for security)
//         obj[key] = process.env[key] ? '[SET]' : '[NOT SET]';
//         return obj;
//       }, {})
//   );
// }

export default config;
