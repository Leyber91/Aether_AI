// Groq models with their rate limits
export const GROQ_MODELS = [
  {
    id: 'allam-2-7b',
    name: 'Allam 2 7B',
    requestsPerMinute: 30,
    requestsPerDay: 7000,
    tokensPerMinute: 6000,
    tokensPerDay: null // No limit
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B 16E Instruct',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: null // No limit
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick 17B 128E Instruct',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: null // No limit
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek Distill Llama 70B',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: null // No limit
  },
  {
    id: 'deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek Distill Qwen 32B',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: null // No limit
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma2 9B Instruct',
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 15000,
    tokensPerDay: 500000
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 6000,
    tokensPerDay: 500000
  },
  {
    id: 'llama-3.2-11b-vision-preview',
    name: 'Llama 3.2 11B Vision',
    requestsPerMinute: 30,
    requestsPerDay: 7000,
    tokensPerMinute: 7000,
    tokensPerDay: 500000
  },
  {
    id: 'llama-3.2-1b-preview',
    name: 'Llama 3.2 1B',
    requestsPerMinute: 30,
    requestsPerDay: 7000,
    tokensPerMinute: 7000,
    tokensPerDay: 500000
  },
  {
    id: 'llama-3.2-3b-preview',
    name: 'Llama 3.2 3B',
    requestsPerMinute: 30,
    requestsPerDay: 7000,
    tokensPerMinute: 7000,
    tokensPerDay: 500000
  },
  {
    id: 'llama-3.2-90b-vision-preview',
    name: 'Llama 3.2 90B Vision',
    requestsPerMinute: 15,
    requestsPerDay: 3500,
    tokensPerMinute: 7000,
    tokensPerDay: 250000
  },
  {
    id: 'llama-3.3-70b-specdec',
    name: 'Llama 3.3 70B SpecDec',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: 100000
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: 100000
  },
  {
    id: 'llama-guard-3-8b',
    name: 'Llama Guard 3 8B',
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 15000,
    tokensPerDay: 500000
  },
  {
    id: 'llama3-70b-8192',
    name: 'Llama 3 70B',
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 6000,
    tokensPerDay: 500000
  },
  {
    id: 'llama3-8b-8192',
    name: 'Llama 3 8B',
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 6000,
    tokensPerDay: 500000
  },
  {
    id: 'mistral-saba-24b',
    name: 'Mistral Saba 24B',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: 500000
  },
  {
    id: 'qwen-2.5-32b',
    name: 'Qwen 2.5 32B',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: null // No limit
  },
  {
    id: 'qwen-2.5-coder-32b',
    name: 'Qwen 2.5 Coder 32B',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: null // No limit
  },
  {
    id: 'qwen-qwq-32b',
    name: 'Qwen QWQ 32B',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: null // No limit
  }
];