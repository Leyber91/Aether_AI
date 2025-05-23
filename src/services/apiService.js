const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const apiService = {
  // AI Model Generation Workflow Methods
  async analyzeModelTask(data) {
    const response = await fetch(`${API_BASE_URL}/api/model/analyze_task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async createOptimizedModel(data) {
    const response = await fetch(`${API_BASE_URL}/api/model/create_optimized`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async runQLoRAFineTuning(data) {
    const response = await fetch(`${API_BASE_URL}/api/model/fine_tune_qlora`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async runIterativeRefinement(data) {
    const response = await fetch(`${API_BASE_URL}/api/model/iterative_refinement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async getPerformanceMetrics(modelPath, hardwareProfile = {}) {
    const params = new URLSearchParams({
      hardware_profile: JSON.stringify(hardwareProfile)
    });

    const response = await fetch(`${API_BASE_URL}/api/model/performance_metrics/${encodeURIComponent(modelPath)}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async getRefinementSuggestions(modelPath, hardwareProfile = {}) {
    const params = new URLSearchParams({
      modelPath: modelPath,
      hardwareProfile: JSON.stringify(hardwareProfile)
    });

    const response = await fetch(`${API_BASE_URL}/api/model/refinement_suggestions?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async getHardwareProfile() {
    const response = await fetch(`${API_BASE_URL}/api/hardware/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Unified Model Ecosystem Methods
  async createModelEcosystem(data) {
    const response = await fetch(`${API_BASE_URL}/api/ecosystem/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async listEcosystems() {
    const response = await fetch(`${API_BASE_URL}/api/ecosystem/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async getEcosystemDetails(ecosystemId) {
    const response = await fetch(`${API_BASE_URL}/api/ecosystem/${ecosystemId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async getModelCapabilities() {
    const response = await fetch(`${API_BASE_URL}/api/models/capabilities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async refreshModelRegistry() {
    const response = await fetch(`${API_BASE_URL}/api/models/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Chat Agent Method for AI Wizard
  async chatAgent(data) {
    const response = await fetch(`${API_BASE_URL}/api/chat_agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Ollama Management Methods
  async detectOllama() {
    const response = await fetch(`${API_BASE_URL}/api/ollama/detect`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async createOllamaModel(data) {
    const response = await fetch(`${API_BASE_URL}/api/ollama/create_model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async deleteOllamaModel(modelName) {
    const response = await fetch(`${API_BASE_URL}/api/ollama/models/${encodeURIComponent(modelName)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Existing methods would be added here...
  // For conversations, chat, etc.
};

export default apiService; 