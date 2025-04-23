# AI Chat Interface

A modular chat interface that can interact with both Groq and Ollama models.

## Features

- Chat with AI models from Groq
- Chat with locally hosted models via Ollama
- Automatic detection of available Ollama models
- Persistent chat history
- Modular architecture for easy extension

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Ollama installed locally (for local models)
- Groq API key (for Groq models)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with:
   ```
   REACT_APP_GROQ_API_KEY=your_groq_api_key
   ```
4. Start the development server:
   ```
   npm start
   ```

## Architecture

The application is built with a highly modular architecture:

- `/src/components`: React UI components
- `/src/services`: Service modules for Ollama and Groq
- `/src/hooks`: Custom React hooks
- `/src/contexts`: React contexts for state management
- `/src/utils`: Utility functions
- `/src/types`: TypeScript type definitions
