const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; // Ensure your API base URL is configured

/**
 * Calls the backend to initiate Hugging Face model import and quantization.
 * @param {object} data - The data for the request.
 * @param {string} data.hf_model_id - The Hugging Face model ID.
 * @param {string} data.target_quantization - The target GGUF quantization type.
 * @returns {Promise<object>} The response from the backend.
 */
export const importHfModel = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/aethercreator/import_hf_model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Attempt to parse error response from backend, or use default
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Not a JSON response
        errorData = { message: `HTTP error ${response.status}: ${response.statusText || 'Unknown error'}` };
      }
      throw new Error(errorData.detail || errorData.message || `HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in importHfModel service:', error);
    // Re-throw to be caught by the calling component
    throw error; 
  }
};

// Future AetherCreator specific API calls can be added here, for example:
// export const startQloraFinetune = async (qloraData) => { ... };
// export const getAetherCreatorJobStatus = async (jobId) => { ... }; 

/**
 * Calls the backend to generate an AI-optimized Modelfile configuration.
 * @param {object} modelfileRequest - The request data for Modelfile generation.
 * @param {string} modelfileRequest.task_description - Description of the task/use case.
 * @param {string} modelfileRequest.base_model - The base model to configure.
 * @param {string} modelfileRequest.model_type - Type of model (general, coding, creative, etc.).
 * @param {object} [modelfileRequest.hardware_constraints] - Optional hardware constraints.
 * @param {string} [modelfileRequest.additional_requirements] - Any additional requirements.
 * @returns {Promise<object>} The response with the generated Modelfile and explanations.
 */
export const generateModelfile = async (modelfileRequest) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/aether_creator/generate_modelfile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelfileRequest),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error ${response.status}: ${response.statusText || 'Unknown error'}` };
      }
      throw new Error(errorData.detail || errorData.message || `HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in generateModelfile service:', error);
    throw error;
  }
};

/**
 * Calls the backend to initiate QLoRA fine-tuning.
 * @param {object} qloraData - The data for the QLoRA fine-tuning request.
 * @param {string} qloraData.base_model_id - The base Hugging Face model ID.
 * @param {string} qloraData.dataset - The dataset path or ID.
 * @param {number} qloraData.rank - LoRA rank.
 * @param {number} qloraData.alpha - LoRA alpha.
 * @param {string[]} qloraData.target_modules - Array of target module names.
 * @param {number} qloraData.learning_rate - Learning rate.
 * @param {number} qloraData.epochs - Number of epochs.
 * @returns {Promise<object>} The response from the backend.
 */
export const startQloraFinetune = async (qloraData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/aethercreator/start_qlora_finetune`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(qloraData),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error ${response.status}: ${response.statusText || 'Unknown error'}` };
      }
      throw new Error(errorData.detail || errorData.message || `HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in startQloraFinetune service:', error);
    throw error;
  }
}; 